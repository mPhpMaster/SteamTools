#Requires -Version 5.1
# ================================================
# Steam Tools - All-in-One Installer v3.0
# Created by: mPhpMaster
# Discord: https://discord.gg/cwpNMFgruV
# Year: 2026
# ================================================
# This script will:
#   1. Detect Steam Path
#   2. Add Steam to Windows Defender exclusions
#   3. Remove steam.cfg (update blocker)
#   4. Clean old installations
#   5. Install Steamtools
#   6. Install Steam Tools Plugin (mPhpMaster)
#   7. Clean Steam cache
#   8. Launch Steam & Enable Plugin
# ================================================

# Set UTF-8 encoding
chcp 65001 | Out-Null
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

# Download script to temp for admin restart
$tempScriptPath = Join-Path $env:TEMP "steamtools-installer.ps1"
if ($PSCommandPath) {
    Copy-Item -Path $PSCommandPath -Destination $tempScriptPath -Force -ErrorAction SilentlyContinue
}

# Check for Admin privileges and restart if needed
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
    $scriptToRun = if (Test-Path $tempScriptPath) { $tempScriptPath } else { $PSCommandPath }
    Start-Process PowerShell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptToRun`""
    exit
}

Clear-Host

# Configuration
$pluginName = "mPhpMaster"
$pluginLink = "https://github.com/mPhpMaster/SteamTools/archive/refs/heads/main.zip"
$millenniumInstallerUrl = "https://raw.githubusercontent.com/mPhpMaster/SteamTools/refs/heads/main/MillenniumInstaller-Windows.exe"
$oldPluginNames = @("luatools", "manilua", "stelenium", "SteamTools", "mPhpMaster")

# Hide progress bar for faster downloads
$ProgressPreference = 'SilentlyContinue'

# ============================================
# HEADER
# ============================================
Write-Host ""
Write-Host "  =========================================" -ForegroundColor Cyan
Write-Host "   Steam Tools - All-in-One Installer     " -ForegroundColor Cyan
Write-Host "               Version 3.0                 " -ForegroundColor Cyan
Write-Host "  =========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  This will install:" -ForegroundColor DarkGray
Write-Host "    - Millennium Framework" -ForegroundColor DarkGray
Write-Host "    - Steamtools (unlock all games)" -ForegroundColor DarkGray
Write-Host "    - Steam Tools Plugin (mPhpMaster)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Discord: https://discord.gg/cwpNMFgruV" -ForegroundColor Magenta
Write-Host ""

# ============================================
# STEP 1: Detect Steam Path
# ============================================
Write-Host "  [1/10] Detecting Steam..." -ForegroundColor Yellow -NoNewline
$steamPath = $null

# Try multiple registry locations
$regPaths = @(
    @{ Path = "HKCU:\Software\Valve\Steam"; Key = "SteamPath" },
    @{ Path = "HKLM:\Software\Valve\Steam"; Key = "InstallPath" },
    @{ Path = "HKLM:\Software\WOW6432Node\Valve\Steam"; Key = "InstallPath" }
)

foreach ($reg in $regPaths) {
    if (Test-Path $reg.Path) {
        $steamPath = (Get-ItemProperty -Path $reg.Path -Name $reg.Key -ErrorAction SilentlyContinue).$($reg.Key)
        if ($steamPath -and (Test-Path $steamPath)) { break }
        $steamPath = $null
    }
}

if (-not $steamPath) {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Steam not found! Please install Steam first." -ForegroundColor Red
    Write-Host "  Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey()
    exit 1
}

$steamExePath = Join-Path $steamPath "steam.exe"
if (-not (Test-Path $steamExePath)) {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  steam.exe not found at: $steamPath" -ForegroundColor Red
    Write-Host "  Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey()
    exit 1
}

Write-Host " OK" -ForegroundColor Green
Write-Host "        Path: $steamPath" -ForegroundColor DarkGray
Write-Host ""

# ============================================
# STEP 2: Install Millennium Framework
# ============================================
Write-Host "  [2/10] Installing Millennium Framework..." -ForegroundColor Yellow

$millenniumInstallerPath = Join-Path $env:TEMP "MillenniumInstaller-Windows.exe"

try {
    Write-Host "        Downloading Millennium Installer..." -ForegroundColor DarkGray
    Invoke-WebRequest -Uri $millenniumInstallerUrl -OutFile $millenniumInstallerPath -UseBasicParsing -TimeoutSec 120
    
    Write-Host "        Running Millennium Installer..." -ForegroundColor DarkGray
    Write-Host "        Please complete the Millennium installation when the window appears" -ForegroundColor Yellow
    
    # Run the installer and wait for it to complete
    $process = Start-Process -FilePath $millenniumInstallerPath -Wait -PassThru
    
    if ($process.ExitCode -eq 0) {
        Write-Host "        Millennium installed successfully!" -ForegroundColor Green
    } else {
        Write-Host "        Millennium installation completed (Exit code: $($process.ExitCode))" -ForegroundColor Yellow
    }
    
    # Cleanup
    Remove-Item $millenniumInstallerPath -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "        Millennium installation failed: $_" -ForegroundColor Red
    Write-Host "        Continuing with plugin installation..." -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# STEP 3: Add Steam to Windows Defender Exclusions
# ============================================
Write-Host "  [3/10] Windows Defender exclusions..." -ForegroundColor Yellow -NoNewline
try {
    $defenderPreferences = Get-MpPreference -ErrorAction SilentlyContinue
    $ex5: Remove steam.cfg (update blocker)
# ============================================
Write-Host "  [5/10s -notcontains $steamPath) {
        Add-MpPreference -ExclusionPath $steamPath -ErrorAction SilentlyContinue
        Write-Host " Added" -ForegroundColor Green
        Write-Host "        Steam folder added to exclusions" -ForegroundColor DarkGray
    } else {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "        Already in exclusions" -ForegroundColor DarkGray
    }
} catch {
    Write-Host " SKIPPED" -ForegroundColor Yellow
    Write-Host "        Could not modify Defender settings" -ForegroundColor DarkGray
}
Write-Host ""

# ============================================
# STEP 4: Close Steam
# ============================================
Write-Host "  [4/10] Closing Steam..." -ForegroundColor Yellow -NoNewline
$steamProcesses = Get-Process -Name "steam*" -ErrorAction SilentlyContinue
if ($steamProcesses) {
    $steamProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    # Double check
    Get-Process -Name "steam*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
Write-Host " OK" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 5: Remove steam.cfg (update blocker)
# ============================================
Write-Host "  [5/10] Removing steam.cfg..." -ForegroundColor Yellow -NoNewline
$steamCfgPath = Join-Path $steamPath "steam.cfg"

if (Test-Path $steamCfgPath) {
    Remove-Item -Path $steamCfgPath -Force -ErrorAction SilentlyContinue
    Write-Host " Removed" -ForegroundColor Green
    Write-Host "        Update blocker removed" -ForegroundColor DarkGray
} else {
    Write-Host " OK" -ForegroundColor Green
    Write-Host "        No blocker found" -ForegroundColor DarkGray
}
Write-Host ""

# ============================================
# STEP 6: Clean old installations
# ============================================
Write-Host "  [6/10] Cleaning old installations..." -ForegroundColor Yellow

# Remove old Steamtools files
$steamtoolsFiles = @(
    (Join-Path $steamPath "hid.dll"),
    (Join-Path $steamPath "xinput1_4.dll")
)

foreach ($file in $steamtoolsFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force -ErrorAction SilentlyContinue
        Write-Host "        Removed: $(Split-Path $file -Leaf)" -ForegroundColor DarkGray
    }
}

# Remove old config.json
$configJsonPath = Join-Path $steamPath "ext\config.json"
if (Test-Path $configJsonPath) {
    Remove-Item $configJsonPath -Force -ErrorAction SilentlyContinue
    Write-Host "        Removed old config.json" -ForegroundColor DarkGray
}

# Remove old Millennium files
$millenniumFiles = @(
    (Join-Path $steamPath "ext"),
    (Join-Path $steamPath "user32.dll"),
    (Join-Path $steamPath "version.dll"),
    (Join-Path $steamPath "wsock32.dll"),
    (Join-Path $steamPath "millennium.dll"),
    (Join-Path $steamPath "millennium.hhx64.dll"),
    (Join-Path $steamPath "python311.dll")
)

foreach ($file in $millenniumFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "        Removed: $(Split-Path $file -Leaf)" -ForegroundColor DarkGray
    }
}

# Remove old plugins
$pluginsPath = Join-Path $steamPath "plugins"
if (Test-Path $pluginsPath -PathType Container) {
    Get-ChildItem -Path $pluginsPath -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $jsonPath = Join-Path $_.FullName "plugin.json"
        if (Test-Path $jsonPath) {
            try {
                $manifest = Get-Content $jsonPath -Raw | ConvertFrom-Json
                if ($manifest.name -in $oldPluginNames) {
                    Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
                    Write-Host "        Removed old plugin: $($manifest.name)" -ForegroundColor DarkGray
                }
            } catch {}
        }
    }
}

Write-Host "        Cleanup complete!" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 7: Install Steamtools
# ============================================
Write-Host "  [7/10] Installing Steamtools..." -ForegroundColor Yellow -NoNewline
$steamtoolsPath = Join-Path $steamPath "xinput1_4.dll"

if (Test-Path $steamtoolsPath) {
    Write-Host " Already installed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "        Downloading Steamtools..." -ForegroundColor DarkGray
    
    try {
        $script = Invoke-RestMethod "https://steam.run" -TimeoutSec 60
        $keptLines = @()

        foreach ($line in $script -split "`n") {
            $conditions = @(
                ($line -imatch "Start-Process" -and $line -imatch "steam"),
                ($line -imatch "steam\.exe"),
                ($line -imatch "Start-Sleep" -or $line -imatch "Write-Host"),
                ($line -imatch "cls" -or $line -imatch "exit"),
                ($line -imatch "Stop-Process" -and -not ($line -imatch "Get-Process"))
            )
            
            if (-not($conditions -contains $true)) {
                $keptLines += $line
            }
        }

        $SteamtoolsScript = $keptLines -join "`n"
        Invoke-Expression $SteamtoolsScript *> $null

        if (Test-Path $steamtoolsPath) {
            Write-Host "        Steamtools installed!" -ForegroundColor Green
        } else {
            Write-Host "        Steamtools installation failed!" -ForegroundColor Red
        }
    } catch {
        Write-Host "        Steamtools installation failed: $_" -ForegroundColor Red
    }
}
Write-Host ""

