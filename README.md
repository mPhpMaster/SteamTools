# mPhpMaster

A Millennium plugin to easily download games on Steam.

## Installation

### Quick Install (PowerShell)

```powershell
iwr -useb "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/SteamTools-Installer.ps1" | iex
```

### Manual Installation

1. Download the latest version from [Releases](../../releases)
2. Extract into the `plugins` folder in Millennium
3. Restart Steam

---

## Update

⚠️ **This is the tool update command** (Not recommended if you haven't installed Millennium)

```powershell
iwr -useb "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/SteamTools-Update.ps1" | iex
```

**If you encounter any problems, don't hesitate to contact technical support**

Discord: <https://discord.gg/cwpNMFgruV>

---

## Uninstall

⬇️⬇️ **Command to completely remove the tool**

```powershell
iwr -useb "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/SteamTools-Uninstaller.ps1" | iex
```

---

## Usage

1. Open any game page in Steam
2. Click the "Add via mPhpMaster" button
3. Wait for the download to complete
4. Restart Steam

## For Developers - Creating a New Release

### Quick Method

```
scripts\quick-release.bat
```

### Manual Method

```powershell
.\scripts\release.ps1 -Version "1.0.1" -Message "Update description"
```

Then:

1. Execute the displayed Git commands
2. Go to GitHub → Releases → Create new release
3. Select the tag and attach the ZIP file
4. Publish the release

## Structure

```
mPhpMaster/
├── plugin.json          # Plugin settings
├── requirements.txt     # Requirements
├── backend/             # Backend code (Python)
├── locales/             # Translation files
├── .millennium/Dist/    # Frontend code (JS)
└── scripts/             # Helper scripts
```

## License

MIT License
