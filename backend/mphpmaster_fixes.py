"""
═════════════════════════════════════════════════════════════
  mPhpMaster Fixes - نظام إصلاحات الألعاب
  
  Developer: mPhpMaster
  Discord: https://discord.gg/cwpNMFgruV
  © 2026 mPhpMaster - All Rights Reserved
═════════════════════════════════════════════════════════════
"""

import os
import threading
import zipfile
import tempfile
import string
from typing import Dict, Any, Optional
import PluginUtils

logger = PluginUtils.Logger()

# قاموس الألعاب التي تحتاج بحث خاص في الأقراص
SPECIAL_PATH_GAMES = {
    # Mafia: The Old Country
    3225740: {
        "game_folder": "Mafia The Old Country",
        "search_path": "steamapps/common"
    }
}

# حالة التحميل والإصلاحات
_fix_state: Dict[int, Dict[str, Any]] = {}
_fix_lock = threading.Lock()

_activation_state: Dict[int, Dict[str, Any]] = {}
_activation_lock = threading.Lock()


# ═══════════════════════════════════════════════════════════
#                    الوظائف المساعدة
# ═══════════════════════════════════════════════════════════

def _find_game_in_all_drives(game_folder: str, search_path: str = "") -> Optional[str]:
    """البحث عن مجلد اللعبة في جميع الأقراص"""
    try:
        # جلب قائمة الأقراص المتاحة
        drives = [f"{d}:\\" for d in string.ascii_uppercase if os.path.exists(f"{d}:\\")]
        
        for drive in drives:
            if search_path:
                search_dir = os.path.join(drive, search_path, game_folder)
            else:
                search_dir = os.path.join(drive, game_folder)
            
            if os.path.exists(search_dir) and os.path.isdir(search_dir):
                logger.log(f"mPhpMaster: Found game at {search_dir}")
                return search_dir
        
        return None
    except Exception as e:
        logger.error(f"mPhpMaster: Error in drive search: {e}")
        return None


# ═══════════════════════════════════════════════════════════
#                    Game Fixes API
# ═══════════════════════════════════════════════════════════

def check_available_fixes(appid: int) -> Dict[str, Any]:
    """فحص إذا كان هناك إصلاحات متاحة للعبة"""
    try:
        # TODO: تنفيذ الفحص الفعلي مع الـ API
        return {
            "success": True,
            "hasFixAvailable": False,
            "message": "No fixes available for this game"
        }
    except Exception as e:
        logger.error(f"mPhpMaster: check_available_fixes failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


def apply_game_fix(appid: int, download_url: str, install_path: str, fix_type: str = "", game_name: str = "") -> Dict[str, Any]:
    """تطبيق إصلاح على اللعبة"""
    try:
        with _fix_lock:
            _fix_state[appid] = {
                "status": "queued",
                "progress": 0,
                "message": "Queued for download"
            }
        
        # TODO: تنفيذ التحميل والتطبيق الفعلي
        return {"success": True, "message": "Fix application started"}
    except Exception as e:
        logger.error(f"mPhpMaster: apply_game_fix failed for {appid}: {e}")
        with _fix_lock:
            _fix_state[appid] = {"status": "failed", "error": str(e)}
        return {"success": False, "error": str(e)}


def get_fix_status(appid: int) -> Dict[str, Any]:
    """الحصول على حالة الإصلاح"""
    try:
        with _fix_lock:
            state = _fix_state.get(appid, {})
        return {"success": True, "state": state}
    except Exception as e:
        logger.error(f"mPhpMaster: get_fix_status failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


def cancel_fix(appid: int) -> Dict[str, Any]:
    """إلغاء تطبيق الإصلاح"""
    try:
        with _fix_lock:
            if appid in _fix_state:
                _fix_state[appid]["status"] = "cancelled"
        return {"success": True, "message": "Fix cancelled"}
    except Exception as e:
        logger.error(f"mPhpMaster: cancel_fix failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


def unfix_game(appid: int, install_path: str = "", fix_date: str = "") -> Dict[str, Any]:
    """إزالة الإصلاح من اللعبة"""
    try:
        # TODO: تنفيذ إزالة الإصلاح الفعلية
        return {"success": True, "message": "Game unfix started"}
    except Exception as e:
        logger.error(f"mPhpMaster: unfix_game failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


def get_unfix_status(appid: int) -> Dict[str, Any]:
    """الحصول على حالة إزالة الإصلاح"""
    try:
        # TODO: تنفيذ الفحص الفعلي
        return {"success": True, "state": {}}
    except Exception as e:
        logger.error(f"mPhpMaster: get_unfix_status failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


def open_game_folder(path: str) -> Dict[str, Any]:
    """فتح مجلد اللعبة في File Explorer"""
    try:
        if not os.path.exists(path):
            return {"success": False, "error": "Path does not exist"}
        
        import subprocess
        subprocess.Popen(f'explorer "{path}"')
        return {"success": True, "message": "Folder opened"}
    except Exception as e:
        logger.error(f"mPhpMaster: open_game_folder failed: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════
#                    Activation Files API
# ═══════════════════════════════════════════════════════════

def check_activation_files(appid: int) -> Dict[str, Any]:
    """فحص إذا كان هناك ملفات تفعيل متاحة للعبة"""
    try:
        # TODO: تنفيذ الفحص الفعلي
        return {
            "success": True,
            "hasActivationFiles": False,
            "message": "No activation files available"
        }
    except Exception as e:
        logger.error(f"mPhpMaster: check_activation_files failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


def download_activation_files(appid: int, install_path: str) -> Dict[str, Any]:
    """تحميل ملفات التفعيل"""
    try:
        with _activation_lock:
            _activation_state[appid] = {
                "status": "queued",
                "progress": 0,
                "message": "Queued for download"
            }
        
        # TODO: تنفيذ التحميل الفعلي
        return {"success": True, "message": "Activation files download started"}
    except Exception as e:
        logger.error(f"mPhpMaster: download_activation_files failed for {appid}: {e}")
        with _activation_lock:
            _activation_state[appid] = {"status": "failed", "error": str(e)}
        return {"success": False, "error": str(e)}


def get_activation_status(appid: int) -> Dict[str, Any]:
    """الحصول على حالة تحميل ملفات التفعيل"""
    try:
        with _activation_lock:
            state = _activation_state.get(appid, {})
        return {"success": True, "state": state}
    except Exception as e:
        logger.error(f"mPhpMaster: get_activation_status failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


def cancel_activation_download(appid: int) -> Dict[str, Any]:
    """إلغاء تحميل ملفات التفعيل"""
    try:
        with _activation_lock:
            if appid in _activation_state:
                _activation_state[appid]["status"] = "cancelled"
        return {"success": True, "message": "Activation download cancelled"}
    except Exception as e:
        logger.error(f"mPhpMaster: cancel_activation_download failed for {appid}: {e}")
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════
#                    الدوال المُصدَّرة
# ═══════════════════════════════════════════════════════════

__all__ = [
    "SPECIAL_PATH_GAMES",
    "_find_game_in_all_drives",
    "check_available_fixes",
    "apply_game_fix",
    "get_fix_status",
    "cancel_fix",
    "unfix_game",
    "get_unfix_status",
    "open_game_folder",
    "check_activation_files",
    "download_activation_files",
    "get_activation_status",
    "cancel_activation_download",
]
