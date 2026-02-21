# SteamTools (mPhpMaster)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/discord/294623624013545472?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/cwpNMFgruV)

A powerful Millennium plugin that streamlines Steam game management with automated tools and enhanced functionality.

## 🌟 Features

- **🎮 Game Management** - Add and manage games directly from Steam pages with one click
- **⚡ One-Click Installation** - Fully automated installer handles all setup steps
- **🔄 Automatic Updates** - Built-in updater keeps your tools current
- **🎨 Clean Interface** - Native Steam UI integration for seamless experience
- **🔧 Advanced Tools** - Includes Steamtools for enhanced Steam functionality
- **🌐 Multi-language Support** - Available in English and Arabic

## 📋 Prerequisites

### System Requirements

- **OS:** Windows 10 (64-bit) or Windows 11
- **RAM:** 4GB minimum, 8GB recommended
- **Storage:** 500MB free space
- **Software:**
  - Steam Client (latest version)
  - .NET Framework 4.8 or higher (usually pre-installed)
  - Python 3.8+ (automatically detected/recommended if missing)

### Installation Requirements

- **Administrator privileges** (one-time, for initial setup)
- **Internet connection** (for downloading components)
- **Antivirus exceptions** (installer adds them automatically)

> ℹ️ **Note:** The installer automatically downloads and installs **Millennium Framework** if not already present.

---

## 🚀 Installation

### ⚡ Quick Install (Recommended)

**Step 1:** Open **PowerShell as Administrator**

- Press `Win + X` and select **"Windows PowerShell (Admin)"** or **"Terminal (Admin)"**
- Or right-click Start → **Windows PowerShell (Admin)**

**Step 2:** Run this command:

```powershell
iwr -useb "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/SteamTools-Installer.ps1" | iex
```

**Step 3:** Wait for completion (2-5 minutes depending on internet speed)

---

### 📋 What the Installer Does

The automated installer performs these steps in sequence:

1. **✅ Detects Steam** - Locates your Steam installation directory
2. **🔒 Closes Steam** - Safely terminates all Steam processes
3. **📦 Installs Millennium** - Downloads and installs Millennium Framework
4. **🛡️ Adds Exclusions** - Configures Windows Defender exclusions
5. **🔧 Installs Steamtools** - Adds game unlock functionality (`xinput1_4.dll`)
6. **🧩 Installs Plugin** - Downloads and extracts mPhpMaster plugin
7. **🧹 Cleans Cache** - Removes old cache files (with backup)
8. **🚀 Launches Steam** - Starts Steam with plugin enabled

### ✔️ Verify Installation

After installation completes:

