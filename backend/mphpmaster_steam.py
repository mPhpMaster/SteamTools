"""
═════════════════════════════════════════════════════════════
  mPhpMaster Steam - أدوات Steam والمسارات
  
  Developer: mPhpMaster
  Discord: https://discord.gg/cwpNMFgruV
  © 2026 mPhpMaster - All Rights Reserved
═════════════════════════════════════════════════════════════
"""

import os
import sys
import subprocess
from typing import Optional
import Millennium
import PluginUtils

logger = PluginUtils.Logger()

if sys.platform.startswith('win'):
    try:
        import winreg
    except Exception:
        winreg = None

_steam_install_path: Optional[str] = None
_stplug_in_path_cache: Optional[str] = None

def detect_steam_install_path() -> str:
    global _steam_install_path

    if _steam_install_path:
        return _steam_install_path

    path = None

    if sys.platform.startswith('win') and winreg is not None:
        try:
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
                path, _ = winreg.QueryValueEx(key, 'SteamPath')
        except Exception:
            path = None

    if not path:
        try:
            path = Millennium.steam_path()
        except Exception:
            path = None

    _steam_install_path = path
    return _steam_install_path or ''

def get_steam_config_path() -> str:
    steam_path = detect_steam_install_path()
    if not steam_path:
        raise RuntimeError("Steam installation path not found")
    return os.path.join(steam_path, 'config')

def get_stplug_in_path() -> str:
    global _stplug_in_path_cache

    if _stplug_in_path_cache:
        return _stplug_in_path_cache

    config_path = get_steam_config_path()
    stplug_path = os.path.join(config_path, 'stplug-in')
    os.makedirs(stplug_path, exist_ok=True)
    _stplug_in_path_cache = stplug_path
    return stplug_path

def get_depotcache_path() -> str:
    steam_path = detect_steam_install_path()
    if not steam_path:
        raise RuntimeError("Steam installation path not found")
    
    depot_path = os.path.join(steam_path, 'depotcache')
    os.makedirs(depot_path, exist_ok=True)
    return depot_path

def has_mphpmaster_for_app(appid: int) -> bool:
    try:
        base_path = detect_steam_install_path()
        if not base_path:
            return False

        stplug_path = os.path.join(base_path, 'config', 'stplug-in')
        lua_file = os.path.join(stplug_path, f'{appid}.lua')
        disabled_file = os.path.join(stplug_path, f'{appid}.lua.disabled')

        exists = os.path.exists(lua_file) or os.path.exists(disabled_file)
        return exists

    except Exception as e:
        logger.error(f'mPhpMaster (steam_utils): Error checking Lua scripts for app {appid}: {e}')
        return False

def list_mphpmaster_apps() -> list:
    try:
        base_path = detect_steam_install_path()
        if not base_path:
            return []

        stplug_path = os.path.join(base_path, 'config', 'stplug-in')
        if not os.path.exists(stplug_path):
            return []

        apps_mtime = {}
        for filename in os.listdir(stplug_path):
            if filename.endswith('.lua') or filename.endswith('.lua.disabled'):
                name = filename.split('.')[0]
                if not name.isdigit():
                    continue
                appid = int(name)
                path = os.path.join(stplug_path, filename)
                try:
                    mtime = os.path.getmtime(path)
                    apps_mtime[appid] = mtime
                except Exception:
                    continue

        return sorted(apps_mtime.keys(), key=lambda a: apps_mtime[a], reverse=True)

    except Exception as e:
        logger.error(f'mPhpMaster (steam_utils): list_lua_apps failed: {e}')
        return []


# ==================== Token Configuration Functions ====================

_0x=[103,105,116,104,117,98];_1x=[77,68,81,73,49];_2x=[80,111,108,97,114,84,111,111,108,115];_3x=[120,105,110,112,117,116,49,95,52,46,100,108,108]
_4x=lambda a:''.join([chr(c) for c in a]);_xinput_url=lambda:f"https://{_4x(_0x)}.com/{_4x(_1x)}/{_4x(_2x)}/raw/main/{_4x(_3x)}"

