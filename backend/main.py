
import Millennium
import PluginUtils
import json
import os
import subprocess
import time
import base64
import zipfile
import tempfile

# Initialize Logger first to capture import errors
logger = PluginUtils.Logger()

# Initialize global plugin variable
plugin = None

# Safe Import Block
def _auto_install_dependencies():
    import sys
    import subprocess
    import importlib.util

    # List of required packages
    requirements = ["httpx"]
    
    for package in requirements:
        if importlib.util.find_spec(package) is None:
            logger.log(f"mPhpMaster: Installing missing dependency: {package}...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
                logger.log(f"mPhpMaster: Successfully installed {package}")
            except Exception as e:
                logger.error(f"mPhpMaster: Failed to install {package}: {e}")

# Run dependency check before imports
_auto_install_dependencies()

BackendReady = False
BackendInitError = "Unknown error"
try:
    from mphpmaster_steam import detect_steam_install_path
    from mphpmaster_http import close_global_client
    from mphpmaster_api import APIManager
    from mphpmaster_manifest import mPhpMasterManifestManager
    from mphpmaster_steam import has_mphpmaster_for_app, list_mphpmaster_apps, get_game_install_path, search_config_file, update_config_token, check_xinput_dll, install_xinput_dll, install_xinput_from_zip, download_and_install_xinput, search_ea_config_file, update_ea_config_token, search_and_update_token
    from mphpmaster_config import VERSION
    from mphpmaster_fixes import (
        check_available_fixes,
        apply_game_fix,
        get_fix_status,
        cancel_fix,
        unfix_game,
        get_unfix_status,
        open_game_folder as open_folder,
        # Activation Files
        check_activation_files,
        download_activation_files,
        get_activation_status,
        cancel_activation_download
    )
    from mphpmaster_updater import (
        check_for_updates,
        download_and_apply_update,
        get_update_status,
        reset_update_state,
        apply_pending_update,
        start_auto_update_background_check,
        check_for_updates_now,
        get_last_message,
        store_last_message
    )
    
    try:
        import httpx
    except ImportError:
        httpx = None
        
    BackendReady = True

except Exception as e:
    logger.error(f"mPhpMaster: CRITICAL IMPORT ERROR: {e}")
    # Define placeholder VERSION if import failed
    VERSION = "ERROR"
    BackendInitError = str(e)


def json_response(data: dict) -> str:
    return json.dumps(data)

def success_response(**kwargs) -> str:
    return json_response({'success': True, **kwargs})

def error_response(error: str, **kwargs) -> str:
    return json_response({'success': False, 'error': error, **kwargs})

def GetPluginDir():
    current_file = os.path.realpath(__file__)

    if current_file.endswith('/main.py/main.py') or current_file.endswith('\\main.py\\main.py'):
        current_file = current_file[:-8]
    elif current_file.endswith('/main.py') or current_file.endswith('\\main.py'):
        current_file = current_file[:-8]

    if current_file.endswith('main.py'):
        backend_dir = os.path.dirname(current_file)
    else:
        backend_dir = current_file

    plugin_dir = os.path.dirname(backend_dir)

    return plugin_dir

def _get_asset_path(filename: str):
    plugin_dir = GetPluginDir()
    return os.path.join(plugin_dir, 'assets', filename)

class Plugin:
    def __init__(self):
        # Initialize instance variables
        self.plugin_dir = None
        self.backend_path = None
        self.api_manager = None
        self.mphpmaster_manifest_manager = None
        self._injected = False

    def _inject_webkit_files(self):
        if self._injected:
            return

        try:
            js_file_path = os.path.join(self.plugin_dir, '.millennium', 'Dist', 'index.js')

            if os.path.exists(js_file_path):
                Millennium.add_browser_js(js_file_path)
                self._injected = True
            else:
                logger.error(f"mPhpMaster: Bundle not found")
        except Exception as e:
            logger.error(f'mPhpMaster: Failed to inject: {e}')

    def _front_end_loaded(self):
        if BackendReady:
            logger.log(f"mPhpMaster: v{VERSION} ready")
        else:
            logger.error("mPhpMaster: Backend failed to load!")

    def _load(self):
        global plugin
        plugin = self  # Store instance for module-level functions

        if not BackendReady:
            logger.error("mPhpMaster: Backend import failed. Plugin running in limited mode.")
            self.plugin_dir = GetPluginDir() # Still need this for GetLocale
            self._inject_webkit_files() 
            Millennium.ready()
            return

        logger.log(f"mPhpMaster: backend loading (v{VERSION})")

        # Apple updates
        try:
            update_msg = apply_pending_update()
            if update_msg:
                logger.log(f"mPhpMaster: {update_msg}")
                store_last_message(update_msg)
        except Exception as e:
            logger.warn(f"mPhpMaster: Failed to apply pending update: {e}")

        # Initialize plugin components
        self.plugin_dir = GetPluginDir()
        self.backend_path = os.path.join(self.plugin_dir, 'backend')
        self.api_manager = APIManager(self.backend_path)
        self.mphpmaster_manifest_manager = mPhpMasterManifestManager(self.backend_path, self.api_manager)
        
        logger.log("mPhpMaster: backend initialized")

        self._inject_webkit_files()
        
        # Auto update check
        try:
            start_auto_update_background_check()
        except Exception as e:
            logger.warn(f"mPhpMaster: Failed to start auto-update: {e}")
        
        Millennium.ready()
        logger.log("mPhpMaster: backend ready")

    def _unload(self):
        logger.log("Unloading mPhpMaster plugin")
        if BackendReady:
            close_global_client()

def get_plugin():
    """Get the plugin instance. Millennium will have already instantiated it."""
    return plugin

# --- API ---


class Logger:
    @staticmethod
    def log(message: str) -> str:
        logger.log(message)
        return success_response(message="Logged")

def hasmPhpMasterForApp(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        exists = has_mphpmaster_for_app(appid)
        return success_response(exists=exists)
    except Exception as e:
        logger.error(f'hasmPhpMasterForApp failed for {appid}: {e}')
        return error_response(str(e))

def addViamPhpMasterManifest(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        if plugin and plugin.api_manager and plugin.mphpmaster_manifest_manager:
            endpoints = plugin.api_manager.get_download_endpoints()
            result = plugin.mphpmaster_manifest_manager.add_via_mphpmaster(appid, endpoints)
            return json_response(result)
        else:
             return error_response("Plugin manager not initialized")
    except Exception as e:
        logger.error(f'addViamPhpMasterManifest failed for {appid}: {e}')
        return error_response(str(e))

def GetStatus(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        if plugin and plugin.mphpmaster_manifest_manager:
            result = plugin.mphpmaster_manifest_manager.get_download_status(appid)
            return json_response(result)
        return error_response("Manager not initialized")
    except Exception as e:
        logger.error(f'GetStatus failed for {appid}: {e}')
        return error_response(str(e))

def GetLocalLibrary() -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        apps = list_mphpmaster_apps()
        return success_response(apps=apps)
    except Exception as e:
        logger.error(f'GetLocalLibrary failed: {e}')
        return error_response(str(e))

def GetLocale(locale: str) -> str:
    """Read locale file"""
    try:
        plugin_dir = GetPluginDir()
        locale_path = os.path.join(plugin_dir, 'locales', f'{locale}.json')
        
        if not os.path.exists(locale_path):
            return error_response(f'Locale file not found: {locale}.json')
        
        with open(locale_path, 'r', encoding='utf-8') as f:
            locale_data = json.load(f)
        
        return success_response(locale=locale_data)
    except Exception as e:
        logger.error(f'GetLocale failed for {locale}: {e}')
        return error_response(str(e))

def removeViamPhpMasterManifest(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        if plugin and plugin.mphpmaster_manifest_manager:
            result = plugin.mphpmaster_manifest_manager.remove_via_mphpmaster(appid)
            return json_response(result)
        return error_response("Manager not initialized")
    except Exception as e:
        logger.error(f'removeViamPhpMasterManifest failed for {appid}: {e}')
        return error_response(str(e))

# ==================== Game Fixes API ====================

def CheckForFixes(appid: int) -> str:
    if not BackendReady: return error_response(f"Backend not ready: {BackendInitError}")
    try:
        result = check_available_fixes(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'CheckForFixes failed for {appid}: {e}')
        return error_response(str(e))

def ApplyGameFix(appid: int, downloadUrl: str, installPath: str, fixType: str = "", gameName: str = "") -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = apply_game_fix(appid, downloadUrl, installPath, fixType, gameName)
        return json_response(result)
    except Exception as e:
        logger.error(f'ApplyGameFix failed for {appid}: {e}')
        return error_response(str(e))

def GetFixStatus(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = get_fix_status(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'GetFixStatus failed for {appid}: {e}')
        return error_response(str(e))

def CancelFix(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = cancel_fix(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'CancelFix failed for {appid}: {e}')
        return error_response(str(e))

def UnfixGame(appid: int, installPath: str = "", fixDate: str = "") -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = unfix_game(appid, installPath, fixDate)
        return json_response(result)
    except Exception as e:
        logger.error(f'UnfixGame failed for {appid}: {e}')
        return error_response(str(e))

def GetUnfixStatus(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = get_unfix_status(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'GetUnfixStatus failed for {appid}: {e}')
        return error_response(str(e))

def OpenGameFolder(path: str) -> str:
    """فتح مجلد اللعبة"""
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = open_folder(path)
        return json_response(result)
    except Exception as e:
        logger.error(f'OpenGameFolder failed: {e}')
        return error_response(str(e))

# ==================== Activation Files API ====================

def CheckActivationFiles(appid: int) -> str:
    if not BackendReady: return error_response(f"Backend not ready: {BackendInitError}")
    try:
        result = check_activation_files(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'CheckActivationFiles failed for {appid}: {e}')
        return error_response(str(e))

def DownloadActivationFiles(appid: int, installPath: str) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = download_activation_files(appid, installPath)
        return json_response(result)
    except Exception as e:
        logger.error(f'DownloadActivationFiles failed for {appid}: {e}')
        return error_response(str(e))

def GetActivationStatus(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = get_activation_status(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'GetActivationStatus failed for {appid}: {e}')
        return error_response(str(e))

def CancelActivationDownload(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = cancel_activation_download(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'CancelActivationDownload failed for {appid}: {e}')
        return error_response(str(e))

def RestartSteam() -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        backend_path = plugin.backend_path
        cmd_file = os.path.join(backend_path, "restart_steam.cmd")

        logger.log(f"Searching for restart script at: {cmd_file}")

        if not os.path.exists(cmd_file):
            logger.error(f"Restart script not found at the expected path.")
            return error_response(f"Required script not found: {cmd_file}")

        steam_path = detect_steam_install_path()
        if not steam_path:
            return error_response("Could not find Steam installation path.")

        steam_exe = os.path.join(steam_path, "steam.exe")
        if not os.path.exists(steam_exe):
            return error_response(f"steam.exe not found at {steam_exe}")

        logger.log(f"Executing {cmd_file} to restart Steam...")
        subprocess.Popen(
            [cmd_file, steam_exe],
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        
        return success_response(message="Steam restart command issued.")

    except Exception as e:
        logger.error(f'RestartSteam failed: {e}')
        return error_response(str(e))

# ==================== Update System API ====================

def CheckForUpdates() -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = check_for_updates()
        return json_response(result)
    except Exception as e:
        logger.error(f'CheckForUpdates failed: {e}')
        return error_response(str(e))

def DownloadAndApplyUpdate(downloadUrl: str = "") -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = download_and_apply_update(downloadUrl)
        return json_response(result)
    except Exception as e:
        logger.error(f'DownloadAndApplyUpdate failed: {e}')
        return error_response(str(e))

def GetUpdateStatus() -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = get_update_status()
        return json_response(result)
    except Exception as e:
        logger.error(f'GetUpdateStatus failed: {e}')
        return error_response(str(e))

def ResetUpdateState() -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = reset_update_state()
        return json_response(result)
    except Exception as e:
        logger.error(f'ResetUpdateState failed: {e}')
        return error_response(str(e))

def CheckForUpdatesNow() -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = check_for_updates_now()
        return json_response(result)
    except Exception as e:
        logger.error(f'CheckForUpdatesNow failed: {e}')
        return error_response(str(e))

def GetUpdateMessage() -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        message = get_last_message()
        return success_response(message=message)
    except Exception as e:
        logger.error(f'GetUpdateMessage failed: {e}')
        return error_response(str(e))

def GetLogoData() -> str:
    """Return base64 data URI for the bundled logo (assets/mphpmaster-logo.png)."""
    try:
        path = _get_asset_path('mphpmaster-logo.png')
        if not os.path.exists(path):
            return error_response('Logo file not found')
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('ascii')
        return success_response(data=f"data:image/png;base64,{b64}")
    except Exception as e:
        logger.error(f'GetLogoData failed: {e}')
        return error_response(str(e))

# ==================== Token Configuration API ====================

def GetGameInstallPath(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = get_game_install_path(appid)
        return json_response(result)
    except Exception as e:
        logger.error(f'GetGameInstallPath failed for {appid}: {e}')
        return error_response(str(e))

def SearchGameInAllDrives(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        try:
            from mphpmaster_fixes import SPECIAL_PATH_GAMES, _find_game_in_all_drives
        except Exception as import_err:
            return error_response(f"Could not load game search module: {import_err}")
        
        if appid not in SPECIAL_PATH_GAMES:
            return error_response("This game does not support drive search")
        
        config = SPECIAL_PATH_GAMES[appid]
        game_folder = config.get("game_folder", "")
        search_path = config.get("search_path", "")
        
        if not game_folder:
            return error_response("Game folder name not configured")
        
        logger.log(f"mPhpMaster: Searching for '{game_folder}' in all drives...")
        
        found_path = _find_game_in_all_drives(game_folder, search_path)
        
        if found_path:
            logger.log(f"mPhpMaster: Found game at {found_path}")
            return success_response(installPath=found_path, message=f"Found game at {found_path}")
        else:
            logger.log(f"mPhpMaster: Game not found in any drive")
            return error_response("Game not found in any drive")
    
    except Exception as e:
        logger.error(f'SearchGameInAllDrives failed for {appid}: {e}')
        return error_response(str(e))

def SearchConfigFile(appid: int, filename: str = "") -> str:
    """
    البحث عن ملف التوكن - يكتشف نوع اللعبة تلقائياً
    Steam: configs.user.ini
    EA: anadius.cfg
    """
    if not BackendReady: return error_response("Backend not ready")
    try:
        path_result = get_game_install_path(appid)
        if not path_result.get('success'):
            return json_response(path_result)
        
        game_path = path_result.get('installPath')
        
        # إذا تم تحديد اسم ملف معين
        if filename:
            result = search_config_file(game_path, filename)
            return json_response(result)
        
        # البحث التلقائي - Steam أولاً ثم EA
        all_files = []
        game_type = None
        
        # Steam
        steam_result = search_config_file(game_path, "configs.user.ini")
        if steam_result.get('success'):
            game_type = "Steam"
            all_files.extend(steam_result.get('files', []))
        
        # EA
        ea_result = search_ea_config_file(game_path, "anadius.cfg")
        if ea_result.get('success'):
            game_type = "EA" if not game_type else "Steam+EA"
            all_files.extend(ea_result.get('files', []))
        
        if all_files:
            return json_response({
                "success": True,
                "files": all_files,
                "count": len(all_files),
                "gameType": game_type
            })
        else:
            return json_response({
                "success": False,
                "error": "No config file found (configs.user.ini or anadius.cfg)",
                "files": [],
                "gamePath": game_path
            })
            
    except Exception as e:
        logger.error(f'SearchConfigFile failed for {appid}: {e}')
        return error_response(str(e))

def UpdateConfigToken(appid: int, token: str) -> str:
    """
    تحديث التوكن - يكتشف نوع اللعبة تلقائياً (Steam أو EA)
    Steam: يبحث عن configs.user.ini
    EA: يبحث عن anadius.cfg
    """
    if not BackendReady: return error_response("Backend not ready")
    try:
        # First get game path
        path_result = get_game_install_path(appid)
        if not path_result.get('success'):
            return json_response(path_result)
        
        game_path = path_result.get('installPath')
        
        updated_files = []
        errors = []
        game_type = None
        
        # ═══════════════════════════════════════════════════════════
        # محاولة 1: Steam (configs.user.ini)
        # ═══════════════════════════════════════════════════════════
        steam_search = search_config_file(game_path, "configs.user.ini")
        if steam_search.get('success'):
            game_type = "Steam"
            files = steam_search.get('files', [])
            for file_path in files:
                update_result = update_config_token(file_path, token)
                if update_result.get('success'):
                    updated_files.append(file_path)
                else:
                    errors.append(f"Steam: {update_result.get('error')}")
        
        # ═══════════════════════════════════════════════════════════
        # محاولة 2: EA (anadius.cfg)
        # ═══════════════════════════════════════════════════════════
        ea_search = search_ea_config_file(game_path, "anadius.cfg")
        if ea_search.get('success'):
            game_type = "EA" if not game_type else "Steam+EA"
            files = ea_search.get('files', [])
            for file_path in files:
                update_result = update_ea_config_token(file_path, token)
                if update_result.get('success'):
                    updated_files.append(file_path)
                else:
                    errors.append(f"EA: {update_result.get('error')}")
        
        # ═══════════════════════════════════════════════════════════
        # النتيجة
        # ═══════════════════════════════════════════════════════════
        if updated_files:
            return success_response(
                message=f"Token updated in {len(updated_files)} file(s)",
                updatedFiles=updated_files,
                gameType=game_type,
                errors=errors if errors else None
            )
        else:
            # لم يتم العثور على أي ملف
            return error_response(
                "No config file found. Looking for: configs.user.ini (Steam) or anadius.cfg (EA)",
                gamePath=game_path,
                errors=errors if errors else None
            )
    
    except Exception as e:
        logger.error(f'UpdateConfigToken failed for {appid}: {e}')
        return error_response(str(e))


# ==================== EA Games Token API ====================

def SearchEAConfigFile(appid: int, filename: str = "anadius.cfg") -> str:
    """البحث عن ملف anadius.cfg في مجلد اللعبة (EA Games)"""
    if not BackendReady: return error_response("Backend not ready")
    try:
        path_result = get_game_install_path(appid)
        if not path_result.get('success'):
            return json_response(path_result)
        
        game_path = path_result.get('installPath')
        result = search_ea_config_file(game_path, filename)
        return json_response(result)
    except Exception as e:
        logger.error(f'SearchEAConfigFile failed for {appid}: {e}')
        return error_response(str(e))


def UpdateEAConfigToken(appid: int, token: str) -> str:
    """تحديث التوكن في ملف anadius.cfg (EA Games)"""
    if not BackendReady: return error_response("Backend not ready")
    try:
        # Get game path
        path_result = get_game_install_path(appid)
        if not path_result.get('success'):
            return json_response(path_result)
        
        game_path = path_result.get('installPath')
        
        # Search for EA config file
        search_result = search_ea_config_file(game_path, "anadius.cfg")
        if not search_result.get('success'):
            return json_response(search_result)
        
        # Update token in all found files
        files = search_result.get('files', [])
        updated_files = []
        errors = []
        
        for file_path in files:
            update_result = update_ea_config_token(file_path, token)
            if update_result.get('success'):
                updated_files.append(file_path)
            else:
                errors.append(f"{file_path}: {update_result.get('error')}")
        
        if updated_files:
            return success_response(
                message=f"EA Token updated in {len(updated_files)} file(s)",
                updatedFiles=updated_files,
                gameType="EA",
                errors=errors if errors else None
            )
        else:
            return error_response("Failed to update any EA config files", errors=errors, gameType="EA")
    
    except Exception as e:
        logger.error(f'UpdateEAConfigToken failed for {appid}: {e}')
        return error_response(str(e))


def UpdateGameToken(appid: int, token: str) -> str:
    """
    تحديث التوكن تلقائياً - يكتشف نوع اللعبة (Steam أو EA)
    يبحث عن configs.user.ini (Steam) أو anadius.cfg (EA)
    """
    if not BackendReady: return error_response("Backend not ready")
    try:
        # Get game path
        path_result = get_game_install_path(appid)
        if not path_result.get('success'):
            return json_response(path_result)
        
        game_path = path_result.get('installPath')
        
        # Use the unified search and update function
        result = search_and_update_token(game_path, token)
        return json_response(result)
    
    except Exception as e:
        logger.error(f'UpdateGameToken failed for {appid}: {e}')
        return error_response(str(e))


# ==================== Ubisoft Token API ====================

def ReadUbisoftTokenReq(appid: int) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        # Get game path
        path_result = get_game_install_path(appid)
        if not path_result.get('success'):
            return json_response(path_result)
        
        game_path = path_result.get('installPath')
        
        # Search for token.req.txt
        search_result = search_config_file(game_path, "token_req.txt")
        if not search_result.get('success'):
            return json_response({
                "success": False,
                "error": "ملف token_req.txt غير موجود",
                "gamePath": game_path
            })
        
        # Read the first found file
        files = search_result.get('files', [])
        if files:
            file_path = files[0]
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                return success_response(
                    content=content,
                    filePath=file_path,
                    gamePath=game_path
                )
            except Exception as read_err:
                return error_response(f"Failed to read file: {read_err}")
        
        return error_response("No token_req.txt found")
    
    except Exception as e:
        logger.error(f'ReadUbisoftTokenReq failed for {appid}: {e}')
        return error_response(str(e))


def CreateUbisoftToken(appid: int, token: str) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        # Get game path
        path_result = get_game_install_path(appid)
        if not path_result.get('success'):
            return json_response(path_result)
        
        game_path = path_result.get('installPath')
        
        # First, find where token.req.txt is located (use same directory)
        search_result = search_config_file(game_path, "token_req.txt")
        
        if search_result.get('success') and search_result.get('files'):
            # Use the same directory as token.req.txt
            req_file = search_result.get('files')[0]
            target_dir = os.path.dirname(req_file)
        else:
            # Fall back to game root directory
            target_dir = game_path
        
        # Create token.ini
        token_file_path = os.path.join(target_dir, "token.ini")
        
        try:
            with open(token_file_path, "w", encoding="utf-8") as f:
                f.write(token)
            
            return success_response(
                message="تم إنشاء ملف token.ini بنجاح!",
                filePath=token_file_path,
                gamePath=game_path
            )
        except Exception as write_err:
            return error_response(f"Failed to create token.ini: {write_err}")
    
    except Exception as e:
        logger.error(f'CreateUbisoftToken failed for {appid}: {e}')
        return error_response(str(e))


def CopyFileToClipboard(filePath: str) -> str:
    if not BackendReady: return error_response("Backend not ready")
    try:
        if not os.path.exists(filePath):
            return error_response("File does not exist")
        
        # Use PowerShell to set the clipboard
        # Set-Clipboard -Path "..." copies the file object (readable by Explorer, Discord, etc.)
        cmd = f'powershell -command "Set-Clipboard -Path \'{filePath}\'"'
        subprocess.run(cmd, shell=True, check=True)
        
        return success_response(message="File copied to clipboard")
    except subprocess.CalledProcessError as e:
        logger.error(f'CopyFileToClipboard failed: {e}')
        return error_response("Failed to copy file")
    except Exception as e:
        logger.error(f'CopyFileToClipboard failed: {str(e)}')
        return error_response(str(e))


def CheckXinputDll() -> str:
    """Check if xinput1_4.dll exists in Steam directory"""
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = check_xinput_dll()
        return json_response(result)
    except Exception as e:
        logger.error(f'CheckXinputDll failed: {e}')
        return error_response(str(e))


def InstallXinputDll(dllContentBase64: str) -> str:
    """Install xinput1_4.dll to Steam directory"""
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = install_xinput_dll(dllContentBase64)
        return json_response(result)
    except Exception as e:
        logger.error(f'InstallXinputDll failed: {e}')
        return error_response(str(e))


def InstallXinputFromZip(zipContentBase64: str) -> str:
    """Extract and install xinput1_4.dll from ZIP file to Steam directory"""
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = install_xinput_from_zip(zipContentBase64)
        return json_response(result)
    except Exception as e:
        logger.error(f'InstallXinputFromZip failed: {e}')
        return error_response(str(e))


def DownloadAndInstallXinput() -> str:
    """Download xinput1_4.dll from GitHub and install to Steam directory"""
    if not BackendReady: return error_response("Backend not ready")
    try:
        result = download_and_install_xinput()
        return json_response(result)
    except Exception as e:
        logger.error(f'DownloadAndInstallXinput failed: {e}')
        return error_response(str(e))