1. Steam should launch automatically
2. Look for the Millennium icon in the Steam interface
3. Navigate to any game page - you should see **"Add via mPhpMaster"** button
4. Check `Steam\plugins\mPhpMaster\` folder exists

---

### 🔧 Manual Installation (Advanced Users)

If you prefer manual setup or the automated installer fails:

1. **Install Millennium Framework**
   - Download from [steambrew.app](https://steambrew.app/)
   - Run the installer and follow prompts

2. **Download mPhpMaster Plugin**
   - Get the latest release: [Releases](../../releases)
   - Download the `.zip` file

3. **Extract Plugin**

   ```text
   Extract to: C:\Program Files (x86)\Steam\plugins\mPhpMaster\
   ```

4. **Install Steamtools (Optional)**
   - Download from [steam.run](https://steam.run)
   - Copy `xinput1_4.dll` to Steam root directory

5. **Enable Plugin**
   - Edit `Steam\ext\config.json`
   - Add: `"plugins": { "mPhpMaster": true }`

6. **Restart Steam**
   - Close Steam completely
   - Launch Steam normally

---

## 🔄 Update

### Updating the Plugin

To update to the latest version:

```powershell
iwr -useb "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/SteamTools-Update.ps1" | iex
```

> ⚠️ **Important:** Only use this if you already have Millennium Framework installed. For first-time installation, use the installer above.

### Update Schedule

- **Plugin Updates:** Check for updates weekly
- **Millennium:** Updates automatically via its own updater
- **Steamtools:** Rarely requires updates

**Need help?** Join our Discord: <https://discord.gg/cwpNMFgruV>

---

## ❌ Uninstall

To completely remove SteamTools and the mPhpMaster plugin:

```powershell
iwr -useb "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/SteamTools-Uninstaller.ps1" | iex
```

**This will remove:**

- ✅ Steamtools (`xinput1_4.dll`)
- ✅ mPhpMaster plugin
- ✅ Plugin configuration files
- ✅ Cache backups
- ⚠️ Millennium Framework (optional - you'll be asked)

> **Note:** The uninstaller does NOT remove games that were added. Your game library remains intact.

---

## 📖 Usage

### Adding Games to Your Library

#### Method 1: From Store Page

1. Open **Steam Store** in the Steam client
2. Browse or search for any game
3. On the game's store page, look for the **"Add via mPhpMaster"** button
4. Click the button
5. Wait for the notification: "Game added successfully!"
6. The game will appear in your library

#### Method 2: From Library View

1. Go to your **Steam Library**
2. Use the search/browse function
3. Right-click on any game
4. Look for mPhpMaster options in the context menu

### Plugin Settings

Access plugin configuration:

- Click the **Millennium icon** in Steam
- Select **"Plugins"** → **"mPhpMaster"**
- Configure your preferences:
  - Enable/disable auto-updates
  - Change language (English/Arabic)
  - View activity logs
  - Clear cache

### View Logs

For troubleshooting, check logs at:

```text
Steam\plugins\mPhpMaster\logs\
```

---

## 🛠️ Troubleshooting

### 🔴 Steam Won't Start

**Symptoms:** Steam crashes on launch or shows error messages

**Solutions:**

1. **Run installer again** - May fix corrupted files

   ```powershell
   iwr -useb "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/SteamTools-Installer.ps1" | iex
   ```

2. **Check Windows Defender**
   - Open Windows Security → Virus & threat protection → Exclusions
   - Verify your Steam folder is listed

3. **Verify Steamtools DLL**

   ```powershell
   Test-Path "C:\Program Files (x86)\Steam\xinput1_4.dll"
   ```

   Should return `True`

4. **Remove steam.cfg** (if exists)

   ```text
   Delete: Steam\steam.cfg
   ```

5. **Safe Mode Launch**

   ```text
   Run Steam with: steam.exe -safe
   ```

---

### 🟡 Plugin Not Showing

**Symptoms:** No "Add via mPhpMaster" button visible

**Solutions:**

1. **Verify Millennium is running**
   - Look for Millennium icon in Steam interface
   - If missing, reinstall Millennium

2. **Check plugin is enabled**
   - Open `Steam\ext\config.json`
   - Find the line: `"mPhpMaster": true`
   - If `false`, change to `true` and restart Steam

3. **Verify plugin folder exists**

   ```powershell
   Test-Path "C:\Program Files (x86)\Steam\plugins\mPhpMaster\plugin.json"
   ```

4. **Check Millennium console**
   - Press `F12` in Steam (opens DevTools)
   - Look for errors mentioning "mPhpMaster"

5. **Reinstall plugin**
   - Uninstall completely, then reinstall

---

### 🟠 Games Not Adding

**Symptoms:** Clicking button doesn't add game to library

**Solutions:**

1. **Restart Steam completely**
   - Close via System Tray (right-click Steam icon)
   - Ensure all Steam processes are closed in Task Manager
   - Relaunch Steam

2. **Clear Steam cache**

   ```powershell
   # The installer does this automatically, or manually:
   Remove-Item "Steam\appcache\*" -Recurse -Force
   ```

3. **Check Python backend**
   - Verify Python is installed: `python --version`
   - Should be Python 3.8 or higher
   - Install dependencies:

     ```bash
     cd Steam\plugins\mPhpMaster
     pip install -r requirements.txt
     ```

4. **Check network connectivity**
   - Plugin requires internet to fetch game data
   - Test: `ping api.steampowered.com`

5. **View logs for errors**

   ```text
   Open: Steam\plugins\mPhpMaster\logs\latest.log
   ```

---

### 🔵 Installation Fails

**Symptoms:** Installer exits with errors

**Solutions:**

1. **Run as Administrator**
   - Ensure PowerShell is running with admin privileges
   - Right-click PowerShell → "Run as Administrator"

2. **Check execution policy**

   ```powershell
   Get-ExecutionPolicy
   # If Restricted, run:
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Disable antivirus temporarily**
   - Some antiviruses block the downloads
   - Add exception for PowerShell and Steam folder

4. **Check internet connection**

   ```powershell
   Test-NetConnection github.com -Port 443
   ```

5. **Manual installation**
   - Download script manually from GitHub
   - Save as `installer.ps1`
   - Run: `.\installer.ps1`

---

### 💬 Still Having Issues?

**Get Help:**

- 📱 **Discord Community:** <https://discord.gg/cwpNMFgruV>
  - Fast response times
  - Active community support
  - Direct developer assistance

- 🐛 **GitHub Issues:** [Report a Bug](../../issues)
  - Include error messages
  - Attach log files
  - Describe steps to reproduce

- 📧 **Email Support:** Create an issue on GitHub (preferred)

**Before asking for help, please provide:**

