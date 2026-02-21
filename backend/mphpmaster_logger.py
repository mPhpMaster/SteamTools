"""
═════════════════════════════════════════════════════════════
  mPhpMaster Logger - نظام السجلات المركزي
  
  Developer: mPhpMaster
  Discord: https://discord.gg/cwpNMFgruV
  © 2026 mPhpMaster - All Rights Reserved
═════════════════════════════════════════════════════════════

Centralized logger for the mPhpMaster plugin.
Provides a singleton logger instance to prevent duplicate logging.
"""
import PluginUtils

# Create a single shared logger instance for all modules
_logger_instance = None

def get_logger():
    """Get the shared logger instance for the mPhpMaster plugin."""
    global _logger_instance
    if _logger_instance is None:
        _logger_instance = PluginUtils.Logger()
    return _logger_instance

# Export the logger instance directly
logger = get_logger()

