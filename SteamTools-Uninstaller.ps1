#Requires -Version 5.1
# ================================================
# Steam Tools - Uninstaller (Clean All)
# Created by: mPhpMaster
# Discord: https://discord.gg/cwpNMFgruV
# Year: 2026
# ================================================
# This script will REVERSE the installation:
#   1. Close Steam
#   2. Remove Steam from Windows Defender exclusions
#   3. Remove Millennium (DLLs + ext folder)
#   4. Remove Steamtools (xinput1_4.dll)
#   5. Remove Plugins (Steam Tools etc.)
#   6. Clean Steam cache
# ================================================

# Set UTF-8 encoding
chcp 65001 | Out-Null
$OutputEncoding = [Console]::OutputEncoding = [Text.Encoding]::UTF8

# Download script to temp for admin restart
$tempScriptPath = Join-Path $env:TEMP "steamtools-uninstaller.ps1"
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

# ============================================
# HEADER
# ============================================
Write-Host ""
Write-Host "  =========================================" -ForegroundColor Red
Write-Host "  Steam Tools - Uninstaller (Clean All)   " -ForegroundColor Red
Write-Host "  =========================================" -ForegroundColor Red
Write-Host ""
Write-Host "  This will REMOVE:" -ForegroundColor DarkGray
Write-Host "    - Millennium" -ForegroundColor DarkGray
Write-Host "    - Steamtools" -ForegroundColor DarkGray
Write-Host "    - All Plugins" -ForegroundColor DarkGray
Write-Host "    - Defender Exclusions" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Discord: https://discord.gg/cwpNMFgruV" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Press any key to start uninstallation..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey()
Write-Host ""

# ============================================
# STEP 1: Detect Steam Path
# ============================================
Write-Host "  [1/5] Detecting Steam..." -ForegroundColor Yellow -NoNewline
$steamPath = $null

# 1. Try Registry
$regPaths = @(
    @{ Path = "HKCU:\Software\Valve\Steam"; Key = "SteamPath" },
    @{ Path = "HKLM:\Software\Valve\Steam"; Key = "InstallPath" },
    @{ Path = "HKLM:\Software\WOW6432Node\Valve\Steam"; Key = "InstallPath" }
)

foreach ($reg in $regPaths) {
    if (Test-Path $reg.Path) {
        $foundPath = (Get-ItemProperty -Path $reg.Path -Name $reg.Key -ErrorAction SilentlyContinue).$($reg.Key)
        if ($foundPath -and (Test-Path $foundPath)) { 
            $steamPath = $foundPath
            break 
        }
    }
}

# 2. Try Standard Paths (Fallback)
if (-not $steamPath) {
    $commonPaths = @(
        "C:\Program Files (x86)\Steam",
        "C:\Program Files\Steam"
    )
    foreach ($path in $commonPaths) {
        if (Test-Path $path) {
            $steamPath = $path
            break
        }
    }
}

# 3. Manual Input
if (-not $steamPath) {
    Write-Host " FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Could not find Steam automatically." -ForegroundColor Yellow
    Write-Host "  Please paste the path to your Steam folder:" -ForegroundColor White
    Write-Host "  (Example: C:\Program Files (x86)\Steam)" -ForegroundColor DarkGray
    $steamPath = Read-Host "  Path"
    
    if (-not (Test-Path $steamPath)) {
        Write-Host ""
        Write-Host "  Invalid path! Exiting..." -ForegroundColor Red
        Start-Sleep -Seconds 3
        exit 1
    }
}

Write-Host " OK" -ForegroundColor Green
Write-Host "        Target: $steamPath" -ForegroundColor Cyan
Write-Host ""

# Confirm before proceeding
Write-Host "  Are you sure you want to clean this folder? (Y/N)" -ForegroundColor Yellow
$confirm = Read-Host "  Choice"
if ($confirm -notmatch "^[Yy]") {
    Write-Host "  Cancelled." -ForegroundColor Red
    exit
}
Write-Host ""

# ============================================
# STEP 2: Close Steam
# ============================================
Write-Host "  [2/5] Closing Steam..." -ForegroundColor Yellow -NoNewline
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
# STEP 3: Remove Windows Defender Exclusions
# ============================================
Write-Host "  [3/5] Removing Defender exclusions..." -ForegroundColor Yellow -NoNewline
try {
    $defenderPreferences = Get-MpPreference -ErrorAction SilentlyContinue
    $exclusions = $defenderPreferences.ExclusionPath

    if ($exclusions -contains $steamPath) {
        Remove-MpPreference -ExclusionPath $steamPath -ErrorAction SilentlyContinue
        Write-Host " Removed" -ForegroundColor Green
        Write-Host "        Steam folder removed from exclusions" -ForegroundColor DarkGray
    } else {
        Write-Host " OK" -ForegroundColor Green
        Write-Host "        Not found in exclusions" -ForegroundColor DarkGray
    }
} catch {
    Write-Host " SKIPPED" -ForegroundColor Yellow
    Write-Host "        Could not modify Defender settings" -ForegroundColor DarkGray
}
Write-Host ""

# ============================================
# STEP 4: Remove Files (Millennium, Steamtools, Plugins)
# ============================================
Write-Host "  [4/5] Removing files..." -ForegroundColor Yellow

$filesToRemove = @(
    # Millennium
    (Join-Path $steamPath "user32.dll"),
    (Join-Path $steamPath "version.dll"),
    (Join-Path $steamPath "wsock32.dll"),
    (Join-Path $steamPath "millennium.dll"),
    (Join-Path $steamPath "millennium.hhx64.dll"),
    (Join-Path $steamPath "python311.dll"),
    (Join-Path $steamPath "ext"),
    
    # Steamtools
    (Join-Path $steamPath "xinput1_4.dll"),
    (Join-Path $steamPath "hid.dll"),
    (Join-Path $steamPath "stplug-in"),
    
    # Plugins
    (Join-Path $steamPath "plugins")
)

foreach ($item in $filesToRemove) {
    if (Test-Path $item) {
        Remove-Item $item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "        Removed: $(Split-Path $item -Leaf)" -ForegroundColor DarkGray
    }
}

Write-Host "        Done!" -ForegroundColor Green
Write-Host ""

# ============================================
# STEP 5: Clean Steam Cache (Optional but recommended)
# ============================================
Write-Host "  [5/5] Cleaning Steam cache..." -ForegroundColor Yellow
$appcachePath = Join-Path $steamPath "appcache"
if (Test-Path $appcachePath) {
    # We won't backup here since it's an uninstall/reset
    Remove-Item $appcachePath -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "        Appcache cleared" -ForegroundColor DarkGray
}

Write-Host "        Done!" -ForegroundColor Green
Write-Host ""

# ============================================
# DONE
# ============================================
Write-Host "  =========================================" -ForegroundColor Green
Write-Host "        Uninstallation Complete!           " -ForegroundColor Green
Write-Host "  =========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Steam is now clean." -ForegroundColor Cyan
Write-Host "  You can start Steam normally." -ForegroundColor Cyan
Write-Host ""
Write-Host "  Discord: https://discord.gg/cwpNMFgruV" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey()