1. Windows version (`winver`)
2. Steam version (Help → About Steam)
3. Error messages (full text)
4. Log files from `Steam\plugins\mPhpMaster\logs\`
5. Steps you've already tried

---

## 👨‍💻 For Developers

### 🚀 Quick Release

To create a new release:

1. **Update Version**
   - Edit `plugin.json` and update the version number
   - Follow semantic versioning (e.g., 1.0.1, 1.1.0, 2.0.0)

2. **Test Thoroughly**
   - Run the installer on a clean system
   - Test all features
   - Verify uninstaller works

3. **Create Release**

   ```bash
   # Tag the release
   git add .
   git commit -m "Release v1.0.1: Description of changes"
   git tag -a v1.0.1 -m "Release version 1.0.1"
   git push origin main --tags
   ```

4. **Package Plugin**
   - Create a ZIP of the plugin folder (excluding .git, logs, etc.)
   - Name it: `mPhpMaster-v1.0.1.zip`

5. **Publish on GitHub**
   - Go to [GitHub Releases](../../releases)
   - Click **"Draft a new release"**
   - Select the tag you just created
   - Upload the ZIP file
   - Add release notes with changelog
   - Click **"Publish release"**

---

### 🛠️ Development Setup

**Prerequisites:**

- Git
- Python 3.8 or higher
- Node.js 16+ (for frontend development, optional)
- Visual Studio Code (recommended)
- Steam installed for testing

**Setup Steps:**

```bash
# 1. Clone the repository
git clone https://github.com/mPhpMaster/SteamTools.git
cd SteamTools

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Optional: Create virtual environment (recommended)
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# 4. Copy to Steam plugins folder for testing
xcopy /E /I /Y . "C:\Program Files (x86)\Steam\plugins\mPhpMaster"

