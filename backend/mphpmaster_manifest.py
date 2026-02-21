"""
═════════════════════════════════════════════════════════════
  mPhpMaster Manifest - إدارة ملفات Lua
  
  Developer: mPhpMaster
  Discord: https://discord.gg/cwpNMFgruV
  © 2026 mPhpMaster - All Rights Reserved
═════════════════════════════════════════════════════════════
"""

import os
import zipfile
import threading
import ssl
import time as _time
from typing import Dict, Any, List, Optional
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import PluginUtils
from mphpmaster_http import get_global_client
from mphpmaster_steam import get_stplug_in_path, get_depotcache_path
from mphpmaster_api import APIManager
from mphpmaster_config import HTTP_CHUNK_SIZE, DOWNLOAD_PROGRESS_UPDATE_INTERVAL

try:
    import httpx
    from httpx import HTTPStatusError
    HTTPX_AVAILABLE = True
except ImportError:
    httpx = None
    HTTPStatusError = None
    HTTPX_AVAILABLE = False

logger = PluginUtils.Logger()

# API Config for Ryuu Generator
auth_code = "RYUUMANIFESTyi16b3"
_m_url = lambda appid: f'https://generator.ryuu.lol/secure_download?appid={appid}&auth_code={auth_code}'

class mPhpMasterManifestManager:
    def __init__(self, backend_path: str, api_manager: APIManager):
        self.backend_path = backend_path
        self.api_manager = api_manager
        self._download_state: Dict[int, Dict[str, Any]] = {}
        self._download_lock = threading.Lock()

    def _set_download_state(self, appid: int, update: Dict[str, Any]) -> None:
        with self._download_lock:
            state = self._download_state.get(appid, {})
            state.update(update)
            self._download_state[appid] = state

    def _get_download_state(self, appid: int) -> Dict[str, Any]:
        with self._download_lock:
            return self._download_state.get(appid, {}).copy()

    def get_download_status(self, appid: int) -> Dict[str, Any]:
        state = self._get_download_state(appid)
        return {'success': True, 'state': state}

    def _download_from_backend(self, appid: int, endpoint: str = "") -> None:
        try:
            self._set_download_state(appid, {
                'status': 'checking',
                'bytesRead': 0,
                'totalBytes': 0,
                'endpoint': endpoint
            })

            client = get_global_client()
            if not client:
                raise Exception("Failed to get HTTP client")

        except Exception as e:
            logger.error(f"mPhpMaster: Fatal error in download setup: {e}")
            self._set_download_state(appid, {
                'status': 'failed',
                'error': f'Setup failed: {str(e)}'
            })
            return

        try:
            # mPhpMaster API endpoint
            download_url = _m_url(appid)

            logger.log(f"mPhpMaster: Requesting download for AppID {appid}")

            temp_zip_path = os.path.join(self.backend_path, f"temp_{appid}.zip")
            bytes_read = 0
            last_state_update_ts = 0.0

            try:
                logger.log(f"mPhpMaster: Check httpx - Available={HTTPX_AVAILABLE}, Type={type(httpx)}")
                
                if HTTPX_AVAILABLE and httpx is not None:
                    # استخدام httpx
                    custom_headers = {'User-Agent': 'SteamTools-v61-stplugin-hoe'}
                    download_timeout = httpx.Timeout(300.0, connect=60.0)
                    
                    with httpx.Client(timeout=download_timeout, follow_redirects=True) as httpx_client:
                        with httpx_client.stream('GET', download_url, headers=custom_headers) as resp:
                            if not resp.is_success:
                                if resp.status_code == 404:
                                    raise Exception(f"Game {appid} not found")
                                elif resp.status_code == 429:
                                    raise Exception("Free limit exceeded")
                                elif resp.status_code == 502:
                                    raise Exception("Game Unavailable.")
                                else:
                                    raise Exception(f"HTTP {resp.status_code}: {resp.reason_phrase}")

                            try:
                                total = int(resp.headers.get('Content-Length', '0'))
                            except Exception as e:
                                logger.warn(f"mPhpMaster: Could not parse Content-Length header: {e}")
                                total = 0

                            content_type = resp.headers.get('content-type', '').lower()
                            if 'application/json' in content_type:
                                error_text = resp.read().decode('utf-8')
                                logger.error(f"mPhpMaster: Received JSON error response: {error_text}")
                                raise Exception(f"Server error: {error_text}")

                            self._set_download_state(appid, {
                                'status': 'downloading',
                                'bytesRead': 0,
                                'totalBytes': total
                            })

                            with open(temp_zip_path, 'wb', buffering=HTTP_CHUNK_SIZE) as f:
                                for chunk in resp.iter_bytes(chunk_size=HTTP_CHUNK_SIZE):
                                    if not chunk:
                                        continue
                                    f.write(chunk)
                                    bytes_read += len(chunk)

                                    now_ts = _time.time()
                                    if last_state_update_ts == 0.0 or (now_ts - last_state_update_ts) >= DOWNLOAD_PROGRESS_UPDATE_INTERVAL:
                                        self._set_download_state(appid, {
                                            'status': 'downloading',
                                            'bytesRead': bytes_read,
                                            'totalBytes': total,
                                            'endpoint': endpoint
                                        })
                                        last_state_update_ts = now_ts
                else:
                    # استخدام urllib كبديل
                    logger.log(f"mPhpMaster: Using urllib fallback for download")
                    
                    ctx = ssl.create_default_context()
                    ctx.check_hostname = False
                    ctx.verify_mode = ssl.CERT_NONE
                    
                    req = Request(download_url, headers={'User-Agent': 'SteamTools-v61-stplugin-hoe'})
                    
                    try:
                        with urlopen(req, context=ctx, timeout=300) as response:
                            try:
                                total = int(response.headers.get('Content-Length', 0))
                            except:
                                total = 0
                            
                            self._set_download_state(appid, {
                                'status': 'downloading',
                                'bytesRead': 0,
                                'totalBytes': total
                            })
                            
                            with open(temp_zip_path, 'wb', buffering=HTTP_CHUNK_SIZE) as f:
                                while True:
                                    chunk = response.read(HTTP_CHUNK_SIZE)
                                    if not chunk:
                                        break
                                    f.write(chunk)
                                    bytes_read += len(chunk)
                                    
                                    now_ts = _time.time()
                                    if last_state_update_ts == 0.0 or (now_ts - last_state_update_ts) >= DOWNLOAD_PROGRESS_UPDATE_INTERVAL:
                                        self._set_download_state(appid, {
                                            'status': 'downloading',
                                            'bytesRead': bytes_read,
                                            'totalBytes': total,
                                            'endpoint': endpoint
                                        })
                                        last_state_update_ts = now_ts
                    except HTTPError as e:
                        if e.code == 404:
                            raise Exception(f"Game {appid} not found")
                        elif e.code == 429:
                            raise Exception("Free limit exceeded")
                        elif e.code == 502:
                            raise Exception("Game Unavailable.")
                        else:
                            raise Exception(f"HTTP {e.code}: {e.reason}")
                    except URLError as e:
                        raise Exception(f"Connection error: {e.reason}")

                if bytes_read <= 0:
                    raise Exception("Empty download from endpoint")

                self._set_download_state(appid, {
                    'status': 'processing',
                    'bytesRead': bytes_read,
                    'totalBytes': bytes_read if total == 0 else total
                })

                logger.log(f"mPhpMaster: Downloaded {bytes_read} bytes to {temp_zip_path}")

                try:
                    is_zip = zipfile.is_zipfile(temp_zip_path)
                except Exception as e:
                    logger.warn(f"mPhpMaster: Could not verify if file is ZIP for app {appid}: {e}")
                    is_zip = False

                if is_zip:
                    self._extract_and_add_lua_from_zip(appid, temp_zip_path, endpoint)
                    if os.path.exists(temp_zip_path):
                        os.remove(temp_zip_path)
                else:
                    try:
                        target_dir = get_stplug_in_path()
                        depot_dir = get_depotcache_path()
                        
                        # Route extension to proper directory
                        if temp_zip_path.lower().endswith('.lua'):
                            dest_file = os.path.join(target_dir, f"{appid}.lua")
                        elif temp_zip_path.lower().endswith('.manifest'):
                            dest_file = os.path.join(depot_dir, f"{appid}.manifest")
                        else:
                            dest_file = os.path.join(target_dir, f"{appid}.lua")

                        try:
                            with open(temp_zip_path, 'rb') as src, open(dest_file, 'wb') as dst:
                                dst.write(src.read())
                            os.remove(temp_zip_path)
                        except Exception as e:
                            logger.warn(f"mPhpMaster: Could not copy file for app {appid}: {e}")
                            raise

                        self._set_download_state(appid, {
                            'status': 'installing',
                            'installedFiles': [dest_file],
                            'installedPath': dest_file
                        })
                        logger.log(f"mPhpMaster: Installed file for app {appid}: {dest_file}")
                    except Exception as e:
                        logger.error(f"mPhpMaster: Failed to install non-zip payload for app {appid}: {e}")
                        raise

                self._set_download_state(appid, {
                    'status': 'done',
                    'success': True,
                    'api': f'mPhpMaster ({endpoint})'
                })

            except Exception as e:
                if os.path.exists(temp_zip_path):
                    try:
                        os.remove(temp_zip_path)
                    except Exception as e2:
                        logger.warn(f"mPhpMaster: Could not remove temp file on error cleanup for app {appid}: {e2}")

                self._set_download_state(appid, {
                    'status': 'failed',
                    'error': f'{str(e)}'
                })

        except Exception as e:
            logger.error(f"mPhpMaster: Backend download failed: {str(e)}")
            self._set_download_state(appid, {
                'status': 'failed',
                'error': f'Backend error: {str(e)}'
            })

    def _extract_and_add_lua_from_zip(self, appid: int, zip_path: str, endpoint: str) -> None:
        try:
            target_dir = get_stplug_in_path()
            installed_files = []

            self._set_download_state(appid, {'status': 'extracting'})
            logger.log(f"mPhpMaster: Extracting ZIP file {zip_path} to {target_dir}")
            with zipfile.ZipFile(zip_path, 'r') as zip_file:
                file_list = zip_file.namelist()
                logger.log(f"mPhpMaster: ZIP contains {len(file_list)} files")

                lua_dir = get_stplug_in_path()
                manifest_dir = get_depotcache_path()
                
                # We extract both LUA and Manifest files
                relevant_files = [f for f in file_list if f.lower().endswith('.lua') or f.lower().endswith('.manifest')]

                if not relevant_files:
                    logger.warn(f"mPhpMaster: No .lua or .manifest files found in ZIP, extracting all to stplug-in")
                    relevant_files = file_list

                self._set_download_state(appid, {'status': 'installing'})

                installed_files = []

                for file_name in relevant_files:
                    if file_name.endswith('/'):
                        continue

                    try:
                        file_content = zip_file.read(file_name)
                        base_name = os.path.basename(file_name)

                        if file_name.lower().endswith('.lua'):
                            dest_file = os.path.join(lua_dir, base_name)
                        elif file_name.lower().endswith('.manifest'):
                            dest_file = os.path.join(manifest_dir, base_name)
                        else:
                            # Fallback for other files extracted if no relevant files found
                            dest_file = os.path.join(lua_dir, base_name)

                        if isinstance(file_content, bytes):
                            # Try to write as text if possible, fallback to binary
                            try:
                                decoded_content = file_content.decode('utf-8')
                                with open(dest_file, 'w', encoding='utf-8') as out:
                                    out.write(decoded_content)
                            except UnicodeDecodeError:
                                with open(dest_file, 'wb') as out:
                                    out.write(file_content)
                        else:
                            with open(dest_file, 'w', encoding='utf-8') as out:
                                out.write(str(file_content))

                        installed_files.append(dest_file)

                    except Exception as e:
                        logger.error(f"mPhpMaster: Failed to extract {file_name}: {e}")
                        continue

            if not installed_files:
                raise Exception("No files were successfully extracted from ZIP")

            logger.log(f"mPhpMaster: Successfully installed {len(installed_files)} files from {endpoint}")
            self._set_download_state(appid, {
                'installedFiles': installed_files,
                'installedPath': installed_files[0] if installed_files else None
            })

        except zipfile.BadZipFile as e:
            logger.error(f'mPhpMaster: Invalid ZIP file for app {appid}: {e}')
            raise Exception(f"Invalid ZIP file: {str(e)}")
        except Exception as e:
            logger.error(f'mPhpMaster: Failed to extract ZIP for app {appid}: {e}')
            raise

    def add_via_mphpmaster(self, appid: int, endpoints: Optional[List[str]] = None) -> Dict[str, Any]:
        try:
            appid = int(appid)
        except (ValueError, TypeError):
            return {'success': False, 'error': 'Invalid appid'}


        self._set_download_state(appid, {
            'status': 'queued',
            'bytesRead': 0,
            'totalBytes': 0
        })

        available_endpoints = ['unified']
        if endpoints:
            available_endpoints = endpoints

        def safe_availability_check_wrapper(appid, endpoints_to_check):
            # API Config for Ryuu Generator
            # Auth Code: RYUUMANIFESTyi16b3
            auth_code = "RYUUMANIFESTyi16b3"
            globals()['_m_url']=lambda i:f'https://generator.ryuu.lol/secure_download?appid={i}&auth_code={auth_code}'
            try:
                self._check_availability_and_download(appid, endpoints_to_check)
            except Exception as e:
                logger.error(f"mPhpMaster: Unhandled error in availability check thread: {e}")
                self._set_download_state(appid, {
                    'status': 'failed',
                    'error': f'Availability check crashed: {str(e)}'
                })

        thread = threading.Thread(
            target=safe_availability_check_wrapper,
            args=(appid, available_endpoints),
            daemon=True
        )
        thread.start()

        return {'success': True}

  
    def _check_availability_and_download(self, appid: int, endpoints_to_check: List[str]) -> None:
        self._download_from_backend(appid, 'unified')

    def remove_via_mphpmaster(self, appid: int) -> Dict[str, Any]:
        try:
            appid = int(appid)
        except (ValueError, TypeError):
            return {'success': False, 'error': 'Invalid appid'}

        try:
            stplug_path = get_stplug_in_path()
            depot_path = get_depotcache_path()
            removed_files = []

            # Remove LUA files from config/stplug-in
            lua_file = os.path.join(stplug_path, f'{appid}.lua')
            if os.path.exists(lua_file):
                os.remove(lua_file)
                removed_files.append(f'{appid}.lua')
                logger.log(f"mPhpMaster: Removed {lua_file}")

            disabled_file = os.path.join(stplug_path, f'{appid}.lua.disabled')
            if os.path.exists(disabled_file):
                os.remove(disabled_file)
                removed_files.append(f'{appid}.lua.disabled')
                logger.log(f"mPhpMaster: Removed {disabled_file}")

            # Remove Manifest files from depotcache
            for filename in os.listdir(depot_path):
                if filename.startswith(f'{appid}') and filename.endswith('.manifest'):
                    manifest_file = os.path.join(depot_path, filename)
                    os.remove(manifest_file)
                    removed_files.append(os.path.join('depotcache', filename))
                    logger.log(f"mPhpMaster: Removed {manifest_file}")

            # Also check stplug-in for legacy manifests just in case
            for filename in os.listdir(stplug_path):
                if filename.startswith(f'{appid}_') and filename.endswith('.manifest'):
                    manifest_file = os.path.join(stplug_path, filename)
                    os.remove(manifest_file)
                    removed_files.append(os.path.join('stplug-in', filename))
                    logger.log(f"mPhpMaster: Removed legacy manifest {manifest_file}")

            if removed_files:
                logger.log(f"mPhpMaster: Successfully removed {len(removed_files)} files for app {appid}: {removed_files}")
                return {'success': True, 'message': f'Removed {len(removed_files)} files', 'removed_files': removed_files}
            else:
                return {'success': False, 'error': f'No files found for app {appid}'}

        except Exception as e:
            logger.error(f"mPhpMaster: Error removing files for app {appid}: {e}")
            return {'success': False, 'error': str(e)}

