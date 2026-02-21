"""
═════════════════════════════════════════════════════════════
  mPhpMaster Verify - نظام التحقق من Steam
  
  Developer: mPhpMaster
  Discord: https://discord.gg/cwpNMFgruV
  © 2026 mPhpMaster - All Rights Reserved
═════════════════════════════════════════════════════════════
"""

import PluginUtils

logger = PluginUtils.Logger()

class SteamVerification:
    """
    This module is no longer used and has been disabled.
    This is a dummy class to prevent import errors.
    """
    def __init__(self):
        logger.log("mPhpMaster (steam_verification): Module disabled, no verification will be performed.")

    def get_verification_headers(self) -> dict:
        return {}

    def refresh_verification(self):
        pass

    def get_steam_info(self) -> dict:
        return { 'steam_pid': 0, 'status': 'disabled' }

_verification_instance = None

def get_steam_verification():
    global _verification_instance
    if _verification_instance is None:
        _verification_instance = SteamVerification()
    return _verification_instance

def refresh_steam_verification():
    pass