# 5. Restart Steam to load plugin
```

**Development Workflow:**

1. Make changes in your local repository
2. Copy changes to Steam plugins folder: `xcopy /E /I /Y . "C:\Program Files (x86)\Steam\plugins\mPhpMaster"`
3. Restart Steam to test changes
4. Check logs for errors: `Steam\plugins\mPhpMaster\logs\latest.log`
5. Debug using DevTools (F12 in Steam) for frontend issues
6. Commit and push when ready

**Testing Checklist:**

- ✅ Test on fresh Steam install
- ✅ Test with/without Millennium pre-installed
- ✅ Test installer script (SteamTools-Installer.ps1)
- ✅ Test updater script (SteamTools-Update.ps1)
- ✅ Test uninstaller script (SteamTools-Uninstaller.ps1)
- ✅ Verify plugin loads without errors
- ✅ Test adding games from store pages
- ✅ Verify translations work (English/Arabic)

---

### 🏗️ Build & Development Commands

```bash
# Lint Python code
pylint backend/*.py

# Check for syntax errors
python -m py_compile backend/*.py

# Test HTTP endpoints (if applicable)
pytest tests/ -v

# Check dependencies
pip list

# Update dependencies
pip install --upgrade -r requirements.txt

# Create deployment package
# Zip the entire folder excluding: .git, logs, __pycache__, *.pyc
Compress-Archive -Path . -DestinationPath mPhpMaster-release.zip -Force
```

**File Structure for Development:**

- `backend/` - Modify Python backend logic
- `.millennium/Dist/index.js` - Frontend JavaScript (usually pre-built)
- `locales/` - Add/edit translations
- `plugin.json` - Update version, metadata
- `requirements.txt` - Add Python dependencies

---

## 📁 Project Structure

```text
mPhpMaster/
├── 📄 plugin.json                      # Plugin manifest (metadata, version, author)
├── 📄 requirements.txt                 # Python dependencies (httpx, etc.)
├── 📄 README.md                        # This documentation file
├── 📄 LICENSE                          # MIT License
├── 📄 Steam.cfg                        # Steam configuration file
├── 📄 xinput1_4.dll                    # Steamtools library (game unlocker)
├── 📄 MillenniumInstaller-Windows.exe  # Millennium Framework installer
├── 📄 SteamTools-Installer.ps1         # Main installation script
├── 📄 SteamTools-Update.ps1            # Update script
├── 📄 SteamTools-Uninstaller.ps1       # Uninstallation script
├── 📂 backend/                         # Python backend scripts
│   ├── main.py                         # Entry point for plugin backend
│   ├── mphpmaster_api.py               # API request handlers
│   ├── mphpmaster_config.py            # Configuration management
│   ├── mphpmaster_fixes.py             # Game-specific fixes and patches
│   ├── mphpmaster_http.py              # HTTP client wrapper (httpx/urllib)
│   ├── mphpmaster_logger.py            # Logging system
│   ├── mphpmaster_manifest.py          # Game manifest handler
│   ├── mphpmaster_steam.py             # Steam API integration
│   ├── mphpmaster_updater.py           # Auto-update functionality
│   ├── mphpmaster_verify.py            # File verification and integrity checks
│   └── restart_steam.cmd               # Batch script to restart Steam
├── 📂 locales/                         # Internationalization
│   ├── en.json                         # English translations
│   └── ar.json                         # Arabic translations
├── 📂 .millennium/                     # Millennium-specific files
│   └── Dist/                           # Compiled frontend JavaScript
│       └── index.js                    # Main frontend bundle (4738 lines)
└── 📂 logs/                            # Runtime logs (created on first run)
    └── latest.log                      # Most recent log file
```

**Key Files Explained:**

- `plugin.json` - Defines plugin metadata for Millennium Framework
- `requirements.txt` - Python packages needed (install with pip)
- `backend/main.py` - Entry point called by Millennium when plugin loads
- `locales/*.json` - UI text translations for multi-language support
- `.millennium/Dist/index.js` - Compiled frontend code that runs in Steam UI
- `SteamTools-*.ps1` - PowerShell automation scripts for installation/updates
- `xinput1_4.dll` - Core Steamtools component for game unlocking
- `backend/restart_steam.cmd` - Helper script to safely restart Steam
- `LICENSE` - MIT License file
- `Steam.cfg` - Steam configuration file
- `MillenniumInstaller-Windows.exe` - Millennium Framework installer binary

---

## 📜 License

MIT License - See [LICENSE](LICENSE) for full details

**Summary:**

- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ⚠️ Must include license and copyright notice
- ❌ No liability or warranty

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 Report Bugs

- Use [GitHub Issues](../../issues)
- Follow the bug report template
- Include reproduction steps

### 💡 Suggest Features

- Open a [Feature Request](../../issues/new)
- Explain the use case
- Describe expected behavior

### 🔧 Submit Code

1. **Fork** the repository
2. **Create** a feature branch

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Commit** your changes

   ```bash
   git commit -m "Add amazing feature"
   ```

4. **Push** to the branch

   ```bash
   git push origin feature/amazing-feature
   ```

5. **Open** a Pull Request

### 📝 Improve Documentation

- Fix typos or unclear explanations
- Add examples
- Translate to other languages

### 🎨 Design Guidelines

- Follow existing code style
- Add comments for complex logic
- Update README for new features
- Include tests if applicable

---

## 🔗 Links

- **📦 GitHub Repository:** <https://github.com/mPhpMaster/SteamTools>
- **💬 Discord Community:** <https://discord.gg/cwpNMFgruV>
- **🌐 Millennium Framework:** <https://steambrew.app/>
- **📥 Releases:** <https://github.com/mPhpMaster/SteamTools/releases>
- **🐛 Report Bugs:** <https://github.com/mPhpMaster/SteamTools/issues>

---

## ❓ FAQ

**Q: Is this safe to use?**
A: Yes, the plugin is open-source and can be reviewed. However, use at your own discretion.

**Q: Will I get banned from Steam?**
A: We cannot guarantee any outcome. Use responsibly and understand the risks.

**Q: Does this work on macOS or Linux?**
A: No, currently Windows-only. Millennium Framework is Windows-specific.

**Q: Can I use this alongside other Steam plugins?**
A: Yes, it's compatible with most Millennium plugins.

**Q: How do I update the plugin?**
A: Use the update command in PowerShell (see Update section above).

**Q: The plugin stopped working after Steam update**
A: Steam updates can break plugins. Check Discord for solutions or wait for an update.

**Q: Can I modify the plugin for personal use?**
A: Yes! It's MIT licensed. Feel free to fork and customize.

**Q: Where are the game files stored?**
A: The plugin doesn't store game files - it manages Steam's library database.

---

## ⚠️ Disclaimer

**IMPORTANT - READ CAREFULLY:**

This software is provided for **educational and research purposes only**. By using this tool, you acknowledge and agree to the following:

1. **Use at Your Own Risk:** The developers are not responsible for any consequences arising from the use of this software, including but not limited to Steam account restrictions, bans, or data loss.

2. **Terms of Service:** This tool may interact with Steam in ways not officially supported. Users are responsible for understanding and complying with [Steam's Subscriber Agreement](https://store.steampowered.com/subscriber_agreement/) and [Terms of Service](https://store.steampowered.com/legal/).

3. **No Warranty:** This software is provided "AS IS" without warranty of any kind, either expressed or implied. The developers make no guarantees about reliability, safety, or fitness for any particular purpose.

4. **Legal Compliance:** Users must ensure their use of this software complies with all applicable local, state, national, and international laws and regulations.

5. **Modifications:** Any modifications or derivative works are the sole responsibility of the modifier.

6. **Support:** While we provide community support through Discord, there is no guarantee of support or assistance.

**By downloading, installing, or using this software, you accept these terms and conditions in full.**

---

## Made From <https://github.com/MDQI1/PolarTools>

⭐ Star this repo if you find it useful!