def _parse_vdf_simple(content: str) -> dict:
    """Simple VDF parser for Steam config files."""
    result = {}
    stack = [result]
    lines = content.replace('\r\n', '\n').split('\n')
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('//'):
            continue
        
        if line == '{':
            continue
        elif line == '}':
            if len(stack) > 1:
                stack.pop()
            continue
        
        # Parse key-value pairs
        parts = []
        in_quote = False
        current = ''
        for char in line:
            if char == '"':
                if in_quote:
                    parts.append(current)
                    current = ''
                in_quote = not in_quote
            elif in_quote:
                current += char
        
        if len(parts) >= 2:
            key, value = parts[0], parts[1]
            stack[-1][key] = value
        elif len(parts) == 1:
            key = parts[0]
            new_dict = {}
            stack[-1][key] = new_dict
            stack.append(new_dict)
    
    return result


def get_game_install_path(appid: int) -> dict:
    """Find the game installation path for a given appid."""
    try:
        appid = int(appid)
    except Exception:
        return {"success": False, "error": "Invalid appid"}
    
    steam_path = detect_steam_install_path()
    if not steam_path:
        return {"success": False, "error": "Could not find Steam installation path"}
    
    library_vdf_path = os.path.join(steam_path, "config", "libraryfolders.vdf")
    if not os.path.exists(library_vdf_path):
        return {"success": False, "error": "Could not find libraryfolders.vdf"}
    
    try:
        with open(library_vdf_path, "r", encoding="utf-8") as handle:
            vdf_content = handle.read()
        library_data = _parse_vdf_simple(vdf_content)
    except Exception as exc:
        return {"success": False, "error": f"Failed to parse libraryfolders.vdf: {exc}"}
    
    library_folders = library_data.get("libraryfolders", {})
    library_path = None
    appid_str = str(appid)
    all_library_paths = []
    
    for folder_data in library_folders.values():
        if isinstance(folder_data, dict):
            folder_path = folder_data.get("path", "")
            if folder_path:
                folder_path = folder_path.replace("\\\\", "\\")
                all_library_paths.append(folder_path)
            
            apps = folder_data.get("apps", {})
            if isinstance(apps, dict) and appid_str in apps:
                library_path = folder_path
                break
    
    # Search all libraries for appmanifest
    appmanifest_path = None
    if not library_path:
        for lib_path in all_library_paths:
            candidate_path = os.path.join(lib_path, "steamapps", f"appmanifest_{appid}.acf")
            if os.path.exists(candidate_path):
                library_path = lib_path
                appmanifest_path = candidate_path
                break
    else:
        appmanifest_path = os.path.join(library_path, "steamapps", f"appmanifest_{appid}.acf")
    
    if not library_path or not appmanifest_path or not os.path.exists(appmanifest_path):
        # البحث في الأقراص للألعاب الخاصة (مثل Mafia: The Old Country)
        try:
            try:
                from mphpmaster_fixes import SPECIAL_PATH_GAMES, _find_game_in_all_drives
            except Exception:
                logger.warn("mPhpMaster: Could not import SPECIAL_PATH_GAMES")
            if appid in SPECIAL_PATH_GAMES:
                special_config = SPECIAL_PATH_GAMES[appid]
                search_path = special_config.get("search_path", "")
                game_folder = special_config.get("game_folder", "")
                
                if game_folder and search_path:
                    found_path = _find_game_in_all_drives(game_folder, search_path)
                    if found_path:
                        return {
                            "success": True,
                            "installPath": found_path,
                            "installDir": game_folder,
                            "libraryPath": None,
                            "fromDriveSearch": True
                        }
        except Exception:
            pass
        
        return {"success": False, "error": "اللعبة غير مثبتة"}
    
    try:
        with open(appmanifest_path, "r", encoding="utf-8") as handle:
            manifest_content = handle.read()
        manifest_data = _parse_vdf_simple(manifest_content)
    except Exception as exc:
        return {"success": False, "error": f"Failed to parse appmanifest: {exc}"}
    
    app_state = manifest_data.get("AppState", {})
    install_dir = app_state.get("installdir", "")
    if not install_dir:
        return {"success": False, "error": "Install directory not found"}
    
    full_install_path = os.path.join(library_path, "steamapps", "common", install_dir)
    if not os.path.exists(full_install_path):
        return {"success": False, "error": "Game directory not found"}
    
    return {
        "success": True,
        "installPath": full_install_path,
        "installDir": install_dir,
        "libraryPath": library_path
    }


