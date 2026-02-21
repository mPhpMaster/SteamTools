"""
═════════════════════════════════════════════════════════════
  Steam API - إدارة واجهة برمجة التطبيقات
  
  Developer: mPhpMaster
  Discord: https://discord.gg/cwpNMFgruV
  © 2026 mPhpMaster - All Rights Reserved
═════════════════════════════════════════════════════════════
"""

from typing import Optional
import PluginUtils

logger = PluginUtils.Logger()

class APIManager:
    def __init__(self, backend_path: str):
        self.backend_path = backend_path

    def get_download_endpoints(self) -> list:
        return ['unified']