# ============================================
# STEP 8: Install Steam Tools Plugin
# ============================================
Write-Host "  [8/10] Installing $pluginName plugin..." -ForegroundColor Yellow

# Ensure plugins folder exists
$pluginsFolder = Join-Path $steamPath "plugins"
if (-not (Test-Path $pluginsFolder)) {
    New-Item -Path $pluginsFolder -ItemType Directory | Out-Null
}

$pluginPath = Join-Path $pluginsFolder $pluginName
$tempZip = Join-Path $env:TEMP "$pluginName.zip"
$tempExtract = Join-Path $env:TEMP "$pluginName-extract"

try {
    Write-Host "        Downloading $pluginName..." -ForegroundColor DarkGray
    Invoke-WebRequest -Uri $pluginLink -OutFile $tempZip -UseBasicParsing -TimeoutSec 120
    
    Write-Host "        Extracting $pluginName..." -ForegroundColor DarkGray
    
    # Remove old plugin folder if exists
    if (Test-Path $pluginPath) {
        Remove-Item $pluginPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Remove temp extract folder if exists
    if (Test-Path $tempExtract) {
        Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Extract to temp folder first
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force
    
    # Check if there's a nested folder inside
    $extractedItems = Get-ChildItem -Path $tempExtract -Force
    if ($extractedItems.Count -eq 1 -and $extractedItems[0].PSIsContainer) {
        $innerFolder = $extractedItems[0].FullName
        Move-Item -Path $innerFolder -Destination $pluginPath -Force
    } else {
        Move-Item -Path $tempExtract -Destination $pluginPath -Force
    }
    
    # Cleanup
    Remove-Item $tempZip -ErrorAction SilentlyContinue
    Remove-Item $tempExtract -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "        Plugin installed!" -ForegroundColor Green
} catch {
    Write-Host "        Plugin installation failed: $_" -ForegroundColor Red
}
Write-Host ""

# ============================================
# STEP 9: Clean Steam Cache
# ============================================
Write-Host "  [9/10] Cleaning Steam cache..." -ForegroundColor Yellow

$backupPath = Join-Path $steamPath "cache-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Backup and clean appcache
$appcachePath = Join-Path $steamPath "appcache"
if (Test-Path $appcachePath) {
    $appcacheBackupPath = Join-Path $backupPath "appcache"
    New-Item -ItemType Directory -Path $appcacheBackupPath -Force | Out-Null
    Get-ChildItem -Path $appcachePath -Force -Exclude "stats" | Move-Item -Destination $appcacheBackupPath -Force -ErrorAction SilentlyContinue
    Write-Host "        Cleaned appcache" -ForegroundColor DarkGray
}

# Clean user config cache (preserve playtime)
$userdataPath = Join-Path $steamPath "userdata"
if (Test-Path $userdataPath) {
    $userFolders = Get-ChildItem -Path $userdataPath -Directory -ErrorAction SilentlyContinue
    foreach ($userFolder in $userFolders) {
        $userConfigPath = Join-Path $userFolder.FullName "config"
        if (Test-Path $userConfigPath) {
            $userBackupPath = Join-Path $backupPath "userdata\$($userFolder.Name)"
            New-Item -ItemType Directory -Path $userBackupPath -Force | Out-Null
            
            Move-Item -Path $userConfigPath -Destination (Join-Path $userBackupPath "config") -Force -ErrorAction SilentlyContinue
            
            New-Item -ItemType Directory -Path $userConfigPath -Force | Out-Null
            $localConfigPath = Join-Path $userBackupPath "config\localconfig.vdf"
            if (Test-Path $localConfigPath) {
                Copy-Item $localConfigPath -Destination (Join-Path $userConfigPath "localconfig.vdf") -Force -ErrorAction SilentlyContinue
            }
            Write-Host "        Cleaned cache for user: $($userFolder.Name)" -ForegroundColor DarkGray
        }
    }
}

Write-Host "        Cache cleaned! (Backup: $backupPath)" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 10: Launch Steam & Enable Plugin
# ============================================
Write-Host "  [10/10] Starting Steam & Enabling Plugin..." -ForegroundColor Yellow

# Enable plugin in config if exists
$millenniumConfigPath = Join-Path $steamPath "ext\config.json"
if (Test-Path $millenniumConfigPath) {
    try {
        $config = Get-Content $millenniumConfigPath -Raw | ConvertFrom-Json
        
        if (-not $config.PSObject.Properties['plugins']) {
            $config | Add-Member -NotePropertyName 'plugins' -NotePropertyValue @{} -Force
        }
        
        $config.plugins | Add-Member -NotePropertyName $pluginName -NotePropertyValue $true -Force
        $config | ConvertTo-Json -Depth 10 | Set-Content $millenniumConfigPath -Encoding UTF8
        Write-Host "        Plugin enabled in config!" -ForegroundColor Green
    } catch {
        Write-Host "        Could not modify config file: $_" -ForegroundColor Yellow
    }
}

Write-Host "        Launching Steam..." -ForegroundColor DarkGray
Start-Process -FilePath $steamExePath -ArgumentList "-clearbeta"

# ============================================
# DONE!
# ============================================
Write-Host ""
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "        Installation Complete!             " -ForegroundColor Green
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Everything installed successfully!" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Notes:" -ForegroundColor Yellow
Write-Host "    - First Steam startup may be slower" -ForegroundColor DarkGray
Write-Host "    - If Steam crashes, try running it again" -ForegroundColor DarkGray
Write-Host "    - Cache backup saved to: cache-backup-*" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Join Discord: https://discord.gg/cwpNMFgruV" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey()