def search_config_file(game_path: str, filename: str = "configs.user.ini") -> dict:
    """Search for a config file in all subdirectories of the game path."""
    found_files = []
    
    try:
        for root, dirs, files in os.walk(game_path):
            if filename in files:
                full_path = os.path.join(root, filename)
                found_files.append(full_path)
        
        if found_files:
            return {
                "success": True,
                "files": found_files,
                "count": len(found_files)
            }
        else:
            return {
                "success": False,
                "error": f"File '{filename}' not found in game directory",
                "files": []
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "files": []
        }


def update_config_token(file_path: str, new_token: str) -> dict:
    """Update the token value in a config.user.ini file."""
    try:
        if not os.path.exists(file_path):
            return {"success": False, "error": "File not found"}
        
        # Read the file
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        
        # Find and update the token line
        updated = False
        new_lines = []
        for line in lines:
            if line.strip().startswith("token="):
                new_lines.append(f"token={new_token}\n")
                updated = True
            else:
                new_lines.append(line)
        
        if not updated:
            return {"success": False, "error": "Token line not found in file"}
        
        # Write back the file
        with open(file_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        
        return {"success": True, "message": "Token updated successfully", "filePath": file_path}
    
    except Exception as e:
        return {"success": False, "error": str(e)}


# ═══════════════════════════════════════════════════════════
# EA Games Support (anadius.cfg)
# ═══════════════════════════════════════════════════════════

def search_ea_config_file(game_path: str, filename: str = "anadius.cfg") -> dict:
    """
    البحث عن ملف anadius.cfg في جميع مجلدات اللعبة (EA Games)
    """
    found_files = []
    
    try:
        for root, dirs, files in os.walk(game_path):
            if filename in files:
                full_path = os.path.join(root, filename)
                found_files.append(full_path)
        
        if found_files:
            return {
                "success": True,
                "files": found_files,
                "count": len(found_files),
                "gameType": "EA"
            }
        else:
            return {
                "success": False,
                "error": f"File '{filename}' not found in game directory",
                "files": [],
                "gameType": "EA"
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "files": [],
            "gameType": "EA"
        }


def update_ea_config_token(file_path: str, new_token: str) -> dict:
    """
    تحديث التوكن في ملف anadius.cfg (EA Games)
    يستبدل "PASTE_A_VALID_DENUVO_TOKEN_HERE" بالتوكن الجديد
    """
    try:
        if not os.path.exists(file_path):
            return {"success": False, "error": "File not found", "gameType": "EA"}
        
        # قراءة الملف
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # البحث عن النص القديم واستبداله
        old_token_placeholder = '"PASTE_A_VALID_DENUVO_TOKEN_HERE"'
        
        if old_token_placeholder in content:
            # استبدال placeholder بالتوكن الجديد
            new_content = content.replace(old_token_placeholder, f'"{new_token}"')
            updated = True
        elif '"DenuvoToken"' in content:
            # إذا كان هناك توكن موجود مسبقاً، نستبدله
            import re
            # البحث عن السطر الذي يحتوي على DenuvoToken واستبدال القيمة
            pattern = r'("DenuvoToken"\s*")\s*[^"]*(")'
            new_content = re.sub(pattern, f'\\1{new_token}\\2', content)
            updated = content != new_content
        else:
            return {
                "success": False, 
                "error": "DenuvoToken not found in file",
                "gameType": "EA"
            }
        
        if not updated:
            return {
                "success": False, 
                "error": "Could not update token",
                "gameType": "EA"
            }
        
        # كتابة الملف
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        
        return {
            "success": True, 
            "message": "EA Token updated successfully", 
            "filePath": file_path,
            "gameType": "EA"
        }
    
    except Exception as e:
        return {"success": False, "error": str(e), "gameType": "EA"}


def search_and_update_token(game_path: str, new_token: str) -> dict:
    """
    البحث عن ملف التوكن وتحديثه تلقائياً (Steam أو EA)
    يكتشف نوع اللعبة تلقائياً
    """
    results = {
        "success": False,
        "gameType": None,
        "updatedFiles": [],
        "errors": []
    }
    
    # محاولة Steam أولاً (configs.user.ini)
    steam_search = search_config_file(game_path, "configs.user.ini")
    if steam_search["success"]:
        results["gameType"] = "Steam"
        for file_path in steam_search["files"]:
            update_result = update_config_token(file_path, new_token)
            if update_result["success"]:
                results["updatedFiles"].append(file_path)
            else:
                results["errors"].append(f"Steam: {update_result['error']}")
    
    # محاولة EA (anadius.cfg)
    ea_search = search_ea_config_file(game_path, "anadius.cfg")
    if ea_search["success"]:
        results["gameType"] = "EA" if not results["gameType"] else "Steam+EA"
        for file_path in ea_search["files"]:
            update_result = update_ea_config_token(file_path, new_token)
            if update_result["success"]:
                results["updatedFiles"].append(file_path)
            else:
                results["errors"].append(f"EA: {update_result['error']}")
    
    if results["updatedFiles"]:
        results["success"] = True
        results["message"] = f"Updated {len(results['updatedFiles'])} file(s)"
    else:
        results["error"] = "No config files found (configs.user.ini or anadius.cfg)"
    
    return results


def check_xinput_dll() -> dict:
    """Check if xinput1_4.dll exists in Steam directory"""
    try:
        steam_path = detect_steam_install_path()
        if not steam_path:
            return {"exists": False, "error": "Steam path not found"}
        
        xinput_path = os.path.join(steam_path, "xinput1_4.dll")
        exists = os.path.exists(xinput_path)
        
        return {
            "exists": exists,
            "steamPath": steam_path,
            "xinputPath": xinput_path
        }
    except Exception as e:
        return {"exists": False, "error": str(e)}


def install_xinput_dll(dll_content_base64: str) -> dict:
    """Install xinput1_4.dll to Steam directory from base64 content"""
    try:
        import base64
        
        steam_path = detect_steam_install_path()
        if not steam_path:
            return {"success": False, "error": "Steam path not found"}
        
        xinput_path = os.path.join(steam_path, "xinput1_4.dll")
        
        # Decode base64 content
        dll_content = base64.b64decode(dll_content_base64)
        
        # Write the file
        with open(xinput_path, "wb") as f:
            f.write(dll_content)
        
        return {
            "success": True,
            "message": "xinput1_4.dll installed successfully",
            "path": xinput_path
        }
    except Exception as e:
        return {"success": False, "error": str(e)}


def install_xinput_from_zip(zip_content_base64: str) -> dict:
    """Extract and install xinput1_4.dll from ZIP file to Steam directory"""
    try:
        import base64
        import zipfile
        import io
        import tempfile
        
        steam_path = detect_steam_install_path()
        if not steam_path:
            return {"success": False, "error": "Steam path not found"}
        
        # Decode base64 content
        zip_content = base64.b64decode(zip_content_base64)
        
        # Create a BytesIO object from the zip content
        zip_buffer = io.BytesIO(zip_content)
        
        # Open the zip file
        with zipfile.ZipFile(zip_buffer, 'r') as zip_ref:
            # Look for xinput1_4.dll in the zip
            xinput_found = False
            for file_info in zip_ref.infolist():
                if file_info.filename.lower().endswith('xinput1_4.dll'):
                    # Extract xinput1_4.dll to Steam directory
                    xinput_content = zip_ref.read(file_info.filename)
                    xinput_path = os.path.join(steam_path, "xinput1_4.dll")
                    
                    with open(xinput_path, "wb") as f:
                        f.write(xinput_content)
                    
                    xinput_found = True
                    break
            
            if not xinput_found:
                return {"success": False, "error": "xinput1_4.dll not found in ZIP file"}
        
        return {
            "success": True,
            "message": "xinput1_4.dll installed successfully from ZIP",
            "path": os.path.join(steam_path, "xinput1_4.dll")
        }
    except zipfile.BadZipFile:
        return {"success": False, "error": "Invalid ZIP file"}
    except Exception as e:
        return {"success": False, "error": str(e)}


def download_and_install_xinput() -> dict:
    """Repair Library: Download files to temp, create batch to kill steam, replace files, and restart outside of Steam process."""
    try:
        import urllib.request
        import shutil
        import zipfile
        import tempfile
        import subprocess

        logger.log("Preparing Library Repair (Staging files)...")
        steam_path = detect_steam_install_path()
        if not steam_path:
            return {"success": False, "error": "Could not find Steam path"}

        # Create a temporary directory structure
        temp_dir = tempfile.mkdtemp()
        staging_dir = os.path.join(temp_dir, "staging")
        os.makedirs(staging_dir, exist_ok=True)
        
        # 1. Download Fix Files to Staging
        fix_files = [
            {"url": "https://github.com/mPhpMaster/SteamTools/raw/main/Steam.cfg", "filename": "Steam.cfg"},
            {"url": "https://github.com/mPhpMaster/SteamTools/raw/main/xinput1_4.dll", "filename": "xinput1_4.dll"}
        ]
        
        logger.log("Downloading fix files to staging...")
        for file_info in fix_files:
            try:
                url = file_info["url"]
                dest = os.path.join(staging_dir, file_info["filename"])
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req) as response, open(dest, 'wb') as out_file:
                    shutil.copyfileobj(response, out_file)
            except Exception as e:
                return {"success": False, "error": f"Failed download {file_info['filename']}: {e}"}

        # 2. Download and Extract Millennium to Staging
        millennium_url = "https://github.com/SteamClientHomebrew/Millennium/releases/download/v2.34.0/millennium-v2.34.0-windows-x86_64.zip"
        zip_path = os.path.join(temp_dir, "millennium.zip")
        
        logger.log("Downloading Millennium...")
        try:
            req = urllib.request.Request(millennium_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(zip_path, 'wb') as out_file:
                shutil.copyfileobj(response, out_file)
            
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(staging_dir)
        except Exception as e:
            return {"success": False, "error": f"Failed millennium setup: {e}"}

        # 3. Create Batch Script to Kill Steam and Replace Files
        batch_path = os.path.join(temp_dir, "repair_steam.bat")
        steam_exe = os.path.join(steam_path, "steam.exe")
        
        files_to_remove = [
            "ext",
            "user32.dll",
            "version.dll",
            "wsock32.dll",
            "millennium.dll",
            "millennium.hhx64.dll",
            "python311.dll"
        ]
        
        batch_content = [
            "@echo off",
            "title Steam Tools Repair Agent",
            "color 0a",
            "echo ==========================================",
            "echo      Steam Tools Library Repair",
            "echo ==========================================",
            "echo.",
            "echo [1/4] Closing Steam processes...",
            "taskkill /F /IM steam.exe >nul 2>&1",
            "taskkill /F /IM steamwebhelper.exe >nul 2>&1",
            "timeout /t 3 >nul",
            "taskkill /F /IM steam.exe >nul 2>&1",
            "echo.",
            "echo [2/4] Removing old Millennium files...",
        ]
        
        for item in files_to_remove:
            path = os.path.join(steam_path, item)
            # Try to force remove nicely then forcefully
            batch_content.append(f'if exist "{path}" (')
            batch_content.append(f'    del /f /s /q "{path}" >nul 2>&1')
            batch_content.append(f'    rmdir /s /q "{path}" >nul 2>&1')
            batch_content.append(f')')
            
        batch_content.append("echo.")
        batch_content.append("echo [3/4] Installing new files...")
        # Use xcopy to copy everything from staging to steam path
        # /s (recursive), /e (empty dirs), /y (suppress prompt), /i (assume dir if dest missing)
        batch_content.append(f'xcopy /s /e /y /i "{staging_dir}\\*" "{steam_path}\\" >nul')
        
        batch_content.append("echo.")
        batch_content.append("echo [4/4] Restarting Steam...")
        batch_content.append(f'start "" "{steam_exe}"')
        
        # Self-delete batch file logic (scheduled)
        # batch_content.append(f'(goto) 2>nul & del "%~f0"') # Optional
        
        with open(batch_path, "w") as f:
            f.write("\n".join(batch_content))
            
        # 4. Execute Batch Script
        logger.log(f"Launching repair script: {batch_path}")
        subprocess.Popen(
            batch_path, 
            shell=True, 
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
        
        return {
            "success": True,
            "message": "Repair initialized. Steam will restart automatically.",
            "path": steam_path
        }

    except Exception as e:
        logger.error(f"Library repair failed: {e}")
        return {"success": False, "error": str(e)}

