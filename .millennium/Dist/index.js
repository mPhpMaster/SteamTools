const MILLENNIUM_IS_CLIENT_MODULE = !0,
    pluginName = "SteamTools";
// Steam Tools Logo
const MPHPMASTER_LOGO_URL = "https://avatars.githubusercontent.com/u/59211285?v=4";

// ==================== AUTO UPDATE SYSTEM ====================
const MPHPMASTER_CURRENT_VERSION = "1.8.6";
var MPHPMASTER_GITHUB_OWNER = "", MPHPMASTER_GITHUB_REPO = "SteamTools";
const MPHPMASTER_UPDATE_CHECK_URL = () => `https://api.github.com/repos/${MPHPMASTER_GITHUB_OWNER}/${MPHPMASTER_GITHUB_REPO}/releases/latest`;
const MPHPMASTER_AUTO_UPDATE = false; // DISABLED - Show notification only, no auto restart

// Steam Games - Token input supported
const steamActivationAppIds = [
    2358720,  // Black Myth Wukong
    703080,   // Planet Zoo
    3489700,  // Stellar Blade
    2486820,  // Sonic Racing: CrossWorlds
    2680010,  // The First Berserker: Khazan
    2928600,  // Demon Slayer - Kimetsu no Yaiba - The Hinokami Chronicles 2
    2958130,  // Jurassic World Evolution 3
    1941540,  // Mafia: The Old Country
    3764200   // Resident Evil Requiem
];

// Ubisoft Games - Different method 
const ubisoftActivationAppIds = [
    3159330,  // Assassin's Creed Shadows
    3035570,  // Assassin's Creed Mirage
    2840770,  // Avatar Frontiers of Pandora
    2842040   // Star Wars Outlaws
];

// EA Games - Different method 
const eaActivationAppIds = [
    1846380   // Need for Speed Unbound
];

// Coming Soon Games - Not yet released
const comingSoonAppIds = [
    3764200   // Resident Evil Requiem
];

// All allowed appids for activation
const allowedActivationAppIds = [...steamActivationAppIds, ...ubisoftActivationAppIds, ...eaActivationAppIds];

// Check for updates
async function checkFormPhpMasterUpdates() {
    try {
        const response = await fetch(MPHPMASTER_UPDATE_CHECK_URL(), {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        });
        if (!response.ok) return null;

        const data = await response.json();
        const latestVersion = data.tag_name?.replace('v', '') || data.name?.replace('v', '');

        if (latestVersion && compareVersions(latestVersion, MPHPMASTER_CURRENT_VERSION) > 0) {
            return {
                version: latestVersion,
                downloadUrl: data.zipball_url || data.html_url,
                releaseUrl: data.html_url,
                releaseNotes: data.body || '',
                publishedAt: data.published_at
            };
        }
        return null;
    } catch (e) {
        console.log("[SteamTools] Update check failed:", e);
        return null;
    }
}

// Compare version strings (returns 1 if a > b, -1 if a < b, 0 if equal)
function compareVersions(a, b) {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const numA = partsA[i] || 0;
        const numB = partsB[i] || 0;
        if (numA > numB) return 1;
        if (numA < numB) return -1;
    }
    return 0;
}

// Perform automatic update
async function performAutoUpdate(updateInfo) {
    // Show updating notification
    showAutoUpdateProgress('Downloading update...', 'downloading');

    try {
        // Call backend to download and extract update
        const result = await Millennium.callServerMethod("SteamTools", "UpdatePlugin", {});
        console.log("[SteamTools] UpdatePlugin result:", result);

        let parsed;
        try {
            parsed = typeof result === 'string' ? JSON.parse(result) : result;
        } catch (parseErr) {
            console.error("[SteamTools] Failed to parse result:", parseErr);
            parsed = { success: false, error: 'Invalid response from server' };
        }

        if (parsed && parsed.success) {
            showAutoUpdateProgress(`Updated to ${updateInfo.version}! Restarting Steam...`, 'success');

            // Wait 2 seconds then restart Steam
            await new Promise(r => setTimeout(r, 2000));
            await Millennium.callServerMethod("SteamTools", "RestartSteam", {});
        } else {
            const errorMsg = parsed?.error || parsed?.message || 'Unknown error';
            showAutoUpdateProgress(`Update failed: ${errorMsg}`, 'error');
        }
    } catch (e) {
        console.error("[SteamTools] Auto update failed:", e);
        showAutoUpdateProgress(`Auto update failed: ${e.message || e}`, 'error');
    }
}

// Show auto update progress
function showAutoUpdateProgress(message, status) {
    // Remove existing notification
    const existing = document.getElementById('mphpmaster-auto-update-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'mphpmaster-auto-update-notification';

    const statusColors = {
        downloading: { bg: '#1a3d5c', border: '#00d4ff', icon: '⏳' },
        success: { bg: '#1a3d2e', border: '#4caf50', icon: '✅' },
        error: { bg: '#3d1a1a', border: '#f44336', icon: '❌' }
    };
    const colors = statusColors[status] || statusColors.downloading;

    notification.innerHTML = `
        <style>
            #mphpmaster-auto-update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, ${colors.bg} 0%, #0a0a15 100%);
                border: 2px solid ${colors.border};
                border-radius: 12px;
                padding: 16px 20px;
                z-index: 999999;
                font-family: 'Segoe UI', Arial, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
                animation: mphpmasterAutoSlideIn 0.4s ease-out;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 280px;
            }
            @keyframes mphpmasterAutoSlideIn {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .mphpmaster-auto-icon {
                font-size: 24px;
            }
            .mphpmaster-auto-message {
                color: #fff;
                font-size: 14px;
                flex: 1;
            }
            .mphpmaster-auto-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: ${colors.border};
                border-radius: 50%;
                animation: mphpmasterSpin 1s linear infinite;
            }
            @keyframes mphpmasterSpin {
                to { transform: rotate(360deg); }
            }
        </style>
        <span class="mphpmaster-auto-icon">${colors.icon}</span>
        <span class="mphpmaster-auto-message">${message}</span>
        ${status === 'downloading' ? '<div class="mphpmaster-auto-spinner"></div>' : ''}
    `;

    document.body.appendChild(notification);

    // Auto remove after 10 seconds for success/error
    if (status !== 'downloading') {
        setTimeout(() => notification.remove(), 10000);
    }
}

// Show update notification (manual option if auto update is disabled)
function showUpdateNotification(updateInfo) {
    const title = '🎉 New Update Available!';
    const message = `Version ${updateInfo.version} is now available!`;
    const updateBtn = 'Update Now';
    const laterBtn = 'Later';

    const notification = document.createElement('div');
    notification.id = 'mphpmaster-update-notification';
    notification.innerHTML = `
        <style>
            #mphpmaster-update-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #00d4ff;
                border-radius: 16px;
                padding: 20px 24px;
                z-index: 999999;
                font-family: 'Segoe UI', Arial, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 212, 255, 0.3), 0 0 60px rgba(0, 212, 255, 0.1);
                animation: mphpmasterUpdateSlideIn 0.5s ease-out;
                max-width: 350px;
                direction: ltr;
            }
            @keyframes mphpmasterUpdateSlideIn {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .mphpmaster-update-header {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
            }
            .mphpmaster-update-logo {
                width: 48px;
                height: 48px;
                border-radius: 12px;
            }
            .mphpmaster-update-title {
                color: #00d4ff;
                font-size: 18px;
                font-weight: bold;
                margin: 0;
            }
            .mphpmaster-update-message {
                color: #e0e0e0;
                font-size: 14px;
                margin-bottom: 16px;
                line-height: 1.5;
            }
            .mphpmaster-update-version {
                background: rgba(0, 212, 255, 0.1);
                color: #00d4ff;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 12px;
                display: inline-block;
                margin-bottom: 12px;
            }
            .mphpmaster-update-buttons {
                display: flex;
                gap: 10px;
            }
            .mphpmaster-update-btn {
                flex: 1;
                padding: 10px 16px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .mphpmaster-update-btn-primary {
                background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
                color: #000;
            }
            .mphpmaster-update-btn-primary:hover {
                transform: scale(1.05);
                box-shadow: 0 4px 20px rgba(0, 212, 255, 0.4);
            }
            .mphpmaster-update-btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .mphpmaster-update-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            .mphpmaster-update-close {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: #888;
                font-size: 20px;
                cursor: pointer;
                padding: 4px 8px;
                line-height: 1;
            }
            .mphpmaster-update-close:hover {
                color: #fff;
            }
        </style>
        <button class="mphpmaster-update-close" onclick="this.parentElement.remove()">×</button>
        <div class="mphpmaster-update-header">
            <img src="${MPHPMASTER_LOGO_URL}" class="mphpmaster-update-logo" alt="Steam Tools">
            <h3 class="mphpmaster-update-title">${title}</h3>
        </div>
        <div class="mphpmaster-update-version">${MPHPMASTER_CURRENT_VERSION} → ${updateInfo.version}</div>
        <p class="mphpmaster-update-message">${message}</p>
        <div class="mphpmaster-update-buttons">
            <button class="mphpmaster-update-btn mphpmaster-update-btn-primary" id="mphpmaster-update-now-btn">
                ${updateBtn}
            </button>
            <button class="mphpmaster-update-btn mphpmaster-update-btn-secondary" onclick="this.closest('#mphpmaster-update-notification').remove();">
                ${laterBtn}
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    // Add click handler for update button - restart Steam only
    document.getElementById('mphpmaster-update-now-btn').onclick = async function () {
        this.disabled = true;
        this.textContent = 'Restarting Steam...';
        try {
            await Millennium.callServerMethod("mPhpMaster", "RestartSteam", {});
        } catch (e) {
            console.error("[SteamTools] RestartSteam failed:", e);
            notification.remove();
        }
    };
}

// Initialize update checker (check once on load, then every 6 hours)
(async function initmPhpMasterUpdateChecker() {
    // Wait for DOM to be ready
    await new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve);
    });

    // Wait a bit before checking (don't slow down initial load)
    await new Promise(r => setTimeout(r, 5000));

    // Check for updates
    const updateInfo = await checkFormPhpMasterUpdates();
    if (updateInfo) {
        console.log("[SteamTools] Update available:", updateInfo.version);

        // If auto update is enabled, perform automatic update
        if (MPHPMASTER_AUTO_UPDATE) {
            console.log("[SteamTools] Starting automatic update...");
            await performAutoUpdate(updateInfo);
        } else {
            // Show manual update notification
            showUpdateNotification(updateInfo);
        }
    } else {
        console.log("[SteamTools] You're running the latest version:", MPHPMASTER_CURRENT_VERSION);
    }
})();
// ==================== END AUTO UPDATE SYSTEM ====================

// ==================== WELCOME MESSAGE (FIRST RUN ONLY) ====================
const MPHPMASTER_FIRST_RUN_KEY = 'mphpmaster_welcomed';

function showWelcomeMessage() {
    const modal = document.createElement('div');
    modal.id = 'mphpmaster-welcome-modal';
    modal.innerHTML = `
        <style>
            #mphpmaster-welcome-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                z-index: 9999999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: mphpmasterWelcomeFadeIn 0.4s ease;
            }
            @keyframes mphpmasterWelcomeFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            .mphpmaster-welcome-box {
                background: linear-gradient(180deg, #1e3a4d 0%, #0d1b26 100%);
                border: 2px solid #67c1f5;
                border-radius: 20px;
                width: 420px;
                max-width: 90%;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.7), 0 0 50px rgba(103, 193, 245, 0.3);
                animation: mphpmasterWelcomeSlideIn 0.5s ease;
                overflow: hidden;
                text-align: center;
            }
            @keyframes mphpmasterWelcomeSlideIn {
                from { transform: scale(0.7) translateY(-50px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            .mphpmaster-welcome-header {
                background: linear-gradient(90deg, #1b2838 0%, #2a475e 100%);
                padding: 30px 20px;
                border-bottom: 1px solid rgba(103, 193, 245, 0.3);
            }
            .mphpmaster-welcome-logo {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                border: 3px solid #67c1f5;
                box-shadow: 0 0 30px rgba(103, 193, 245, 0.6);
                margin-bottom: 15px;
                animation: mphpmasterLogoGlow 2s ease-in-out infinite alternate;
            }
            @keyframes mphpmasterLogoGlow {
                from { box-shadow: 0 0 20px rgba(103, 193, 245, 0.4); }
                to { box-shadow: 0 0 40px rgba(103, 193, 245, 0.8); }
            }
            .mphpmaster-welcome-title {
                color: #fff;
                font-size: 26px;
                font-weight: bold;
                margin: 0;
                direction: rtl;
            }
            .mphpmaster-welcome-body {
                padding: 30px;
            }
            .mphpmaster-welcome-text {
                color: #c7d5e0;
                font-size: 16px;
                margin-bottom: 25px;
                line-height: 1.6;
            }
            .mphpmaster-welcome-btn {
                padding: 14px 40px;
                border: none;
                border-radius: 25px;
                background: linear-gradient(135deg, #67c1f5 0%, #4fa3d1 100%);
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(103, 193, 245, 0.4);
            }
            .mphpmaster-welcome-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(103, 193, 245, 0.6);
                background: linear-gradient(135deg, #7fd1ff 0%, #67c1f5 100%);
            }
        </style>
        <div class="mphpmaster-welcome-box">
            <div class="mphpmaster-welcome-header">
                <img src="${MPHPMASTER_LOGO_URL}" class="mphpmaster-welcome-logo" alt="Steam Tools">
                <h2 class="mphpmaster-welcome-title">👋 Steam Tools هلا وسهلا بك في</h2>
            </div>
            <div class="mphpmaster-welcome-body">
                <p class="mphpmaster-welcome-text">
                   Steam Tools شكراً لاستخدامك أداة <br>
                   🎮 نتمنى لك تجربة ممتعة! 
                </p>
                <button class="mphpmaster-welcome-btn" id="mphpmaster-welcome-close">🚀 يلا نبدأ</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('mphpmaster-welcome-close').onclick = () => {
        modal.style.animation = 'mphpmasterWelcomeFadeIn 0.3s ease reverse';
        setTimeout(() => modal.remove(), 280);
        try {
            localStorage.setItem(MPHPMASTER_FIRST_RUN_KEY, 'true');
        } catch (e) { }
    };
}

// Initialize welcome message on first run
/* TEMPORARILY DISABLED
(async function initWelcomeMessage() {
    await new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve);
    });
    
    await new Promise(r => setTimeout(r, 1500));
    
    try {
        if (localStorage.getItem(MPHPMASTER_FIRST_RUN_KEY) !== 'true') {
            showWelcomeMessage();
        }
    } catch (e) {
        showWelcomeMessage();
    }
})();
*/
// ==================== END WELCOME MESSAGE ====================

// ==================== ADD GAME BY APPID BUTTON (STORE ONLY) ====================

// Check if we're on the Store page
function isOnStorePage() {
    const url = window.location.href;
    return url.includes('store.steampowered.com') && !url.includes('/app/');
}

function createAddByAppIdButton() {
    // Only show on Store page (not on specific game pages)
    if (!isOnStorePage()) {
        // Remove button if it exists and we're not on store
        const existingBtn = document.querySelector('#mphpmaster-add-by-appid-btn');
        if (existingBtn) existingBtn.remove();
        return;
    }

    // Check if button already exists
    if (document.querySelector('#mphpmaster-add-by-appid-btn')) return;

    // Create the floating button
    const btn = document.createElement('div');
    btn.id = 'mphpmaster-add-by-appid-btn';
    btn.innerHTML = `
        <style>
            #mphpmaster-add-by-appid-btn {
                position: fixed;
                bottom: 48px;
                left: 15px;
                z-index: 99998;
                display: flex;
                align-items: center;
                gap: 8px;
                background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%);
                border: 2px solid #67c1f5;
                border-radius: 24px;
                padding: 8px 16px;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 20px rgba(103, 193, 245, 0.2);
                font-family: 'Motiva Sans', Arial, sans-serif;
            }
            #mphpmaster-add-by-appid-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5), 0 0 30px rgba(103, 193, 245, 0.4);
                border-color: #fff;
            }
            #mphpmaster-add-by-appid-btn .mphpmaster-btn-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: 2px solid #67c1f5;
            }
            #mphpmaster-add-by-appid-btn .mphpmaster-btn-text {
                color: #c7d5e0;
                font-size: 13px;
                font-weight: 500;
            }
            #mphpmaster-add-by-appid-btn:hover .mphpmaster-btn-text {
                color: #fff;
            }
        </style>
        <img src="${MPHPMASTER_LOGO_URL}" class="mphpmaster-btn-icon" alt="">
        <span class="mphpmaster-btn-text">إضافة لعبة</span>
    `;

    btn.onclick = () => openMphpMasterDownloadModal();
    document.body.appendChild(btn);
}

// Download Modal with Progress UI
function openMphpMasterDownloadModal() {
    // Remove existing modal
    const existing = document.querySelector('#mphpmaster-download-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'mphpmaster-download-modal';
    modal.innerHTML = `
        <style>
            #mphpmaster-download-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: mphpmasterFadeIn 0.2s ease;
            }
            @keyframes mphpmasterFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            #mphpmaster-download-modal .modal-box {
                background: linear-gradient(180deg, #1e3a4d 0%, #0d1b26 100%);
                border: 2px solid #67c1f5;
                border-radius: 12px;
                width: 420px;
                max-width: 90%;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(103, 193, 245, 0.2);
                animation: mphpmasterSlideIn 0.3s ease;
                overflow: hidden;
            }
            @keyframes mphpmasterSlideIn {
                from { transform: scale(0.9) translateY(-20px); opacity: 0; }
                to { transform: scale(1) translateY(0); opacity: 1; }
            }
            #mphpmaster-download-modal .modal-header {
                background: linear-gradient(90deg, #1b2838 0%, #2a475e 100%);
                padding: 16px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                border-bottom: 1px solid rgba(103, 193, 245, 0.3);
            }
            #mphpmaster-download-modal .modal-logo {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                border: 2px solid #67c1f5;
                box-shadow: 0 0 10px rgba(103, 193, 245, 0.4);
            }
            #mphpmaster-download-modal .modal-title {
                flex: 1;
                color: #fff;
                font-size: 18px;
                font-weight: bold;
                margin: 0;
            }
            #mphpmaster-download-modal .modal-close {
                background: transparent;
                border: none;
                color: #8f98a0;
                font-size: 24px;
                cursor: pointer;
                padding: 4px 8px;
                line-height: 1;
                transition: color 0.2s;
            }
            #mphpmaster-download-modal .modal-close:hover {
                color: #fff;
            }
            #mphpmaster-download-modal .modal-body {
                padding: 30px 24px;
                text-align: center;
            }
            
            /* Input View */
            #mphpmaster-download-modal .input-view {
                display: block;
            }
            #mphpmaster-download-modal .input-view.hidden {
                display: none;
            }
            #mphpmaster-download-modal .appid-input {
                width: 100%;
                padding: 14px 16px;
                background: rgba(0, 0, 0, 0.4);
                border: 2px solid rgba(103, 193, 245, 0.3);
                border-radius: 8px;
                color: #fff;
                font-size: 16px;
                text-align: center;
                outline: none;
                transition: all 0.2s ease;
                box-sizing: border-box;
                margin-bottom: 12px;
            }
            #mphpmaster-download-modal .appid-input:focus {
                border-color: #67c1f5;
                box-shadow: 0 0 15px rgba(103, 193, 245, 0.3);
            }
            #mphpmaster-download-modal .appid-input::placeholder {
                color: #6c7b8a;
            }
            #mphpmaster-download-modal .input-hint {
                color: #6c7b8a;
                font-size: 12px;
                margin-bottom: 20px;
            }
            #mphpmaster-download-modal .submit-btn {
                width: 100%;
                padding: 14px 24px;
                background: linear-gradient(135deg, #67c1f5 0%, #4a9cc9 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            #mphpmaster-download-modal .submit-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(103, 193, 245, 0.4);
            }
            #mphpmaster-download-modal .submit-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            /* Progress View */
            #mphpmaster-download-modal .progress-view {
                display: none;
            }
            #mphpmaster-download-modal .progress-view.active {
                display: block;
            }
            
            /* Status Icon */
            #mphpmaster-download-modal .status-icon {
                width: 80px;
                height: 80px;
                margin: 0 auto 20px;
                position: relative;
            }
            #mphpmaster-download-modal .spinner-ring {
                width: 80px;
                height: 80px;
                border: 4px solid rgba(103, 193, 245, 0.2);
                border-top-color: #67c1f5;
                border-radius: 50%;
                animation: mphpmasterSpin 1s linear infinite;
            }
            @keyframes mphpmasterSpin {
                to { transform: rotate(360deg); }
            }
            #mphpmaster-download-modal .success-icon {
                display: none;
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #4caf50 0%, #2e7d32 100%);
                border-radius: 50%;
                align-items: center;
                justify-content: center;
                animation: mphpmasterPopIn 0.4s ease;
            }
            @keyframes mphpmasterPopIn {
                0% { transform: scale(0); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            #mphpmaster-download-modal .success-icon svg {
                width: 40px;
                height: 40px;
                fill: #fff;
            }
            #mphpmaster-download-modal .error-icon {
                display: none;
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
                border-radius: 50%;
                align-items: center;
                justify-content: center;
                animation: mphpmasterPopIn 0.4s ease;
            }
            #mphpmaster-download-modal .error-icon svg {
                width: 40px;
                height: 40px;
                fill: #fff;
            }
            
            /* Status Text */
            #mphpmaster-download-modal .status-text {
                color: #c7d5e0;
                font-size: 15px;
                margin-bottom: 24px;
                min-height: 24px;
            }
            
            /* Progress Bar */
            #mphpmaster-download-modal .progress-container {
                background: rgba(0, 0, 0, 0.4);
                border-radius: 6px;
                height: 12px;
                overflow: hidden;
                margin-bottom: 8px;
            }
            #mphpmaster-download-modal .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
                border-radius: 6px;
                width: 0%;
                transition: width 0.3s ease;
            }
            #mphpmaster-download-modal .progress-info {
                display: flex;
                justify-content: space-between;
                color: #8f98a0;
                font-size: 12px;
            }
            
            /* Action Buttons */
            #mphpmaster-download-modal .action-buttons {
                display: none;
                margin-top: 24px;
                gap: 12px;
            }
            #mphpmaster-download-modal .action-buttons.show {
                display: flex;
            }
            #mphpmaster-download-modal .restart-btn {
                flex: 1;
                padding: 14px 20px;
                background: linear-gradient(135deg, #67c1f5 0%, #4a9cc9 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            #mphpmaster-download-modal .restart-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 20px rgba(103, 193, 245, 0.4);
            }
            #mphpmaster-download-modal .restart-btn svg {
                width: 18px;
                height: 18px;
            }
            #mphpmaster-download-modal .later-btn {
                padding: 14px 20px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                color: #c7d5e0;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            #mphpmaster-download-modal .later-btn:hover {
                background: rgba(255, 255, 255, 0.2);
                color: #fff;
            }
            
            /* Error state */
            #mphpmaster-download-modal .error-text {
                color: #f44336;
            }
            
            /* Warning notice */
            #mphpmaster-download-modal .warning-notice {
                background: rgba(255, 152, 0, 0.1);
                border: 1px solid rgba(255, 152, 0, 0.3);
                border-radius: 8px;
                padding: 12px 14px 12px 18px;
                margin-bottom: 16px;
                display: flex;
                flex-direction: row-reverse;
                align-items: flex-start;
                gap: 10px;
                text-align: right;
                direction: rtl;
            }
            #mphpmaster-download-modal .warning-notice .warning-icon {
                color: #ff9800;
                font-size: 16px;
                flex-shrink: 0;
                margin-top: 2px;
            }
            #mphpmaster-download-modal .warning-notice .warning-text {
                color: #ffb74d;
                font-size: 12px;
                line-height: 1.6;
                flex: 1;
            }
            #mphpmaster-download-modal .warning-notice .warning-text .steam-highlight {
                color: #67c1f5;
                font-weight: 600;
            }
            
            /* SteamDB Link */
            #mphpmaster-download-modal .steamdb-link {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                color: #8f98a0;
                font-size: 12px;
                text-decoration: none;
                margin-top: 12px;
                padding: 8px 12px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            #mphpmaster-download-modal .steamdb-link:hover {
                color: #fff;
                background: rgba(102, 192, 244, 0.2);
            }
            #mphpmaster-download-modal .steamdb-link svg {
                width: 16px;
                height: 16px;
                fill: currentColor;
            }
        </style>
        
        <div class="modal-box">
            <div class="modal-header">
                <img src="${MPHPMASTER_LOGO_URL}" class="modal-logo" alt="">
                <h3 class="modal-title">Steam Tools</h3>
                <button class="modal-close" id="mphpmaster-modal-close">×</button>
            </div>
            <div class="modal-body">
                <!-- Input View -->
                <div class="input-view" id="mphpmaster-input-view">
                    <div class="warning-notice">
                        <span class="warning-icon">⚠️</span>
                        <span class="warning-text">هذه الميزة مخصصة فقط للألعاب غير المتوفرة في بلدك<br>أو المحذوفة من متجر <span class="steam-highlight">Steam</span></span>
                    </div>
                    <input type="text" class="appid-input" id="mphpmaster-appid-input" placeholder="أدخل AppID اللعبة" autocomplete="off" dir="rtl">
                    <div class="input-hint">SteamDB من موقع AppID يتم استخراج</div>
                    <button class="submit-btn" id="mphpmaster-submit-btn">إضافة اللعبة</button>
                    <a href="#" class="steamdb-link" id="mphpmaster-steamdb-link">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        SteamDB البحث في
                    </a>
                </div>
                
                <!-- Progress View -->
                <div class="progress-view" id="mphpmaster-progress-view">
                    <div class="status-icon" id="mphpmaster-status-icon">
                        <div class="spinner-ring" id="mphpmaster-spinner"></div>
                        <div class="success-icon" id="mphpmaster-success-icon">
                            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                        </div>
                        <div class="error-icon" id="mphpmaster-error-icon">
                            <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
                        </div>
                    </div>
                    <div class="status-text" id="mphpmaster-status-text">جاري التحقق من التوفر...</div>
                    <div class="progress-container">
                        <div class="progress-bar" id="mphpmaster-progress-bar"></div>
                    </div>
                    <div class="progress-info">
                        <span id="mphpmaster-progress-status">جاري التحميل...</span>
                        <span id="mphpmaster-progress-percent">0%</span>
                    </div>
                    
                    <!-- Success Actions -->
                    <div class="action-buttons" id="mphpmaster-action-buttons">
                        <button class="restart-btn" id="mphpmaster-restart-btn">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                            </svg>
                            إعادة تشغيل Steam
                        </button>
                        <button class="later-btn" id="mphpmaster-later-btn">لاحقاً</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Elements
    const inputView = document.getElementById('mphpmaster-input-view');
    const progressView = document.getElementById('mphpmaster-progress-view');
    const appidInput = document.getElementById('mphpmaster-appid-input');
    const submitBtn = document.getElementById('mphpmaster-submit-btn');
    const closeBtn = document.getElementById('mphpmaster-modal-close');
    const spinner = document.getElementById('mphpmaster-spinner');
    const successIcon = document.getElementById('mphpmaster-success-icon');
    const errorIcon = document.getElementById('mphpmaster-error-icon');
    const statusText = document.getElementById('mphpmaster-status-text');
    const progressBar = document.getElementById('mphpmaster-progress-bar');
    const progressStatus = document.getElementById('mphpmaster-progress-status');
    const progressPercent = document.getElementById('mphpmaster-progress-percent');
    const actionButtons = document.getElementById('mphpmaster-action-buttons');
    const restartBtn = document.getElementById('mphpmaster-restart-btn');
    const laterBtn = document.getElementById('mphpmaster-later-btn');

    // Focus input
    setTimeout(() => appidInput?.focus(), 100);

    // Close handlers
    closeBtn.onclick = () => modal.remove();
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };

    // SteamDB link - open in external browser (bypass Steam browser)
    const steamdbLink = document.getElementById('mphpmaster-steamdb-link');
    steamdbLink.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Force open in system browser
        const url = 'https://steamdb.info/';
        try {
            // Try multiple methods to ensure external browser
            if (typeof SteamClient !== 'undefined' && SteamClient.System && SteamClient.System.OpenInSystemBrowser) {
                SteamClient.System.OpenInSystemBrowser(url);
            } else if (typeof SteamClient !== 'undefined' && SteamClient.OpenURLInClient) {
                SteamClient.OpenURLInClient(url, false); // false = external browser
            } else {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        } catch (err) {
            console.log('[SteamTools] Opening URL:', url);
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // Show loading state
    function showProgress() {
        inputView.classList.add('hidden');
        progressView.classList.add('active');
    }

    // Update progress
    function updateProgress(percent, status) {
        progressBar.style.width = percent + '%';
        progressPercent.textContent = percent + '%';
        if (status) progressStatus.textContent = status;
    }

    // Show success
    function showSuccess(message) {
        spinner.style.display = 'none';
        successIcon.style.display = 'flex';
        statusText.textContent = message || 'تمت إضافة اللعبة بنجاح!';
        statusText.classList.remove('error-text');
        updateProgress(100, 'اكتمل');
        actionButtons.classList.add('show');
    }

    // Show error
    function showError(message, goBack = false) {
        spinner.style.display = 'none';
        errorIcon.style.display = 'flex';
        statusText.textContent = message || 'حدث خطأ';
        statusText.classList.add('error-text');
        progressStatus.textContent = 'فشل';

        // If goBack is true, return to input view after 2 seconds
        if (goBack) {
            setTimeout(() => {
                // Reset progress view
                spinner.style.display = 'block';
                errorIcon.style.display = 'none';
                statusText.classList.remove('error-text');
                progressBar.style.width = '0%';
                progressPercent.textContent = '0%';

                // Show input view again
                inputView.classList.remove('hidden');
                progressView.classList.remove('active');

                // Clear input and focus
                appidInput.value = '';
                appidInput.style.borderColor = 'rgba(103, 193, 245, 0.3)';
                setTimeout(() => appidInput?.focus(), 100);
            }, 2000);
        }
    }

    // Submit handler
    const handleSubmit = async () => {
        const appidStr = appidInput.value.trim();

        // Validate
        if (!appidStr) {
            appidInput.style.borderColor = '#f44336';
            return;
        }

        const appid = parseInt(appidStr, 10);
        if (isNaN(appid) || appid <= 0) {
            appidInput.style.borderColor = '#f44336';
            return;
        }

        // Show progress view
        showProgress();
        statusText.textContent = 'جاري التحقق من التوفر...';
        updateProgress(0, 'جاري التحميل...');

        try {
            // Step 1: Skip frontend check - let backend handle with Ryuu API
            updateProgress(10, 'جاري التحقق...');

            // Always proceed - backend will handle availability using Ryuu Generator API
            let isAvailable = true;

            // Note: Removed frontend availability check - backend uses correct Ryuu API

            if (!isAvailable) {
                showError('اللعبة غير متوفرة حالياً', true);
                return;
            }


            // Step 2: Start download
            updateProgress(20, 'جاري بدء التحميل...');
            statusText.textContent = 'جاري تحميل اللعبة...';

            const result = await Millennium.callServerMethod("mPhpMaster", "addViamPhpMasterManifest", { appid: appid });
            let parsed;
            try {
                parsed = typeof result === 'string' ? JSON.parse(result) : result;
            } catch (e) {
                parsed = result;
            }

            if (parsed && parsed.success) {
                // Poll for download status
                let pollCount = 0;
                const maxPolls = 120; // 2 minutes max

                const pollStatus = async () => {
                    try {
                        const statusResult = await Millennium.callServerMethod("mPhpMaster", "GetStatus", { appid: appid });
                        let statusParsed;
                        try {
                            statusParsed = typeof statusResult === 'string' ? JSON.parse(statusResult) : statusResult;
                        } catch (e) {
                            statusParsed = statusResult;
                        }

                        const state = statusParsed?.state || {};
                        const status = state.status || '';
                        const bytesRead = state.bytesRead || 0;
                        const totalBytes = state.totalBytes || 0;

                        // Calculate progress
                        let percent = 20;
                        if (totalBytes > 0) {
                            percent = Math.min(95, 20 + Math.floor((bytesRead / totalBytes) * 75));
                        }

                        // Update UI based on status
                        if (status === 'downloading') {
                            const downloadedMB = (bytesRead / 1024 / 1024).toFixed(1);
                            const totalMB = (totalBytes / 1024 / 1024).toFixed(1);
                            updateProgress(percent, `${downloadedMB}MB / ${totalMB}MB`);
                            statusText.textContent = 'جاري تحميل اللعبة...';
                        } else if (status === 'processing' || status === 'extracting') {
                            updateProgress(90, 'جاري المعالجة...');
                            statusText.textContent = 'جاري استخراج الملفات...';
                        } else if (status === 'installing') {
                            updateProgress(95, 'جاري التثبيت...');
                            statusText.textContent = 'جاري التثبيت...';
                        } else if (status === 'done') {
                            showSuccess('تمت إضافة اللعبة بنجاح!');
                            return; // Stop polling
                        } else if (status === 'failed') {
                            showError(state.error || 'فشل التحميل');
                            return; // Stop polling
                        }

                        // Continue polling
                        pollCount++;
                        if (pollCount < maxPolls && status !== 'done' && status !== 'failed') {
                            setTimeout(pollStatus, 1000);
                        } else if (pollCount >= maxPolls) {
                            showSuccess('تمت إضافة اللعبة!');
                        }

                    } catch (pollErr) {
                        console.error('[SteamTools] Poll error:', pollErr);
                        pollCount++;
                        if (pollCount < maxPolls) {
                            setTimeout(pollStatus, 1000);
                        }
                    }
                };

                // Start polling
                setTimeout(pollStatus, 500);

            } else {
                showError(parsed?.error || 'حدث خطأ غير معروف');
            }

        } catch (err) {
            showError(err.message || 'حدث خطأ');
        }
    };

    submitBtn.onclick = handleSubmit;
    appidInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });

    // Restart button
    restartBtn.onclick = async () => {
        restartBtn.disabled = true;
        restartBtn.innerHTML = '<span>جاري إعادة التشغيل...</span>';
        try {
            await Millennium.callServerMethod("mPhpMaster", "RestartSteam", {});
        } catch (err) {
            console.error('[SteamTools] Restart error:', err);
            modal.remove();
        }
    };

    // Later button
    laterBtn.onclick = () => {
        modal.remove();
        window.location.reload();
    };
}

// Initialize the Add by AppID button (Store page only)
(async function initAddByAppIdButton() {
    // Wait for DOM
    await new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve);
    });

    // Wait a bit
    await new Promise(r => setTimeout(r, 2000));

    // Create button if on Store
    createAddByAppIdButton();

    // Re-check on navigation
    const observer = new MutationObserver(() => {
        createAddByAppIdButton();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Also check on URL change
    let lastUrl = location.href;
    new MutationObserver(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            createAddByAppIdButton();
        }
    }).observe(document, { subtree: true, childList: true });
})();

// ==================== END ADD GAME BY APPID BUTTON ====================

// ==================== XINPUT DLL CHECK & DOWNLOAD ====================

// Check and create xinput button if needed
async function checkAndCreateXinputButton() {
    // Temporarily disabled
    return;

    // Remove existing button first
    const existingBtn = document.querySelector('#mphpmaster-xinput-btn');
    if (existingBtn) existingBtn.remove();

    try {
        // Check if xinput1_4.dll exists
        const result = await Millennium.callServerMethod("mPhpMaster", "CheckXinputDll", {});
        let parsed;
        try {
            parsed = typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
            parsed = result;
        }

        // If DLL exists, don't show button
        if (parsed && parsed.exists) {
            console.log('[SteamTools] xinput1_4.dll found in Steam directory');
            return;
        }

        console.log('[SteamTools] xinput1_4.dll NOT found - showing download button');

        // Create the floating button on the RIGHT side
        const btn = document.createElement('div');
        btn.id = 'mphpmaster-xinput-btn';
        btn.innerHTML = `
            <style>
                #mphpmaster-xinput-btn {
                    position: fixed;
                    bottom: 48px;
                    right: 15px;
                    z-index: 99998;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
                    border: 2px solid #ef5350;
                    border-radius: 24px;
                    padding: 8px 16px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 20px rgba(244, 67, 54, 0.3);
                    font-family: 'Motiva Sans', Arial, sans-serif;
                    animation: mphpmasterXinputPulse 2s ease-in-out infinite;
                }
                @keyframes mphpmasterXinputPulse {
                    0%, 100% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), 0 0 20px rgba(244, 67, 54, 0.3); }
                    50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(244, 67, 54, 0.5); }
                }
                #mphpmaster-xinput-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5), 0 0 35px rgba(244, 67, 54, 0.5);
                    border-color: #fff;
                    animation: none;
                }
                #mphpmaster-xinput-btn .mphpmaster-xinput-icon {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 2px solid #fff;
                }
                #mphpmaster-xinput-btn .mphpmaster-xinput-text {
                    color: #fff;
                    font-size: 13px;
                    font-weight: 600;
                }
                #mphpmaster-xinput-btn:hover .mphpmaster-xinput-text {
                    color: #fff;
                }
                #mphpmaster-xinput-btn.downloading {
                    background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
                    border-color: #64b5f6;
                    animation: none;
                    cursor: wait;
                }
                #mphpmaster-xinput-btn.success {
                    background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
                    border-color: #81c784;
                    animation: none;
                }
            </style>
            <img src="${MPHPMASTER_LOGO_URL}" class="mphpmaster-xinput-icon" alt="">
            <span class="mphpmaster-xinput-text">اصلاح المكتبة</span>
        `;

        btn.onclick = () => downloadAndInstallXinput(btn);
        document.body.appendChild(btn);

    } catch (err) {
        console.error('[SteamTools] Error checking xinput dll:', err);
    }
}

// Download and install xinput1_4.dll (Backend handles download)
async function downloadAndInstallXinput(btn) {
    if (btn.classList.contains('downloading')) return;

    btn.classList.add('downloading');
    const textEl = btn.querySelector('.mphpmaster-xinput-text');
    textEl.textContent = 'جاري التنفيذ...';

    try {
        // Call backend to execute repair command
        // Using Popen on backend now, so this returns instantly
        const result = await Millennium.callServerMethod("mPhpMaster", "DownloadAndInstallXinput", {});
        let parsed;
        try {
            parsed = typeof result === 'string' ? JSON.parse(result) : result;
        } catch (e) {
            parsed = result;
        }

        if (parsed && parsed.success) {
            btn.classList.remove('downloading');
            btn.classList.add('success');
            textEl.textContent = 'تم الاصلاح! جاري إعادة التشغيل...';

            if (window.mPhpMasterNotification) {
                mPhpMasterNotification.success('تمت عملية الإصلاح بنجاح', 'Steam Tools');
            }

            // Restart Steam after 2 seconds
            setTimeout(async () => {
                try {
                    await Millennium.callServerMethod("mPhpMaster", "RestartSteam", {});
                } catch (e) {
                    console.error('[SteamTools] RestartSteam error:', e);
                }
                btn.style.opacity = '0';
                setTimeout(() => btn.remove(), 500);
            }, 2000);

        } else {
            throw new Error(parsed?.error || 'Installation failed');
        }

    } catch (err) {
        console.error('[SteamTools] Error installing xinput dll:', err);
        btn.classList.remove('downloading');
        textEl.textContent = 'فشل الإصلاح';

        if (window.mPhpMasterNotification) {
            mPhpMasterNotification.error('فشل بدء الإصلاح: ' + (err.message || err), 'Steam Tools');
        }

        setTimeout(() => {
            textEl.textContent = 'اصلاح المكتبة';
        }, 3000);
    }
}


// Initialize xinput check
(async function initXinputCheck() {
    // Wait for DOM
    await new Promise(resolve => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve);
    });

    // Wait a bit
    await new Promise(r => setTimeout(r, 3000));

    // Check and create button if needed
    checkAndCreateXinputButton();
})();

// ==================== END XINPUT DLL CHECK ====================

// Steam Restart Notification Popup (integrated into main flow)
function showSteamRestartNotification(appid) {
    // Remove existing notification
    const existing = document.querySelector('#mphpmaster-restart-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'mphpmaster-restart-notification';
    notification.innerHTML = `
        <style>
            #mphpmaster-restart-notification {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: mphpmasterFadeIn 0.2s ease;
            }
            @keyframes mphpmasterFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            #mphpmaster-restart-notification .restart-popup {
                background: linear-gradient(135deg, #1b2838 0%, #0f1923 100%);
                border: 2px solid #67c1f5;
                border-radius: 12px;
                padding: 24px 32px;
                min-width: 380px;
                max-width: 450px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(103, 193, 245, 0.2);
                animation: mphpmasterPopIn 0.3s ease;
            }
            @keyframes mphpmasterPopIn {
                from { transform: scale(0.8); opacity: 0; }
                to { transform: scale(1); opacity: 1; }
            }
            #mphpmaster-restart-notification .restart-message {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                color: #ffc107;
                font-size: 15px;
                margin-bottom: 20px;
                font-weight: 500;
            }
            #mphpmaster-restart-notification .restart-icon {
                font-size: 20px;
            }
            #mphpmaster-restart-notification .restart-btn {
                width: 100%;
                padding: 14px 24px;
                background: linear-gradient(135deg, #67c1f5 0%, #4a9cc9 100%);
                border: none;
                border-radius: 8px;
                color: #fff;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            #mphpmaster-restart-notification .restart-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 25px rgba(103, 193, 245, 0.4);
            }
            #mphpmaster-restart-notification .restart-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            #mphpmaster-restart-notification .restart-btn svg {
                width: 18px;
                height: 18px;
            }
            #mphpmaster-restart-notification .skip-link {
                display: block;
                margin-top: 16px;
                color: #8f98a0;
                font-size: 13px;
                cursor: pointer;
                text-decoration: none;
                transition: color 0.2s;
            }
            #mphpmaster-restart-notification .skip-link:hover {
                color: #c7d5e0;
            }
        </style>
        <div class="restart-popup">
            <div class="restart-message">
                <span class="restart-icon">⚠️</span>
                <span>يجب إعادة تشغيل Steam لتظهر اللعبة</span>
            </div>
            <button class="restart-btn" id="mphpmaster-do-restart-btn">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
                <span>إعادة تشغيل Steam</span>
            </button>
            <a class="skip-link" id="mphpmaster-skip-restart">لاحقاً</a>
        </div>
    `;

    document.body.appendChild(notification);

    // Restart button handler
    const restartBtn = document.getElementById('mphpmaster-do-restart-btn');
    restartBtn.onclick = async () => {
        restartBtn.disabled = true;
        restartBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" style="animation: spin 1s linear infinite;">
                <path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            <span>جاري إعادة التشغيل...</span>
        `;

        try {
            await Millennium.callServerMethod("mPhpMaster", "RestartSteam", {});
        } catch (err) {
            console.error('[SteamTools] RestartSteam error:', err);
            if (window.mPhpMasterNotification) {
                window.mPhpMasterNotification.error('فشل إعادة تشغيل Steam', 'خطأ');
            }
            notification.remove();
        }
    };

    // Skip link handler - just close and refresh
    const skipLink = document.getElementById('mphpmaster-skip-restart');
    skipLink.onclick = () => {
        notification.remove();
        // Refresh the current page
        window.location.reload();
    };

    // Add spin animation
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
}

// ==================== END ADD GAME BY APPID BUTTON ====================

function InitializePlugins() {
    var e, t;
    let a;
    (e = window.PLUGIN_LIST || (window.PLUGIN_LIST = {})).mPhpMaster || (e.mPhpMaster = {}), (t = window.MILLENNIUM_PLUGIN_SETTINGS_STORE || (window.MILLENNIUM_PLUGIN_SETTINGS_STORE = {})).mPhpMaster || (t.mPhpMaster = {}), window.MILLENNIUM_SIDEBAR_NAVIGATION_PANELS || (window.MILLENNIUM_SIDEBAR_NAVIGATION_PANELS = {}),
        function (e) {
            e[e.CallServerMethod = 0] = "CallServerMethod"
        }(a || (a = {}));
    let n = window.MILLENNIUM_PLUGIN_SETTINGS_STORE.mPhpMaster,
        i = "Millennium.Internal.IPC.[mPhpMaster]";
    const o = {
        DropDown: ["string", "number", "boolean"],
        NumberTextInput: ["number"],
        StringTextInput: ["string"],
        FloatTextInput: ["number"],
        CheckBox: ["boolean"],
        NumberSlider: ["number"],
        FloatSlider: ["number"]
    };
    function r(e, t, n) {
        return MILLENNIUM_BACKEND_IPC.postMessage(a.CallServerMethod, {
            pluginName: e,
            methodName: "__builtins__.__update_settings_value__",
            argumentList: {
                name: t,
                value: n
            }
        })
    }
    n.ignoreProxyFlag = !1, async function () {
        for (;
            "undefined" == typeof MainWindowBrowserManager;) await new Promise(e => setTimeout(e, 0));
        MainWindowBrowserManager?.m_browser?.on("message", (e, t) => {
            if (e !== i) return;
            const {
                name: a,
                value: o
            } = JSON.parse(t);
            n.ignoreProxyFlag = !0, n.settingsStore[a] = o, r("mPhpMaster", a, o), n.ignoreProxyFlag = !1
        })
    }();
    const s = e => new Proxy(e, {
        set(e, t, a) {
            if (!(t in e)) throw new TypeError(`Property ${String(t)} does not exist on plugin settings`);
            const s = o[e[t].type],
                l = e[t]?.range;
            if (s.includes("number") && "number" == typeof a && (l && (a = function (e, t, a) {
                return Math.max(t, Math.min(a, e))
            }(a, l[0], l[1])), a || (a = 0)), !s.includes(typeof a)) throw new TypeError(`Expected ${s.join(" or ")}, got ${typeof a}`);
            return e[t].value = a, ((e, t) => {
                n.ignoreProxyFlag || (r("mPhpMaster", e, t), "undefined" != typeof MainWindowBrowserManager && MainWindowBrowserBrowser?.PostMessage(i, JSON.stringify({
                    name: e,
                    value: t
                })))
            })(String(t), a), !0
        },
        get: (e, t) => "__raw_get_internals__" === t ? e : t in e ? e[t].value : void 0
    });
    n.DefinePluginSetting = s, n.settingsStore = s({})
}
InitializePlugins();
(function () { var _ = String.fromCharCode, a = [109, 80, 104, 112, 77, 97, 115, 116, 101, 114], b = [103, 101, 110, 101, 114, 97, 116, 111, 114], c = [114, 121, 117, 117], d = [82, 89, 85, 85, 77, 65, 78, 73, 70, 69, 83, 84, 117, 54, 110, 52, 55, 119], e = x => x.map(v => _(v)).join(''); MPHPMASTER_GITHUB_OWNER = e(a); window._0x7f3d = () => e(b); window._0x8c4e = () => e(c); window._0x9b2f = () => e(d); window._$buildUrl = (i, k) => `https://${_0x7f3d()}.${_0x8c4e()}.lol/secure_download?appid=${i}&auth_code=${_0x9b2f()}${k ? '&check_only=true' : ''}` })();
const __call_server_method__ = (e, t) => Millennium.callServerMethod("mPhpMaster", e, t),
    __wrapped_callable__ = e => MILLENNIUM_API.callable(__call_server_method__, e);
// ===== STEAM TOOLS NOTIFICATION SYSTEM =====
const mPhpMasterNotification = {
    container: null,
    notifications: [],
    init() {
        if (this.container) return;
        this.container = document.createElement("div");
        this.container.id = "mphpmaster-notification-container";
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
        // Add styles
        const style = document.createElement("style");
        style.textContent = `
            @keyframes mphpmasterNotifySlideIn {
                from { transform: translateX(120%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes mphpmasterNotifySlideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(120%); opacity: 0; }
            }
            @keyframes mphpmasterNotifyProgress {
                from { width: 100%; }
                to { width: 0%; }
            }
            @keyframes mphpmasterGlow {
                0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(103, 193, 245, 0.15); }
                50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(103, 193, 245, 0.3); }
            }
            .mphpmaster-notification {
                pointer-events: auto;
                min-width: 340px;
                max-width: 420px;
                background: linear-gradient(145deg, #1e3a4d 0%, #0d1b26 100%);
                border: 1px solid rgba(103, 193, 245, 0.4);
                border-radius: 16px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(103, 193, 245, 0.15);
                overflow: hidden;
                animation: mphpmasterNotifySlideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), mphpmasterGlow 3s ease-in-out infinite;
                backdrop-filter: blur(10px);
            }
            .mphpmaster-notification.closing {
                animation: mphpmasterNotifySlideOut 0.3s ease-in forwards;
            }
            .mphpmaster-notification-header {
                display: flex;
                align-items: center;
                gap: 14px;
                padding: 16px 18px 12px;
                background: linear-gradient(180deg, rgba(103, 193, 245, 0.08) 0%, transparent 100%);
            }
            .mphpmaster-notification-icon {
                width: 42px;
                height: 42px;
                border-radius: 50%;
                border: 2px solid #67c1f5;
                box-shadow: 0 0 15px rgba(103, 193, 245, 0.5);
                object-fit: cover;
            }
            .mphpmaster-notification-title {
                flex: 1;
                color: #ffffff;
                font-size: 16px;
                font-weight: 700;
                text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                letter-spacing: 0.3px;
            }
            .mphpmaster-notification-close {
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.1);
                color: #8f98a0;
                font-size: 16px;
                cursor: pointer;
                padding: 6px 10px;
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            .mphpmaster-notification-close:hover {
                background: rgba(255,255,255,0.15);
                color: #ffffff;
                transform: scale(1.05);
            }
            .mphpmaster-notification-body {
                padding: 0 18px 16px;
                color: #c7d5e0;
                font-size: 14px;
                line-height: 1.6;
                direction: auto;
            }
            .mphpmaster-notification-progress {
                height: 4px;
                background: linear-gradient(90deg, #67c1f5 0%, #4fc3f7 50%, #67c1f5 100%);
                background-size: 200% 100%;
                border-radius: 0 0 16px 16px;
            }
            .mphpmaster-notification.success { 
                border-color: rgba(76, 175, 80, 0.5);
                background: linear-gradient(145deg, #1a3d2e 0%, #0d1b15 100%);
            }
            .mphpmaster-notification.success .mphpmaster-notification-header { background: linear-gradient(180deg, rgba(76, 175, 80, 0.1) 0%, transparent 100%); }
            .mphpmaster-notification.success .mphpmaster-notification-progress { background: linear-gradient(90deg, #4caf50 0%, #81c784 50%, #4caf50 100%); }
            .mphpmaster-notification.success .mphpmaster-notification-icon { border-color: #4caf50; box-shadow: 0 0 15px rgba(76, 175, 80, 0.5); }
            .mphpmaster-notification.error { 
                border-color: rgba(244, 67, 54, 0.5);
                background: linear-gradient(145deg, #3d1a1a 0%, #1b0d0d 100%);
            }
            .mphpmaster-notification.error .mphpmaster-notification-header { background: linear-gradient(180deg, rgba(244, 67, 54, 0.1) 0%, transparent 100%); }
            .mphpmaster-notification.error .mphpmaster-notification-progress { background: linear-gradient(90deg, #f44336 0%, #e57373 50%, #f44336 100%); }
            .mphpmaster-notification.error .mphpmaster-notification-icon { border-color: #f44336; box-shadow: 0 0 15px rgba(244, 67, 54, 0.5); }
            .mphpmaster-notification.warning { 
                border-color: rgba(255, 152, 0, 0.5);
                background: linear-gradient(145deg, #3d2e1a 0%, #1b150d 100%);
            }
            .mphpmaster-notification.warning .mphpmaster-notification-header { background: linear-gradient(180deg, rgba(255, 152, 0, 0.1) 0%, transparent 100%); }
            .mphpmaster-notification.warning .mphpmaster-notification-progress { background: linear-gradient(90deg, #ff9800 0%, #ffb74d 50%, #ff9800 100%); }
            .mphpmaster-notification.warning .mphpmaster-notification-icon { border-color: #ff9800; box-shadow: 0 0 15px rgba(255, 152, 0, 0.5); }
        `;
        document.head.appendChild(style);
    },
    show(options = {}) {
        this.init();
        const {
            title = "mPhpMaster",
            message = "",
            type = "info", // info, success, error, warning
            duration = 5000,
            icon = MPHPMASTER_LOGO_URL
        } = options;
        const id = Date.now();
        const notification = document.createElement("div");
        notification.className = `mphpmaster-notification ${type}`;
        notification.dataset.id = id;
        notification.innerHTML = `
            <div class="mphpmaster-notification-header">
                <img src="${icon}" class="mphpmaster-notification-icon" alt="">
                <div class="mphpmaster-notification-title">${title}</div>
                <button class="mphpmaster-notification-close">✕</button>
            </div>
            <div class="mphpmaster-notification-body">${message}</div>
            <div class="mphpmaster-notification-progress" style="animation: mphpmasterNotifyProgress ${duration}ms linear forwards;"></div>
        `;
        // Close button
        notification.querySelector(".mphpmaster-notification-close").onclick = () => this.close(id);
        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });
        // Auto close
        if (duration > 0) {
            setTimeout(() => this.close(id), duration);
        }
        return id;
    },
    close(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;
        const { element } = this.notifications[index];
        element.classList.add("closing");
        setTimeout(() => {
            element.remove();
            this.notifications.splice(index, 1);
        }, 300);
    },
    success(message, title = "Success") {
        return this.show({ title, message, type: "success" });
    },
    error(message, title = "Error") {
        return this.show({ title, message, type: "error" });
    },
    warning(message, title = "Warning") {
        return this.show({ title, message, type: "warning" });
    },
    info(message, title = "Steam Tools") {
        return this.show({ title, message, type: "info" });
    }
};
// Make globally accessible
window.mPhpMasterNotification = mPhpMasterNotification;
let PluginEntryPointMain = function () {
    return function (e) {
        "use strict";
        const t = (function () { try { return localStorage.getItem('mphpmaster_language') || 'en'; } catch (e) { return 'en'; } })(),
            locales = {
                en: {
                    btn: {
                        add: "Add using mPhpMaster",
                        addSoftware: "Add Software using mPhpMaster",
                        remove: "Remove using mPhpMaster",
                        loading: "Loading...",
                        removing: "Removing...",
                        cancel: "Cancel",
                        restartSteam: "Restart Steam",
                        openMenu: "Steam Tools"
                    },
                    welcomeTitle: "👋 Welcome",
                    status: {
                        downloading: "Downloading...",
                        checking: "Checking availability...",
                        checkingApi: "Checking {api}...",
                        queued: "Queuing...",
                        downloadingProgress: "Downloading... ({downloaded}MB / {total}MB) ({percent}%)",
                        processing: "Processing ZIP file...",
                        extracting: "Extracting game files...",
                        extractingCount: "Extracting files... ({count} files)",
                        installing: "Installing to Steam...",
                        failed: "Download failed",
                        gameAdded: "Game added successfully!"
                    },

                    notification: {
                        welcome: "Welcome to Steam Tools!",
                        gameAdded: "Game added successfully!",
                        gameRemoved: "Game removed.",
                        downloadStarted: "Download started...",
                        steamRestarting: "Restarting Steam...",
                        dlcTitle: "⚠️ Downloadable Content (DLC)",
                        dlcWarning: "You cannot add DLC separately.\n\nWhen adding the base game, you will get all DLCs with it automatically."
                    },
                    generic: {
                        error: "Error",
                        close: "Close"
                    },
                    activations: {
                        header: "Game Activations",
                        menuBtn: "Activations Menu",
                        title: "Activations List",
                        currentGame: "Current Game",
                        enterToken: "Enter your token",
                        pasteToken: "Paste token here...",
                        searchApply: "Search & Apply",
                        searching: "Searching...",
                        searchInfo: "Will search for <code style='color:#67c1f5'>configs.user.ini</code><br>in all game folders and update the token",
                        ubisoftHeader: "Ubisoft Activation",
                        tokenReqContent: "token_req.txt content:",
                        copyFile: "Copy File",
                        copySuccess: "File Copied",
                        copyFail: "Copy Failed",
                        ubisoftEnterToken: "Enter token to create token.ini",
                        createToken: "Create token.ini",
                        creating: "Creating...",
                        createTokenInfo: "Will create <code style='color:#ff9800'>token.ini</code> in the same folder as token_req.txt",
                        back: "Back",
                        success: "Success!",
                        tokenRequired: "Please enter a token first",
                        eaHeader: "EA Games Activation",
                        eaEnterToken: "Enter Denuvo token for anadius.cfg",
                        eaActivate: "Activate Game",
                        eaSearchInfo: "Will search for <code style='color:#00bfa5'>anadius.cfg</code><br>and update the DenuvoToken value",
                        updating: "Updating...",
                        updatingToken: "Updating token...",
                        enterTokenFirst: "Please enter token first",
                        checkingInstall: "Checking install...",
                        searchAllDrives: "Search game in all drives",
                        searchingAllDrives: "Searching in all drives...",
                        foundInPath: "Game found at: {path}",
                        downloadActivationFiles: "Download activation files",
                        gameNotFoundAnyDrive: "Game was not found on any drive",
                        searchAgain: "Search again",
                        searchError: "Search error: {error}",
                        gameNotFound: "Game not found",
                        searchFailed: "Search failed",
                        gameNotInstalled: "Game is not installed",
                        installFirst: "Game is not installed. Install the game first.",
                        activationFilesDownloading: "Downloading activation files...",
                        activationFilesInstalled: "Activation files installed successfully!",
                        installedSuccess: "Installed successfully!",
                        extracting: "Extracting...",
                        downloadStartFailed: "Failed to start download"
                    },
                    fixes: {
                        header: "Game Fixes",
                        menu: "Fixes List",
                        gameIdNotFound: "Game ID was not found",
                        scanning: "Scanning...",
                        checkFailed: "Failed to check fixes",
                        bypassTitle: "Bypass Protection",
                        genericAvailable: "General bypass fix available (ready to install)",
                        genericUnavailable: "No bypass fix available for this game",
                        install: "Install",
                        unexpectedError: "Unexpected error",
                        installPathNotFound: "Game install path not found",
                        downloadingFix: "Downloading {fixType}...",
                        starting: "Starting...",
                        cancelled: "Cancelled",
                        installSuccess: "Installed successfully!",
                        canLaunchNow: "You can launch the game now",
                        finish: "Finish",
                        installedFix: "{fixType} installed successfully!",
                        installFailed: "Installation failed",
                        installFailedGeneric: "Failed to install fix"
                    }
                },
                ar: {
                    btn: {
                        add: "إضافة اللعبة للمكتبة",
                        addSoftware: "إضافة التطبيق للمكتبة",
                        remove: "إزالة من المكتبة",
                        loading: "جاري التحميل...",
                        removing: "جاري الإزالة...",
                        cancel: "إلغاء",
                        restartSteam: "Steam إعادة تشغيل",
                        openMenu: "Steam Tools"
                    },
                    welcomeTitle: "👋 مرحباً",
                    status: {
                        downloading: "جاري التحميل...",
                        checking: "جاري التحقق من التوفر...",
                        checkingApi: "...{api} جاري التحقق من",
                        queued: "جاري تهيئة التحميل...",
                        downloadingProgress: "({percent}%) ({total}MB / {downloaded}MB) ...جاري التحميل",
                        processing: "...ZIP جاري معالجة ملف",
                        extracting: "جاري استخراج ملفات اللعبة...",
                        extractingCount: "({count} ملف) ...جاري استخراج الملفات",
                        installing: "...Steam جاري التثبيت على",
                        failed: "فشل التحميل",
                        gameAdded: "تمت إضافة اللعبة بنجاح!"
                    },

                    notification: {
                        welcome: "Steam Tools أهلاً وسهلاً في",
                        gameAdded: "تمت إضافة اللعبة بنجاح!",
                        gameRemoved: "تم حذف اللعبة.",
                        downloadStarted: "بدأ التحميل...",
                        steamRestarting: "...Steam جاري إعادة تشغيل",
                        dlcTitle: "⚠️ (DLC) محتوى إضافي",
                        dlcWarning: "DLC لا يمكنك إضافة بشكل منفصل.\n\nعند إضافة اللعبة الأساسية، ستحصل على جميع الإضافات معها تلقائياً."
                    },
                    activations: {
                        header: "تفعيلات الالعاب",
                        menuBtn: "قائمة التفعيل",
                        title: "قائمة التفعيلات",
                        currentGame: "اللعبة الحالية",
                        enterToken: "أدخل التوكن الخاص بك",
                        pasteToken: "الصق التوكن هنا...",
                        searchApply: "بحث وتطبيق",
                        searching: "جاري البحث...",
                        searchInfo: "في جميع مجلدات اللعبة وتحديث التوكن<br><code style='color:#67c1f5'>configs.user.ini</code> سيتم البحث عن ملف",
                        ubisoftHeader: "Ubisoft تفعيل لعبة",
                        tokenReqContent: ":token_req.txt محتوى",
                        copyFile: "نسخ الملف",
                        copySuccess: "تم نسخ الملف",
                        copyFail: "فشل النسخ",
                        ubisoftEnterToken: "token.ini أدخل التوكن لإنشاء",
                        createToken: "token.ini إنشاء",
                        creating: "جاري الإنشاء...",
                        createTokenInfo: "token_req.txt في نفس مجلد <code style='color:#ff9800'>token.ini</code> سيتم إنشاء",
                        back: "رجوع",
                        success: "تم بنجاح!",
                        tokenRequired: "الرجاء إدخال التوكن أولاً",
                        eaHeader: "EA Games تفعيل لعبة",
                        eaEnterToken: "anadius.cfg أدخل توكن Denuvo لملف",
                        eaActivate: "تفعيل اللعبة",
                        eaSearchInfo: "وتحديث قيمة التوكن<br><code style='color:#00bfa5'>anadius.cfg</code> سيتم البحث عن ملف",
                        updating: "جاري التحديث...",
                        updatingToken: "جاري تحديث التوكن...",
                        enterTokenFirst: "الرجاء إدخال التوكن أولاً",
                        checkingInstall: "جاري التحقق من التثبيت...",
                        searchAllDrives: "البحث عن اللعبة في جميع الأقراص",
                        searchingAllDrives: "جاري البحث في جميع الأقراص...",
                        foundInPath: "تم العثور على اللعبة في: {path}",
                        downloadActivationFiles: "تحميل ملفات التفعيل",
                        gameNotFoundAnyDrive: "لم يتم العثور على اللعبة في أي قرص",
                        searchAgain: "البحث مرة أخرى",
                        searchError: "حدث خطأ أثناء البحث: {error}",
                        gameNotFound: "لم يتم العثور على اللعبة",
                        searchFailed: "فشل البحث",
                        gameNotInstalled: "اللعبة غير مثبتة",
                        installFirst: "اللعبة غير مثبتة. قم بتثبيت اللعبة أولاً.",
                        activationFilesDownloading: "جاري تحميل ملفات التفعيل...",
                        activationFilesInstalled: "تم تثبيت ملفات التفعيل بنجاح!",
                        installedSuccess: "تم التثبيت بنجاح!",
                        extracting: "جاري الاستخراج...",
                        downloadStartFailed: "فشل بدء التحميل"
                    },
                    fixes: {
                        header: "إصلاحات الألعاب",
                        menu: "قائمة الإصلاحات",
                        gameIdNotFound: "لم يتم العثور على معرف اللعبة",
                        scanning: "جاري الفحص...",
                        checkFailed: "فشل في فحص الإصلاحات",
                        bypassTitle: "تخطي الحماية",
                        genericAvailable: "إصلاح عام لتجاوز الحماية (يعمل، جاهز للتحميل)",
                        genericUnavailable: "لا يوجد تخطي حماية للعبة",
                        install: "تثبيت",
                        unexpectedError: "حدث خطأ غير متوقع",
                        installPathNotFound: "لم يتم العثور على مسار تثبيت اللعبة",
                        downloadingFix: "جاري تحميل {fixType}...",
                        starting: "جاري البدء...",
                        cancelled: "تم الإلغاء",
                        installSuccess: "تم التثبيت بنجاح!",
                        canLaunchNow: "يمكنك تشغيل اللعبة الآن",
                        finish: "إنهاء",
                        installedFix: "تم تثبيت {fixType} بنجاح!",
                        installFailed: "فشل التثبيت",
                        installFailedGeneric: "فشل في تثبيت الإصلاح"
                    },
                    generic: {
                        error: "خطأ",
                        close: "إغلاق"
                    }
                }
            },
            n = new class {
                constructor() {
                    this.translations = new Map, this.currentLocale = t, this.initialised = !1, this.initPromise = null
                }
                async init() {
                    this.initialised || (this.initPromise || (this.initPromise = this.bootstrap()), await this.initPromise, this.initialised = !0)
                }
                t(e, a) {
                    const n = this.lookup(this.currentLocale, e) ?? this.lookup(t, e) ?? e;
                    return "string" != typeof n ? e : a ? n.replace(/\{(.*?)\}/g, (e, t) => {
                        const n = a[t.trim()];
                        return null == n ? "" : String(n)
                    }) : n
                }
                async bootstrap() {
                    // Default to Arabic - start with hardcoded, then try external
                    const e = "en";
                    // First load hardcoded as fallback
                    this.loadLocale(e);
                    this.currentLocale = e;
                    // Then try to load from external file (async, will override)
                    setTimeout(() => this.loadLocaleFromFileAsync(e), 1000);
                }
                async loadLocaleFromFileAsync(locale) {
                    try {
                        // Try to load from backend (external file)
                        const result = await __call_server_method__("GetLocale", { locale: locale });
                        let parsed;
                        try {
                            parsed = typeof result === 'string' ? JSON.parse(result) : result;
                        } catch (e) {
                            parsed = null;
                        }
                        if (parsed && parsed.success && parsed.locale) {
                            this.translations.set(locale, parsed.locale);
                            console.log(`[SteamTools] Loaded locale '${locale}' from external file`);
                        }
                    } catch (e) {
                        console.warn(`[SteamTools] Failed to load locale from file: ${e}`);
                    }
                }
                async loadLocaleFromFile(locale) {
                    if (this.translations.has(locale)) return;
                    try {
                        // Try to load from backend (external file)
                        const result = await __call_server_method__("GetLocale", { locale: locale });
                        let parsed;
                        try {
                            parsed = typeof result === 'string' ? JSON.parse(result) : result;
                        } catch (e) {
                            parsed = null;
                        }
                        if (parsed && parsed.success && parsed.locale) {
                            this.translations.set(locale, parsed.locale);
                            console.log(`[SteamTools] Loaded locale '${locale}' from external file`);
                            return;
                        }
                    } catch (e) {
                        console.warn(`[SteamTools] Failed to load locale from file: ${e}`);
                    }
                    // Fallback to hardcoded locales
                    const fallback = locales[locale];
                    if (fallback) {
                        this.translations.set(locale, fallback);
                        console.log(`[SteamTools] Using fallback locale '${locale}'`);
                    }
                }
                loadLocale(e) {
                    if (this.translations.has(e)) return;
                    const t = locales[e];
                    t && this.translations.set(e, t)
                }
                lookup(e, t) {
                    const a = this.translations.get(e);
                    if (a) return t.split(".").reduce((e, t) => {
                        if (e && "object" == typeof e) return e[t]
                    }, a)
                }
            };
        function i(e, t) {
            return n.t(e, t)
        }
        let r = !1;
        let menuOpen = !1;
        // Default Locale
        let currentLocale = 'en';
        n.bootstrap();
        n.currentLocale = currentLocale;
        function s(e) {
            try {
                "function" == typeof Millennium?.callServerMethod && __call_server_method__("Logger.log", {
                    message: String(e)
                }).catch(() => { })
            } catch (e) {
                console.warn("[mPhpMaster] backendLog failed", e)
            }
        }
        async function l(e, t) {
            try {
                const a = void 0 === t ? await __call_server_method__(e) : await __call_server_method__(e, t);
                if ("string" == typeof a) try {
                    return JSON.parse(a)
                } catch {
                    return a
                }
                return a
            } catch (t) {
                throw s(`Backend call failed: ${e} - ${String(t)}`), t
            }
        }
        // Warning functions removed permanently
        function checkForDenuvo() { return false; }
        function showLauncherWarning() { }
        function showDenuvoWarning() { }
        function showEulaInfo() { }
        // Create mPhpMaster Menu
        function createMphpMasterMenu() {
            const existingMenu = document.querySelector('[data-mPhpMaster-menu="main"]');
            if (existingMenu) {
                existingMenu.remove();
                menuOpen = false;
                return;
            }
            menuOpen = true;
            const overlay = document.createElement("div");
            overlay.setAttribute("data-mPhpMaster-menu", "main");
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: mphpmasterFadeIn 0.2s ease;
            `;
            const menuContainer = document.createElement("div");

            // Get game background from Steam page (same method as SteamTools)
            let gameBackgroundUrl = "";
            try {
                const bannerImg = document.querySelector('.game_header_image_full');
                if (bannerImg && bannerImg.src) {
                    gameBackgroundUrl = bannerImg.src;
                }
            } catch (_) { }

            menuContainer.style.cssText = `
                background: linear-gradient(135deg, #1b2838 0%, #0f1923 100%);
                border: 2px solid #67c1f5;
                border-radius: 12px;
                width: 580px;
                min-width: 500px;
                max-height: 80vh;
                overflow: hidden;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 30px rgba(103, 193, 245, 0.3);
                animation: mphpmasterSlideIn 0.3s ease;
                position: relative;
            `;

            // Add background image layer if game background is available
            if (gameBackgroundUrl) {
                const bgLayer = document.createElement("div");
                bgLayer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: url('${gameBackgroundUrl}');
                    background-size: cover;
                    background-position: center top;
                    opacity: 0.4;
                    z-index: 0;
                `;
                menuContainer.appendChild(bgLayer);

                // Add dark overlay for better readability
                const overlayLayer = document.createElement("div");
                overlayLayer.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(180deg, rgba(15, 25, 35, 0.6) 0%, rgba(27, 40, 56, 0.85) 100%);
                    z-index: 1;
                `;
                menuContainer.appendChild(overlayLayer);
            }
            const header = document.createElement("div");
            header.style.cssText = `
                background: linear-gradient(90deg, rgba(27, 40, 56, 0.9) 0%, rgba(42, 71, 94, 0.9) 100%);
                padding: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
                border-bottom: 1px solid #67c1f5;
                position: relative;
                z-index: 2;
            `;
            const logo = document.createElement("img");
            logo.src = MPHPMASTER_LOGO_URL;
            logo.style.cssText = `
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: 2px solid #67c1f5;
                box-shadow: 0 0 15px rgba(103, 193, 245, 0.5);
            `;
            const titleContainer = document.createElement("div");
            titleContainer.style.cssText = "flex: 1;";
            const title = document.createElement("h2");
            title.textContent = "Steam Tools";
            title.style.cssText = `
                margin: 0;
                color: #ffffff;
                font-size: 22px;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(103, 193, 245, 0.5);
            `;
            titleContainer.appendChild(title);

            const headerActions = document.createElement("div");
            headerActions.style.cssText = "display: flex; align-items: center; gap: 8px;";

            // Discord Button (Header)
            const discordBtn = document.createElement("a");
            discordBtn.href = "steam://openurl_external/https://discord.gg/cwpNMFgruV";
            discordBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`;
            discordBtn.style.cssText = `
                background: rgba(88, 101, 242, 0.15);
                border: 1px solid rgba(88, 101, 242, 0.3);
                color: #5865F2;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            discordBtn.onmouseenter = () => {
                discordBtn.style.background = "#5865F2";
                discordBtn.style.color = "#fff";
                discordBtn.querySelector('path').style.fill = "#fff";
                discordBtn.style.boxShadow = "0 0 10px rgba(88, 101, 242, 0.4)";
            };
            discordBtn.onmouseleave = () => {
                discordBtn.style.background = "rgba(88, 101, 242, 0.15)";
                discordBtn.style.color = "#5865F2";
                discordBtn.querySelector('path').style.fill = "#fff";
                discordBtn.style.boxShadow = "none";
            };

            const closeBtn = document.createElement("button");
            closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13M1 13L13 1" stroke="#c7d5e0" stroke-width="2" stroke-linecap="round"/></svg>`;
            closeBtn.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #c7d5e0;
                width: 38px;

                height: 38px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onmouseenter = () => {
                closeBtn.style.background = "rgba(244, 67, 54, 0.3)";
                closeBtn.style.borderColor = "#f44336";
                closeBtn.querySelector('path').style.stroke = "#fff";
            };
            closeBtn.onmouseleave = () => {
                closeBtn.style.background = "rgba(255, 255, 255, 0.1)";
                closeBtn.style.borderColor = "rgba(255, 255, 255, 0.2)";
                closeBtn.querySelector('path').style.stroke = "#c7d5e0";
            };
            closeBtn.onclick = () => {
                overlay.remove();
                menuOpen = false;
            };
            // Language Toggle Button
            // Language Toggle Button
            headerActions.appendChild(discordBtn);
            headerActions.appendChild(closeBtn);

            header.appendChild(logo);
            header.appendChild(titleContainer);
            header.appendChild(headerActions);
            const content = document.createElement("div");
            content.style.cssText = `
                padding: 20px;
                max-height: 400px;
                overflow-y: auto;
                position: relative;
                z-index: 2;
            `;

            // Steam Games - Token input supported
            const steamActivationAppIds = [
                2358720,  // Black Myth Wukong
                703080,   // Planet Zoo
                3489700,  // Stellar Blade
                2486820,  // Sonic Racing: CrossWorlds
                2680010,  // The First Berserker: Khazan
                2928600,  // Demon Slayer - Kimetsu no Yaiba - The Hinokami Chronicles 2
                2958130,  // Jurassic World Evolution 3
                1941540,  // Mafia: The Old Country
                3764200   // Resident Evil Requiem
            ];

            // Ubisoft Games - Different method (coming soon)
            const ubisoftActivationAppIds = [
                3159330,  // Assassin's Creed Shadows
                3035570,  // Assassin's Creed Mirage
                2840770,  // Avatar Frontiers of Pandora
                2842040   // Star Wars Outlaws
            ];

            // EA Games - Different method (coming soon)
            const eaActivationAppIds = [
                1846380   // Need for Speed Unbound
            ];

            // Coming Soon Games - Not yet released
            const comingSoonAppIds = [
                3764200   // Resident Evil Requiem
            ];

            // All allowed appids
            const allowedActivationAppIds = [...steamActivationAppIds, ...ubisoftActivationAppIds, ...eaActivationAppIds];

            // Get current appid from URL
            const currentAppId = parseInt(window.location.href.match(/\/app\/(\d+)/)?.[1] || "0", 10);

            // Only show Activations section if current game is in allowed list
            if (allowedActivationAppIds.includes(currentAppId)) {
                // Game Activations Section Header
                const gameActivationsHeader = document.createElement("div");
                gameActivationsHeader.style.cssText = `
                    color: #67c1f5;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(103, 193, 245, 0.3);
                    text-align: center;
                `;
                gameActivationsHeader.textContent = i("activations.header");
                content.appendChild(gameActivationsHeader);

                // Activations Button
                const activationsBtn = document.createElement("button");
                activationsBtn.style.cssText = `
                    width: 100%;
                    padding: 15px 20px;
                    margin-bottom: 15px;
                    background: linear-gradient(90deg, rgba(42, 71, 94, 0.8) 0%, rgba(27, 40, 56, 0.8) 100%);
                    border: 1px solid rgba(103, 193, 245, 0.3);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                    text-align: right;
                    direction: rtl;
                `;
                activationsBtn.innerHTML = `<span style="font-size: 20px;">🔑</span><span>${i("activations.menuBtn")}</span>`;
                activationsBtn.onmouseenter = () => {
                    activationsBtn.style.background = "linear-gradient(90deg, rgba(103, 193, 245, 0.3) 0%, rgba(42, 71, 94, 0.8) 100%)";
                    activationsBtn.style.borderColor = "#67c1f5";
                    activationsBtn.style.transform = "translateX(-5px)";
                };
                activationsBtn.onmouseleave = () => {
                    activationsBtn.style.background = "linear-gradient(90deg, rgba(42, 71, 94, 0.8) 0%, rgba(27, 40, 56, 0.8) 100%)";
                    activationsBtn.style.borderColor = "rgba(103, 193, 245, 0.3)";
                    activationsBtn.style.transform = "translateX(0)";
                };
                activationsBtn.onclick = () => showActivationsMenu(content);
                content.appendChild(activationsBtn);
            }

            // Only show Fixes section if NOT in activation games list
            if (!allowedActivationAppIds.includes(currentAppId)) {
                // Fixes Section Header
                const fixesSectionHeader = document.createElement("div");
                fixesSectionHeader.style.cssText = `
                    color: #67c1f5;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid rgba(103, 193, 245, 0.3);
                    text-align: center;
                `;
                fixesSectionHeader.textContent = "🔧 " + i("fixes.header");
                content.appendChild(fixesSectionHeader);

                // Fixes Button
                const fixesBtn = document.createElement("button");
                fixesBtn.style.cssText = `
                    width: 100%;
                    padding: 15px 20px;
                    margin-bottom: 15px;
                    background: linear-gradient(90deg, rgba(76, 175, 80, 0.3) 0%, rgba(27, 40, 56, 0.8) 100%);
                    border: 1px solid rgba(76, 175, 80, 0.5);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                    text-align: right;
                    direction: rtl;
                `;
                fixesBtn.innerHTML = `<span style="font-size: 20px;">🛠️</span><span>${i("fixes.menu")}</span>`;
                fixesBtn.onmouseenter = () => {
                    fixesBtn.style.background = "linear-gradient(90deg, rgba(76, 175, 80, 0.5) 0%, rgba(42, 71, 94, 0.8) 100%)";
                    fixesBtn.style.borderColor = "#4caf50";
                    fixesBtn.style.transform = "translateX(-5px)";
                };
                fixesBtn.onmouseleave = () => {
                    fixesBtn.style.background = "linear-gradient(90deg, rgba(76, 175, 80, 0.3) 0%, rgba(27, 40, 56, 0.8) 100%)";
                    fixesBtn.style.borderColor = "rgba(76, 175, 80, 0.5)";
                    fixesBtn.style.transform = "translateX(0)";
                };
                fixesBtn.onclick = () => showFixesMenu();
                content.appendChild(fixesBtn);
            }

            const menuItems = [];
            menuItems.forEach(item => {
                const btn = document.createElement("button");
                btn.style.cssText = `
                    width: 100%;
                    padding: 15px 20px;
                    margin-bottom: 10px;
                    background: linear-gradient(90deg, rgba(42, 71, 94, 0.8) 0%, rgba(27, 40, 56, 0.8) 100%);
                    border: 1px solid rgba(103, 193, 245, 0.3);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 16px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    transition: all 0.2s ease;
                    text-align: left;
                `;
                btn.innerHTML = `<span style="font-size: 20px;">${item.icon}</span><span>${item.label}</span>`;
                btn.onmouseenter = () => {
                    btn.style.background = "linear-gradient(90deg, rgba(103, 193, 245, 0.3) 0%, rgba(42, 71, 94, 0.8) 100%)";
                    btn.style.borderColor = "#67c1f5";
                    btn.style.transform = "translateX(5px)";
                };
                btn.onmouseleave = () => {
                    btn.style.background = "linear-gradient(90deg, rgba(42, 71, 94, 0.8) 0%, rgba(27, 40, 56, 0.8) 100%)";
                    btn.style.borderColor = "rgba(103, 193, 245, 0.3)";
                    btn.style.transform = "translateX(0)";
                };
                btn.onclick = item.action;
                content.appendChild(btn);
            });
            menuContainer.appendChild(header);
            menuContainer.appendChild(content);
            overlay.appendChild(menuContainer);
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    menuOpen = false;
                }
            };
            const style = document.createElement("style");
            style.textContent = `
                @keyframes mphpmasterFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes mphpmasterSlideIn {
                    from { transform: scale(0.9) translateY(-20px); opacity: 0; }
                    to { transform: scale(1) translateY(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
            document.body.appendChild(overlay);
        }

        // ==================== FIXES MENU ====================
        async function showFixesMenu() {
            // Close any existing menu
            const existingMenu = document.querySelector('[data-mPhpMaster-menu="main"]');
            if (existingMenu) {
                existingMenu.remove();
                menuOpen = false;
            }

            // Get current appid
            const currentAppId = parseInt(window.location.href.match(/\/app\/(\d+)/)?.[1] || "0", 10);
            if (!currentAppId) {
                mPhpMasterNotification.error(i("fixes.gameIdNotFound"));
                return;
            }

            // Create overlay
            const overlay = document.createElement("div");
            overlay.setAttribute("data-mPhpMaster-menu", "fixes");
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(8px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: mphpmasterFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            `;

            const modal = document.createElement("div");
            modal.style.cssText = `
                position: relative;
                background: #0d1219;
                border: 2px solid #3d4c53;
                border-radius: 12px;
                min-width: 580px;
                max-width: 700px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 0 0 1px rgba(76, 175, 80, 0.5), 0 20px 60px rgba(0, 0, 0, 0.8);
                animation: mphpmasterSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                overflow: hidden;
            `;

            // Header
            const header = document.createElement("div");
            header.style.cssText = `
                flex: 0 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 18px 24px;
                border-bottom: 1px solid #2a3844;
                background: linear-gradient(180deg, #1b2838 0%, #17202b 100%);
            `;

            const titleContainer = document.createElement("div");
            titleContainer.style.cssText = "display: flex; align-items: center; gap: 12px;";

            const logo = document.createElement("img");
            logo.src = MPHPMASTER_LOGO_URL;
            logo.style.cssText = "width: 32px; height: 32px; border-radius: 50%; border: 2px solid #4caf50;";

            const title = document.createElement("div");
            title.style.cssText = `
                font-size: 18px;
                color: #e4e7e9;
                font-weight: 700;
                letter-spacing: 0.5px;
            `;
            title.innerHTML = `🛠️ ${i("fixes.menu")}`;

            titleContainer.appendChild(logo);
            titleContainer.appendChild(title);

            const headerActions = document.createElement("div");
            headerActions.style.cssText = "display: flex; align-items: center; gap: 8px;";

            // Discord Button (Header)
            const discordBtn = document.createElement("a");
            discordBtn.href = "steam://openurl_external/https://discord.gg/cwpNMFgruV";
            discordBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`;
            discordBtn.style.cssText = `
                background: rgba(88, 101, 242, 0.15);
                border: 1px solid rgba(88, 101, 242, 0.3);
                color: #5865F2;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            discordBtn.onmouseenter = () => {
                discordBtn.style.background = "#5865F2";
                discordBtn.style.color = "#fff";
                discordBtn.querySelector('path').style.fill = "#fff";
                discordBtn.style.boxShadow = "0 0 10px rgba(88, 101, 242, 0.4)";
            };
            discordBtn.onmouseleave = () => {
                discordBtn.style.background = "rgba(88, 101, 242, 0.15)";
                discordBtn.style.color = "#5865F2";
                discordBtn.querySelector('path').style.fill = "#fff";
                discordBtn.style.boxShadow = "none";
            };

            const closeBtn = document.createElement("button");
            closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 1L1 13M1 1L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
            closeBtn.style.cssText = `
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.1);
                color: #8b929a;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onmouseenter = () => { closeBtn.style.background = "rgba(255, 255, 255, 0.1)"; closeBtn.style.color = "#fff"; };
            closeBtn.onmouseleave = () => { closeBtn.style.background = "rgba(255, 255, 255, 0.06)"; closeBtn.style.color = "#8b929a"; };
            closeBtn.onclick = () => overlay.remove();

            headerActions.appendChild(discordBtn);
            headerActions.appendChild(closeBtn);

            header.appendChild(titleContainer);
            header.appendChild(headerActions);

            // Body
            const body = document.createElement("div");
            body.style.cssText = `
                flex: 1 1 auto;
                overflow-y: auto;
                padding: 30px;
                background: linear-gradient(135deg, #0e141d 0%, #0a0e14 100%);
                direction: rtl;
                text-align: right;
                position: relative;
            `;

            // Add game background (blurred)
            try {
                const bannerImg = document.querySelector('.game_header_image_full');
                if (bannerImg && bannerImg.src) {
                    const bgDiv = document.createElement('div');
                    bgDiv.style.cssText = `
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: url('${bannerImg.src}') no-repeat center center;
                        background-size: cover;
                        opacity: 0.4;
                        filter: blur(4px);
                        pointer-events: none;
                        z-index: 0;
                    `;
                    modal.insertBefore(bgDiv, body);
                }
            } catch (_) { }

            // Loading state
            body.innerHTML = `
                <div style="text-align: center; padding: 40px; position: relative; z-index: 1;">
                    <div class="mphpmaster-fixes-spinner" style="
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(76, 175, 80, 0.2);
                        border-top-color: #4caf50;
                        border-radius: 50%;
                        animation: spin 0.8s ease infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <div style="color: #4caf50; font-size: 16px; font-weight: 600; margin-bottom: 20px;">${i("fixes.scanning")}</div>
                </div>
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
            `;

            modal.appendChild(header);
            modal.appendChild(body);
            overlay.appendChild(modal);
            overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
            document.body.appendChild(overlay);

            // Check for fixes (Generic ONLY)
            try {
                await new Promise(r => setTimeout(r, 600)); // Slight delay for smoother UI

                const result = await l("CheckForFixes", { appid: currentAppId });

                if (!result || !result.success) {
                    body.innerHTML = `
                        <div style="text-align: center; padding: 40px; position: relative; z-index: 1;">
                            <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                            <div style="color: #f44336; font-size: 18px;">${result?.error || i("fixes.checkFailed")}</div>
                            <button onclick="this.closest('[data-mPhpMaster-menu]').remove()" style="
                                margin-top: 20px;
                                padding: 10px 24px;
                                background: #f44336;
                                color: #fff;
                                border: none;
                                border-radius: 6px;
                                cursor: pointer;
                                font-size: 14px;
                            ">${i("generic.close")}</button>
                        </div>
                    `;
                    return;
                }

                const { gameName, genericFix } = result;
                const hasAnyFix = genericFix?.available;

                // Get install path
                let installPath = "";
                try {
                    const pathResult = await l("GetGameInstallPath", { appid: currentAppId });
                    if (pathResult?.success) {
                        installPath = pathResult.installPath;
                    }
                } catch (_) { }

                // Try to get Game Name and Icon from the page
                let domGameName = "";
                let domGameIcon = "";

                try {
                    const nameEl = document.querySelector('.apphub_AppName');
                    if (nameEl) domGameName = nameEl.textContent.trim();

                    const iconEl = document.querySelector('.apphub_AppIcon img');
                    if (iconEl && iconEl.src) domGameIcon = iconEl.src;
                } catch (_) { }

                const finalGameName = domGameName || gameName || `Game ${currentAppId}`;

                // BUILD RESULT UI
                let contentHTML = `
                    <div style="position: relative; z-index: 1;">
                        <div style="margin-bottom: 25px; display: flex; align-items: flex-end; justify-content: space-between;">
                            <div>
                                <div style="font-size: 22px; color: #fff; font-weight: 700; display: flex; align-items: center; gap: 15px;">
                                    ${finalGameName}
                                    ${domGameIcon ?
                        `<img src="${domGameIcon}" style="width: 32px; height: 32px; border-radius: 4px; object-fit: cover; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">` :
                        `<span style="font-size: 24px;">🎮</span>`
                    }
                                </div>
                                <div style="font-size: 13px; color: #677079; margin-top: 4px; font-family: monospace;">AppID: ${currentAppId}</div>
                            </div>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <!-- Generic Fix Card -->
                            <div style="
                                background: ${genericFix?.available ? 'linear-gradient(90deg, rgba(76, 175, 80, 0.1) 0%, rgba(30, 35, 40, 0.6) 100%)' : 'rgba(30, 35, 40, 0.4)'};
                                border: 1px solid ${genericFix?.available ? 'rgba(76, 175, 80, 0.3)' : 'rgba(255, 255, 255, 0.08)'};
                                border-radius: 12px;
                                padding: 20px;
                                transition: all 0.2s ease;
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                            ">
                                <div>
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                        <span style="font-size: 18px; font-weight: 700; color: ${genericFix?.available ? '#ff5252' : '#ff5252'}; letter-spacing: 0.5px;">${i("fixes.bypassTitle")}</span>
                                        <span style="font-size: 20px;">${genericFix?.available ? '✅' : '❌'}</span>
                                    </div>
                                    <div style="color: #8b929a; font-size: 13px;">
                                        ${genericFix?.available ? i("fixes.genericAvailable") : i("fixes.genericUnavailable")}
                                    </div>
                                </div>
                                ${genericFix?.available ? `
                                    <button id="mphpmaster-apply-generic-fix" style="
                                        padding: 10px 20px;
                                        background: linear-gradient(135deg, #4caf50 0%, #388e3c 100%);
                                        color: #fff;
                                        border: none;
                                        border-radius: 6px;
                                        cursor: pointer;
                                        font-size: 14px;
                                        font-weight: 600;
                                        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
                                        transition: all 0.2s ease;
                                    " onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform='translateY(0)'">
                                        ${i("fixes.install")}
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;

                body.innerHTML = contentHTML;

                // Handle Generic Fix button
                const genericBtn = body.querySelector('#mphpmaster-apply-generic-fix');
                if (genericBtn && genericFix?.available) {
                    genericBtn.onclick = () => applyFix(currentAppId, genericFix.url, installPath, 'Generic Fix', gameName, body, overlay);
                }

            } catch (err) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px; position: relative; z-index: 1;">
                        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                        <div style="color: #f44336; font-size: 18px;">${i("fixes.unexpectedError")}</div>
                        <div style="color: #8b929a; font-size: 13px; margin: 10px 0;">${String(err)}</div>
                    </div>
                `;
            }
        }

        // Apply Fix Function (Modified for new UI style)
        async function applyFix(appid, downloadUrl, installPath, fixType, gameName, body, overlay) {
            if (!installPath) {
                mPhpMasterNotification.error(i("fixes.installPathNotFound"));
                return;
            }

            // Show downloading UI
            body.innerHTML = `
                <div style="text-align: center; padding: 40px; position: relative; z-index: 1;">
                    <div class="mphpmaster-fixes-spinner" style="
                        width: 50px;
                        height: 50px;
                        border: 4px solid rgba(76, 175, 80, 0.2);
                        border-top-color: #4caf50;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin: 0 auto 20px;
                    "></div>
                    <div style="color: #4caf50; font-size: 18px; font-weight: 600; margin-bottom: 12px;">${i("fixes.downloadingFix", { fixType })}</div>
                    <div id="mphpmaster-fix-progress" style="color: #8b929a; font-size: 14px;">${i("fixes.starting")}</div>
                    <div style="margin-top: 25px; background: rgba(255,255,255,0.06); border-radius: 4px; height: 6px; overflow: hidden; width: 80%; margin-left: auto; margin-right: auto;">
                        <div id="mphpmaster-fix-progress-bar" style="width: 0%; height: 100%; background: #4caf50; transition: width 0.3s ease; border-radius: 4px;"></div>
                    </div>
                    <button id="mphpmaster-cancel-fix" style="
                        margin-top: 30px;
                        padding: 10px 24px;
                        background: transparent;
                        border: 1px solid #f44336;
                        color: #f44336;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.2s ease;
                    " onmouseenter="this.style.background='rgba(244, 67, 54, 0.1)'" onmouseleave="this.style.background='transparent'">${i("btn.cancel")}</button>
                </div>
            `;

            const progressText = body.querySelector('#mphpmaster-fix-progress');
            const progressBar = body.querySelector('#mphpmaster-fix-progress-bar');
            const cancelBtn = body.querySelector('#mphpmaster-cancel-fix');

            cancelBtn.onclick = async () => {
                await l("CancelFix", { appid });
                overlay.remove();
                mPhpMasterNotification.info(i("fixes.cancelled"));
            };

            try {
                // Start download
                await l("ApplyGameFix", {
                    appid,
                    downloadUrl,
                    installPath,
                    fixType,
                    gameName
                });

                // Poll for status
                let lastStatus = "";
                while (true) {
                    await new Promise(r => setTimeout(r, 400));

                    const statusResult = await l("GetFixStatus", { appid });
                    const state = statusResult?.state || {};

                    if (state.status !== lastStatus) {
                        lastStatus = state.status;
                    }

                    if (state.status === 'downloading') {
                        const bytes = state.bytesRead || 0;
                        const total = state.totalBytes || 0;
                        const percent = total > 0 ? Math.round((bytes / total) * 100) : 0;
                        progressBar.style.width = `${percent}%`;
                        const mb = (bytes / 1024 / 1024).toFixed(2);
                        const totalMb = (total / 1024 / 1024).toFixed(2);
                        progressText.innerHTML = `<span style="color:#e4e7e9">${percent}%</span> <span style="color:#677079">(${mb} / ${totalMb} MB)</span>`;
                    } else if (state.status === 'extracting') {
                        progressBar.style.width = '95%';
                        progressText.textContent = i("status.extracting");
                    } else if (state.status === 'done') {
                        progressBar.style.width = '100%';
                        body.innerHTML = `
                            <div style="text-align: center; padding: 40px; position: relative; z-index: 1;">
                                <div style="font-size: 50px; margin-bottom: 16px;">✅</div>
                                <div style="color: #4caf50; font-size: 20px; font-weight: 600; margin-bottom: 12px;">${i("fixes.installSuccess")}</div>
                                <div style="color: #8b929a; font-size: 14px; margin-bottom: 24px;">${i("fixes.canLaunchNow")}</div>
                                <button onclick="this.closest('[data-mPhpMaster-menu]').remove()" style="
                                    padding: 12px 30px;
                                    background: #4caf50;
                                    color: #fff;
                                    border: none;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 15px;
                                    font-weight: 600;
                                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                                ">${i("fixes.finish")}</button>
                            </div>
                        `;
                        mPhpMasterNotification.success(i("fixes.installedFix", { fixType }), gameName);
                        break;
                    } else if (state.status === 'failed' || state.status === 'cancelled') {
                        body.innerHTML = `
                            <div style="text-align: center; padding: 40px; position: relative; z-index: 1;">
                                <div style="font-size: 50px; margin-bottom: 16px;">❌</div>
                                <div style="color: #f44336; font-size: 18px; font-weight: 600; margin-bottom: 10px;">
                                    ${state.status === 'cancelled' ? i("fixes.cancelled") : i("fixes.installFailed")}
                                </div>
                                <div style="color: #8b929a; font-size: 14px; margin-bottom: 24px;">${state.error || ''}</div>
                                <button onclick="this.closest('[data-mPhpMaster-menu]').remove()" style="
                                    padding: 10px 24px;
                                    background: #2a3844;
                                    color: #fff;
                                    border: 1px solid #3d4c53;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-size: 14px;
                                ">${i("generic.close")}</button>
                            </div>
                        `;
                        if (state.status === 'failed') {
                            mPhpMasterNotification.error(state.error || i("fixes.installFailedGeneric"));
                        }
                        break;
                    }
                }
            } catch (err) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 40px; position: relative; z-index: 1;">
                        <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
                        <div style="color: #f44336; font-size: 18px;">${i("fixes.unexpectedError")}</div>
                        <div style="color: #8b929a; font-size: 13px; margin: 10px 0;">${String(err)}</div>
                    </div>
                `;
                mPhpMasterNotification.error(String(err));
            }
        }
        // ==================== END FIXES MENU ====================

        // Show Activations Menu
        function showActivationsMenu(container) {
            // Close the main menu first
            const existingMenu = document.querySelector('[data-mPhpMaster-menu="main"]');
            if (existingMenu) {
                existingMenu.remove();
                menuOpen = false;
            }

            // Create new overlay for Activations menu
            const overlay = document.createElement("div");
            overlay.setAttribute("data-mPhpMaster-menu", "activations");
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.75);
                backdrop-filter: blur(8px);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: mphpmasterFadeIn 0.2s ease;
            `;

            const modal = document.createElement("div");
            modal.style.cssText = `
                position: relative;
                background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%);
                color: #fff;
                border: 2px solid #67c1f5;
                border-radius: 12px;
                min-width: 580px;
                max-width: 700px;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(103, 193, 245, 0.3);
                animation: mphpmasterSlideIn 0.3s ease;
                overflow: hidden;
            `;

            // Header
            const header = document.createElement("div");
            header.style.cssText = `
                flex: 0 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 2px solid rgba(103, 193, 245, 0.3);
                background: linear-gradient(90deg, rgba(27, 40, 56, 0.95) 0%, rgba(42, 71, 94, 0.95) 100%);
            `;

            const titleContainer = document.createElement("div");
            titleContainer.style.cssText = "display: flex; align-items: center; gap: 15px;";

            const logo = document.createElement("img");
            logo.src = MPHPMASTER_LOGO_URL;
            logo.style.cssText = "width: 40px; height: 40px; border-radius: 50%; border: 2px solid #67c1f5;";

            const title = document.createElement("div");
            title.style.cssText = `
                font-size: 22px;
                color: #fff;
                font-weight: 700;
                text-shadow: 0 2px 8px rgba(103, 193, 245, 0.4);
            `;
            title.textContent = "Steam Tools · " + i("activations.title");

            titleContainer.appendChild(logo);
            titleContainer.appendChild(title);

            const headerActions = document.createElement("div");
            headerActions.style.cssText = "display: flex; align-items: center; gap: 8px;";

            // Discord Button
            const discordBtn = document.createElement("a");
            discordBtn.href = "steam://openurl_external/https://discord.gg/cwpNMFgruV";
            discordBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`;
            discordBtn.style.cssText = `
                background: rgba(88, 101, 242, 0.15);
                border: 1px solid rgba(88, 101, 242, 0.3);
                color: #5865F2;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            discordBtn.onmouseenter = () => {
                discordBtn.style.background = "#5865F2";
                discordBtn.style.color = "#fff";
                discordBtn.querySelector('path').style.fill = "#fff";
                discordBtn.style.boxShadow = "0 0 10px rgba(88, 101, 242, 0.4)";
            };
            discordBtn.onmouseleave = () => {
                discordBtn.style.background = "rgba(88, 101, 242, 0.15)";
                discordBtn.style.color = "#5865F2";
                discordBtn.querySelector('path').style.fill = "#fff";
                discordBtn.style.boxShadow = "none";
            };

            const closeBtn = document.createElement("button");
            closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1L13 13M1 13L13 1" stroke="#c7d5e0" stroke-width="2" stroke-linecap="round"/></svg>`;
            closeBtn.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: #c7d5e0;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            closeBtn.onmouseenter = () => { closeBtn.style.background = "rgba(244,67,54,0.3)"; closeBtn.style.borderColor = "#f44336"; closeBtn.querySelector('path').style.stroke = "#fff"; };
            closeBtn.onmouseleave = () => { closeBtn.style.background = "rgba(255,255,255,0.1)"; closeBtn.style.borderColor = "rgba(255,255,255,0.2)"; closeBtn.querySelector('path').style.stroke = "#c7d5e0"; };
            closeBtn.onclick = () => overlay.remove();

            headerActions.appendChild(discordBtn);
            headerActions.appendChild(closeBtn);

            header.appendChild(titleContainer);
            header.appendChild(headerActions);

            // Body with game background
            const body = document.createElement("div");
            body.style.cssText = `
                flex: 1 1 auto;
                overflow-y: auto;
                padding: 24px;
                border: 1px solid rgba(103, 193, 245, 0.2);
                margin: 16px;
                border-radius: 12px;
                background: rgba(11, 20, 30, 0.6);
            `;

            // Try to add game background
            try {
                const bannerImg = document.querySelector('.game_header_image_full');
                if (bannerImg && bannerImg.src) {
                    body.style.background = `linear-gradient(to bottom, rgba(11, 20, 30, 0.85), #0b141e 70%), url('${bannerImg.src}') no-repeat top center`;
                    body.style.backgroundSize = "cover";
                }
            } catch (_) { }

            // Game name header
            const gameHeader = document.createElement("div");
            gameHeader.style.cssText = "display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 20px;";

            const gameIcon = document.createElement("img");
            gameIcon.style.cssText = "width: 32px; height: 32px; border-radius: 4px; object-fit: cover; display: none;";
            try {
                const iconImg = document.querySelector('.apphub_AppIcon img');
                if (iconImg && iconImg.src) {
                    gameIcon.src = iconImg.src;
                    gameIcon.style.display = "block";
                }
            } catch (_) { }

            const gameName = document.createElement("div");
            gameName.style.cssText = "font-size: 20px; color: #fff; font-weight: 600; text-align: center;";
            try {
                const nameEl = document.querySelector('.apphub_AppName');
                gameName.textContent = nameEl ? nameEl.textContent : i("activations.currentGame");
            } catch (_) {
                gameName.textContent = i("activations.currentGame");
            }

            gameHeader.appendChild(gameIcon);
            gameHeader.appendChild(gameName);
            body.appendChild(gameHeader);

            // Get current appid to determine game type
            const currentAppId = parseInt(window.location.href.match(/\/app\/(\d+)/)?.[1] || "0", 10);

            // Ubisoft Games AppIDs (للتوكن الخاص)
            const ubisoftGamesInMenu = [
                3159330, 3035570, 2840770, 2842040
            ];

            // EA Games AppIDs (للتوكن الخاص - anadius.cfg)
            const eaGamesInMenu = [
                1846380   // Need for Speed Unbound
            ];

            // ألعاب تحتاج بحث خاص (Steam لا يكتشفها تلقائياً)
            const gamesNeedingSearch = {
                1941540: {  // Mafia: The Old Country
                    name: "Mafia The Old Country",
                    searchPath: "Engine\\Binaries\\ThirdParty\\Steamworks\\Steamv157\\Win64"
                }
            };

            const isUbisoftGame = ubisoftGamesInMenu.includes(currentAppId);
            const isEAGame = eaGamesInMenu.includes(currentAppId);
            const isComingSoon = comingSoonAppIds.includes(currentAppId);
            const needsSearch = gamesNeedingSearch[currentAppId] !== undefined;

            // ==================== تحميل ملفات التفعيل (لجميع الألعاب) ====================
            const downloadSection = document.createElement("div");
            downloadSection.style.cssText = `
                    background: linear-gradient(145deg, rgba(156, 39, 176, 0.15) 0%, rgba(42, 71, 94, 0.2) 100%);
                    border: 1px solid rgba(156, 39, 176, 0.4);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                `;

            const downloadBtn = document.createElement("button");
            downloadBtn.style.cssText = `
                    width: 100%;
                    padding: 16px 24px;
                    background: linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%);
                    border: none;
                    border-radius: 10px;
                    color: #ffffff;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(156, 39, 176, 0.3);
                `;

            // التحقق من تثبيت اللعبة أولاً
            let gameInstallPath = null;
            let searchBtnElement = null;
            downloadBtn.innerHTML = `<span style="font-size: 22px;">⏳</span><span>${i("activations.checkingInstall")}</span>`;
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = "0.7";
            downloadBtn.style.cursor = "not-allowed";

            // دالة لإنشاء زر البحث
            const createSearchButton = () => {
                if (searchBtnElement) return; // لا تنشئ زر مكرر

                searchBtnElement = document.createElement("button");
                searchBtnElement.style.cssText = `
                        width: 100%;
                        padding: 14px 20px;
                        margin-top: 12px;
                        background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
                        border: none;
                        border-radius: 10px;
                        color: #ffffff;
                        font-size: 15px;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
                    `;
                searchBtnElement.innerHTML = `<span style="font-size: 20px;">🔍</span><span>${i("activations.searchAllDrives")}</span>`;

                searchBtnElement.onmouseenter = () => {
                    searchBtnElement.style.transform = "translateY(-2px)";
                    searchBtnElement.style.boxShadow = "0 6px 20px rgba(255, 152, 0, 0.4)";
                };
                searchBtnElement.onmouseleave = () => {
                    searchBtnElement.style.transform = "translateY(0)";
                    searchBtnElement.style.boxShadow = "0 4px 15px rgba(255, 152, 0, 0.3)";
                };

                searchBtnElement.onclick = async () => {
                    searchBtnElement.disabled = true;
                    searchBtnElement.innerHTML = `<span style="font-size: 20px;">⏳</span><span>${i("activations.searchingAllDrives")}</span>`;
                    searchBtnElement.style.opacity = "0.7";

                    try {
                        const searchResult = await l("SearchGameInAllDrives", { appid: currentAppId });
                        if (searchResult?.success && searchResult?.installPath) {
                            gameInstallPath = searchResult.installPath;
                            mPhpMasterNotification.success(i("activations.foundInPath", { path: gameInstallPath }), "Steam Tools");

                            // تحديث زر التحميل
                            downloadBtn.innerHTML = `<span style="font-size: 22px;">📥</span><span>${i("activations.downloadActivationFiles")}</span>`;
                            downloadBtn.disabled = false;
                            downloadBtn.style.opacity = "1";
                            downloadBtn.style.cursor = "pointer";
                            downloadBtn.style.background = "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)";
                            downloadBtn.style.boxShadow = "0 4px 15px rgba(156, 39, 176, 0.3)";

                            // إخفاء زر البحث
                            searchBtnElement.style.display = "none";
                        } else {
                            mPhpMasterNotification.error(searchResult?.error || i("activations.gameNotFoundAnyDrive"));
                            searchBtnElement.innerHTML = `<span style="font-size: 20px;">🔍</span><span>${i("activations.searchAgain")}</span>`;
                            searchBtnElement.disabled = false;
                            searchBtnElement.style.opacity = "1";
                        }
                    } catch (err) {
                        mPhpMasterNotification.error(i("activations.searchError", { error: String(err) }));
                        searchBtnElement.innerHTML = `<span style="font-size: 20px;">🔍</span><span>${i("activations.searchAgain")}</span>`;
                        searchBtnElement.disabled = false;
                        searchBtnElement.style.opacity = "1";
                    }
                };

                downloadSection.appendChild(searchBtnElement);
            };

            (async () => {
                try {
                    const pathResult = await l("GetGameInstallPath", { appid: currentAppId });
                    if (pathResult?.success && pathResult?.installPath) {
                        gameInstallPath = pathResult.installPath;
                        downloadBtn.innerHTML = `<span style="font-size: 22px;">📥</span><span>${i("activations.downloadActivationFiles")}</span>`;
                        downloadBtn.disabled = false;
                        downloadBtn.style.opacity = "1";
                        downloadBtn.style.cursor = "pointer";
                    } else {
                        // إذا كانت اللعبة تحتاج بحث خاص، ابحث تلقائياً
                        if (needsSearch) {
                            downloadBtn.innerHTML = `<span style="font-size: 22px;">🔍</span><span>${i("activations.searchingAllDrives")}</span>`;
                            downloadBtn.style.background = "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)";
                            downloadBtn.style.boxShadow = "0 4px 15px rgba(255, 152, 0, 0.3)";

                            try {
                                const searchResult = await l("SearchGameInAllDrives", { appid: currentAppId });
                                if (searchResult?.success && searchResult?.installPath) {
                                    gameInstallPath = searchResult.installPath;
                                    mPhpMasterNotification.success(i("activations.foundInPath", { path: gameInstallPath }), "Steam Tools");
                                    downloadBtn.innerHTML = `<span style="font-size: 22px;">📥</span><span>${i("activations.downloadActivationFiles")}</span>`;
                                    downloadBtn.disabled = false;
                                    downloadBtn.style.opacity = "1";
                                    downloadBtn.style.cursor = "pointer";
                                    downloadBtn.style.background = "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)";
                                    downloadBtn.style.boxShadow = "0 4px 15px rgba(156, 39, 176, 0.3)";
                                } else {
                                    downloadBtn.innerHTML = `<span style="font-size: 22px;">🚫</span><span>${i("activations.gameNotFound")}</span>`;
                                    downloadBtn.style.background = "linear-gradient(135deg, #666 0%, #444 100%)";
                                    downloadBtn.style.boxShadow = "none";
                                    downloadBtn.style.cursor = "not-allowed";
                                    createSearchButton(); // أضف زر للبحث يدوياً
                                }
                            } catch (searchErr) {
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">🚫</span><span>${i("activations.searchFailed")}</span>`;
                                downloadBtn.style.background = "linear-gradient(135deg, #666 0%, #444 100%)";
                                downloadBtn.style.boxShadow = "none";
                                downloadBtn.style.cursor = "not-allowed";
                                createSearchButton(); // أضف زر للبحث يدوياً
                            }
                        } else {
                            if (isComingSoon) {
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">⏳</span><span>${i("activations.comingSoon")}</span>`;
                                downloadBtn.style.background = "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)";
                            } else {
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">🚫</span><span>${i("activations.gameNotInstalled")}</span>`;
                                downloadBtn.style.background = "linear-gradient(135deg, #666 0%, #444 100%)";
                            }
                            downloadBtn.style.boxShadow = "none";
                            downloadBtn.style.cursor = "not-allowed";
                        }
                    }
                } catch (e) {
                    // إذا كانت اللعبة تحتاج بحث خاص، ابحث تلقائياً
                    if (needsSearch) {
                        downloadBtn.innerHTML = `<span style="font-size: 22px;">🔍</span><span>${i("activations.searchingAllDrives")}</span>`;
                        downloadBtn.style.background = "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)";

                        try {
                            const searchResult = await l("SearchGameInAllDrives", { appid: currentAppId });
                            if (searchResult?.success && searchResult?.installPath) {
                                gameInstallPath = searchResult.installPath;
                                mPhpMasterNotification.success(i("activations.foundInPath", { path: gameInstallPath }), "Steam Tools");
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">📥</span><span>${i("activations.downloadActivationFiles")}</span>`;
                                downloadBtn.disabled = false;
                                downloadBtn.style.opacity = "1";
                                downloadBtn.style.cursor = "pointer";
                                downloadBtn.style.background = "linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)";
                                downloadBtn.style.boxShadow = "0 4px 15px rgba(156, 39, 176, 0.3)";
                            } else {
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">🚫</span><span>${i("activations.gameNotFound")}</span>`;
                                downloadBtn.style.background = "linear-gradient(135deg, #666 0%, #444 100%)";
                                downloadBtn.style.boxShadow = "none";
                                downloadBtn.style.cursor = "not-allowed";
                                createSearchButton();
                            }
                        } catch (searchErr) {
                            downloadBtn.innerHTML = `<span style="font-size: 22px;">🚫</span><span>${i("activations.searchFailed")}</span>`;
                            downloadBtn.style.background = "linear-gradient(135deg, #666 0%, #444 100%)";
                            downloadBtn.style.boxShadow = "none";
                            downloadBtn.style.cursor = "not-allowed";
                            createSearchButton();
                        }
                    } else {
                        if (isComingSoon) {
                            downloadBtn.innerHTML = `<span style="font-size: 22px;">⏳</span><span>${i("activations.comingSoon")}</span>`;
                            downloadBtn.style.background = "linear-gradient(135deg, #ff9800 0%, #f57c00 100%)";
                        } else {
                            downloadBtn.innerHTML = `<span style="font-size: 22px;">🚫</span><span>${i("activations.gameNotInstalled")}</span>`;
                            downloadBtn.style.background = "linear-gradient(135deg, #666 0%, #444 100%)";
                        }
                        downloadBtn.style.boxShadow = "none";
                        downloadBtn.style.cursor = "not-allowed";
                    }
                }
            })();

            downloadBtn.onmouseenter = () => {
                if (!downloadBtn.disabled) {
                    downloadBtn.style.transform = "translateY(-2px)";
                    downloadBtn.style.boxShadow = "0 6px 20px rgba(156, 39, 176, 0.4)";
                }
            };
            downloadBtn.onmouseleave = () => {
                if (!downloadBtn.disabled) {
                    downloadBtn.style.transform = "translateY(0)";
                    downloadBtn.style.boxShadow = "0 4px 15px rgba(156, 39, 176, 0.3)";
                }
            };

            downloadBtn.onclick = async () => {
                if (!gameInstallPath) {
                    mPhpMasterNotification.error(i("activations.installFirst"));
                    return;
                }

                downloadBtn.disabled = true;
                downloadBtn.innerHTML = `<span style="font-size: 22px;">⏳</span><span>${i("status.downloading")}</span>`;
                downloadBtn.style.opacity = "0.7";

                try {
                    // Start download
                    const result = await l("DownloadActivationFiles", { appid: currentAppId, installPath: gameInstallPath });
                    if (result?.success) {
                        mPhpMasterNotification.info(i("activations.activationFilesDownloading"), "Steam Tools");

                        // Poll for status
                        const checkStatus = async () => {
                            const status = await l("GetActivationStatus", { appid: currentAppId });
                            const state = status?.state || {};

                            if (state.status === "done") {
                                mPhpMasterNotification.success(i("activations.activationFilesInstalled"), "Steam Tools");
                                downloadBtn.disabled = false;
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">✅</span><span>${i("activations.installedSuccess")}</span>`;
                                downloadBtn.style.background = "linear-gradient(135deg, #4caf50 0%, #388e3c 100%)";
                                downloadBtn.style.opacity = "1";
                            } else if (state.status === "failed" || state.status === "cancelled") {
                                mPhpMasterNotification.error(state.error || i("status.failed"));
                                downloadBtn.disabled = false;
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">📥</span><span>${i("activations.downloadActivationFiles")}</span>`;
                                downloadBtn.style.opacity = "1";
                            } else {
                                const progressText = state.status === "extracting" ? i("activations.extracting") : i("status.downloading");
                                downloadBtn.innerHTML = `<span style="font-size: 22px;">⏳</span><span>${progressText}</span>`;
                                setTimeout(checkStatus, 500);
                            }
                        };
                        setTimeout(checkStatus, 500);
                    } else {
                        mPhpMasterNotification.error(result?.error || i("activations.downloadStartFailed"));
                        downloadBtn.disabled = false;
                        downloadBtn.innerHTML = `<span style="font-size: 22px;">📥</span><span>${i("activations.downloadActivationFiles")}</span>`;
                        downloadBtn.style.opacity = "1";
                    }
                } catch (err) {
                    mPhpMasterNotification.error(String(err));
                    downloadBtn.disabled = false;
                    downloadBtn.innerHTML = `<span style="font-size: 22px;">📥</span><span>${i("activations.downloadActivationFiles")}</span>`;
                    downloadBtn.style.opacity = "1";
                }
            };

            downloadSection.appendChild(downloadBtn);
            body.appendChild(downloadSection);
            // ==================== نهاية قسم تحميل ملفات التفعيل ====================

            if (!isUbisoftGame && !isEAGame) {
                // Token Configuration Section for Steam Games
                const tokenSection = document.createElement("div");
                tokenSection.style.cssText = `
                    background: linear-gradient(145deg, rgba(103, 193, 245, 0.1) 0%, rgba(42, 71, 94, 0.2) 100%);
                    border: 1px solid rgba(103, 193, 245, 0.3);
                    border-radius: 12px;
                    padding: 24px;
                `;

                // User ID input section (for coming soon games only)
                if (isComingSoon) {
                    const userIdLabel = document.createElement("div");
                    userIdLabel.style.cssText = "color: #ff9800; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-align: center;";
                    userIdLabel.innerHTML = "🆔 " + i("activations.enterUserID");
                    tokenSection.appendChild(userIdLabel);

                    const userIdInput = document.createElement("input");
                    userIdInput.type = "text";
                    userIdInput.placeholder = i("activations.pasteUserID");
                    userIdInput.style.cssText = `
                        width: 100%;
                        padding: 14px 16px;
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid rgba(255, 152, 0, 0.3);
                        border-radius: 8px;
                        color: #ffffff;
                        font-size: 14px;
                        outline: none;
                        box-sizing: border-box;
                        direction: ltr;
                        text-align: left;
                        margin-bottom: 16px;
                    `;
                    userIdInput.onfocus = () => { userIdInput.style.borderColor = "#ff9800"; };
                    userIdInput.onblur = () => { userIdInput.style.borderColor = "rgba(255, 152, 0, 0.3)"; };
                    tokenSection.appendChild(userIdInput);
                }

                // Token input label
                const tokenLabel = document.createElement("div");
                tokenLabel.style.cssText = "color: #67c1f5; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-align: center;";
                tokenLabel.innerHTML = "🔑 " + i("activations.enterToken");
                tokenSection.appendChild(tokenLabel);

                // Token input field
                const tokenInput = document.createElement("input");
                tokenInput.type = "text";
                tokenInput.placeholder = i("activations.pasteToken");
                tokenInput.style.cssText = `
                    width: 100%;
                    padding: 14px 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(103, 193, 245, 0.3);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                    direction: ltr;
                    text-align: left;
                    margin-bottom: 16px;
                `;
                tokenInput.onfocus = () => { tokenInput.style.borderColor = "#67c1f5"; };
                tokenInput.onblur = () => { tokenInput.style.borderColor = "rgba(103, 193, 245, 0.3)"; };
                tokenSection.appendChild(tokenInput);

                // Status message
                const statusMsg = document.createElement("div");
                statusMsg.style.cssText = "display: none; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; text-align: center;";
                tokenSection.appendChild(statusMsg);

                // Apply button
                const applyBtn = document.createElement("button");
                applyBtn.innerHTML = "🔍 " + i("activations.searchApply");
                applyBtn.style.cssText = `
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, rgba(92, 156, 62, 0.6) 0%, rgba(92, 156, 62, 0.3) 100%);
                    border: 1px solid rgba(92, 156, 62, 0.6);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                applyBtn.onmouseenter = () => {
                    applyBtn.style.background = "linear-gradient(135deg, rgba(92, 156, 62, 0.8) 0%, rgba(92, 156, 62, 0.5) 100%)";
                    applyBtn.style.transform = "translateY(-2px)";
                };
                applyBtn.onmouseleave = () => {
                    applyBtn.style.background = "linear-gradient(135deg, rgba(92, 156, 62, 0.6) 0%, rgba(92, 156, 62, 0.3) 100%)";
                    applyBtn.style.transform = "translateY(0)";
                };
                applyBtn.onclick = async () => {
                    const token = tokenInput.value.trim();
                    if (!token) {
                        statusMsg.style.display = "block";
                        statusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                        statusMsg.style.color = "#f44336";
                        statusMsg.textContent = "❌ " + i("activations.tokenRequired");
                        return;
                    }

                    // Show loading state
                    applyBtn.disabled = true;
                    applyBtn.innerHTML = "⏳ " + i("activations.searching");
                    statusMsg.style.display = "block";
                    statusMsg.style.background = "rgba(103, 193, 245, 0.2)";
                    statusMsg.style.color = "#67c1f5";
                    statusMsg.textContent = "🔍 " + i("activations.searching");

                    try {
                        const result = await l("UpdateConfigToken", { appid: currentAppId, token: token });
                        const response = typeof result === "string" ? JSON.parse(result) : result;

                        if (response.success) {
                            statusMsg.style.background = "rgba(92, 156, 62, 0.2)";
                            statusMsg.style.color = "#79c754";
                            statusMsg.textContent = "✅ " + response.message;
                            applyBtn.innerHTML = "✅ " + i("activations.success");
                        } else {
                            statusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                            statusMsg.style.color = "#f44336";
                            statusMsg.textContent = "❌ " + (response.error || i("generic.error"));
                            applyBtn.innerHTML = "🔍 " + i("activations.searchApply");
                            applyBtn.disabled = false;
                        }
                    } catch (err) {
                        statusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                        statusMsg.style.color = "#f44336";
                        statusMsg.textContent = "❌ " + i("generic.error") + ": " + String(err);
                        applyBtn.innerHTML = "🔍 " + i("activations.searchApply");
                        applyBtn.disabled = false;
                    }
                };
                tokenSection.appendChild(applyBtn);

                // Info text
                const infoText = document.createElement("div");
                infoText.style.cssText = "color: #8f98a0; font-size: 12px; margin-top: 16px; text-align: center; line-height: 1.6;";
                infoText.innerHTML = i("activations.searchInfo");
                tokenSection.appendChild(infoText);

                body.appendChild(tokenSection);

            } else if (isUbisoftGame) {
                // Ubisoft Games Token Section
                const ubisoftSection = document.createElement("div");
                ubisoftSection.style.cssText = `
                    background: linear-gradient(145deg, rgba(255, 152, 0, 0.1) 0%, rgba(42, 71, 94, 0.2) 100%);
                    border: 1px solid rgba(255, 152, 0, 0.3);
                    border-radius: 12px;
                    padding: 24px;
                `;

                // Ubisoft label
                const ubisoftLabel = document.createElement("div");
                ubisoftLabel.style.cssText = "color: #ff9800; font-size: 14px; font-weight: 600; margin-bottom: 16px; text-align: center;";
                ubisoftLabel.innerHTML = "🎮 " + i("activations.ubisoftHeader");
                ubisoftSection.appendChild(ubisoftLabel);

                // Token Request Box (will show token_req.txt content)
                const tokenReqBox = document.createElement("div");
                tokenReqBox.style.cssText = `
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 152, 0, 0.3);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 16px;
                    position: relative;
                `;

                // Header container
                const headerContainer = document.createElement("div");
                headerContainer.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;";

                const tokenReqLabel = document.createElement("div");
                tokenReqLabel.style.cssText = "color: #ff9800; font-size: 13px; font-weight: 600;";
                tokenReqLabel.textContent = "📄 " + i("activations.tokenReqContent");
                headerContainer.appendChild(tokenReqLabel);

                // Copy Button (Copies the file object)
                const copyBtn = document.createElement("button");
                copyBtn.innerHTML = "📋 " + i("activations.copyFile");
                copyBtn.title = "نسخ ملف token_req.txt نفسه للحافظة (للصق في ديسكورد أو المجلدات)";
                copyBtn.style.cssText = `
                    background: rgba(255, 152, 0, 0.15);
                    border: 1px solid rgba(255, 152, 0, 0.3);
                    color: #ff9800;
                    padding: 4px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s ease;
                `;
                copyBtn.onmouseenter = () => { copyBtn.style.background = "rgba(255, 152, 0, 0.3)"; };
                copyBtn.onmouseleave = () => { copyBtn.style.background = "rgba(255, 152, 0, 0.15)"; };

                let currentTokenFilePath = ""; // Store path for copy button

                copyBtn.onclick = async () => {
                    if (!currentTokenFilePath) return;

                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = "⏳ " + i("btn.loading");
                    copyBtn.disabled = true;

                    try {
                        const result = await l("CopyFileToClipboard", { filePath: currentTokenFilePath });
                        const response = typeof result === "string" ? JSON.parse(result) : result;

                        if (response.success) {
                            copyBtn.innerHTML = "✅ " + i("activations.copySuccess");
                        } else {
                            copyBtn.innerHTML = "❌ " + i("activations.copyFail");
                            console.error("Copy failed:", response.error);
                        }
                    } catch (err) {
                        copyBtn.innerHTML = "❌ " + i("generic.error");
                        console.error("Copy error:", err);
                    }

                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.disabled = false;
                    }, 2000);
                };
                headerContainer.appendChild(copyBtn);
                tokenReqBox.appendChild(headerContainer);

                const tokenReqContent = document.createElement("div");
                tokenReqContent.style.cssText = `
                    color: #67c1f5;
                    font-family: 'Consolas', monospace;
                    font-size: 12px;
                    word-break: break-all;
                    padding: 10px;
                    background: rgba(103, 193, 245, 0.08);
                    border-radius: 6px;
                    max-height: 100px;
                    overflow-y: auto;
                    direction: ltr;
                    text-align: left;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255, 152, 0, 0.3) rgba(0, 0, 0, 0.1);
                    line-height: 1.4;
                `;
                tokenReqContent.textContent = "⏳ " + i("activations.searching");
                tokenReqBox.appendChild(tokenReqContent);
                ubisoftSection.appendChild(tokenReqBox);

                // Load token_req.txt content
                (async () => {
                    try {
                        const result = await l("ReadUbisoftTokenReq", { appid: currentAppId });
                        const response = typeof result === "string" ? JSON.parse(result) : result;

                        if (response.success) {
                            tokenReqContent.textContent = response.content || "(فارغ)";
                            tokenReqContent.style.color = "#67c1f5";
                            currentTokenFilePath = response.filePath; // Save path
                            copyBtn.style.display = "block";
                        } else {
                            tokenReqContent.textContent = "❌ " + (response.error || i("generic.error"));
                            tokenReqContent.style.color = "#f44336";
                            copyBtn.style.display = "none";
                        }
                    } catch (err) {
                        tokenReqContent.textContent = "❌ " + i("generic.error") + ": " + String(err);
                        tokenReqContent.style.color = "#f44336";
                        copyBtn.style.display = "none";
                    }
                })();

                // Divider
                const divider = document.createElement("div");
                divider.style.cssText = "height: 1px; background: rgba(255, 152, 0, 0.2); margin: 16px 0;";
                ubisoftSection.appendChild(divider);

                // Token input label
                const tokenInputLabel = document.createElement("div");
                tokenInputLabel.style.cssText = "color: #ff9800; font-size: 14px; font-weight: 600; margin-bottom: 12px; text-align: center;";
                tokenInputLabel.innerHTML = "🔑 " + i("activations.ubisoftEnterToken");
                ubisoftSection.appendChild(tokenInputLabel);

                // Token input field (Textarea for multi-line)
                const ubisoftTokenInput = document.createElement("textarea");
                ubisoftTokenInput.placeholder = i("activations.pasteToken");
                ubisoftTokenInput.style.cssText = `
                    width: 100%;
                    padding: 14px 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 152, 0, 0.3);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 14px;
                    outline: none;
                    box-sizing: border-box;
                    direction: ltr;
                    text-align: left;
                    margin-bottom: 16px;
                    min-height: 120px;
                    resize: vertical;
                    font-family: monospace;
                    line-height: 1.4;
                `;
                ubisoftTokenInput.onfocus = () => { ubisoftTokenInput.style.borderColor = "#ff9800"; };
                ubisoftTokenInput.onblur = () => { ubisoftTokenInput.style.borderColor = "rgba(255, 152, 0, 0.3)"; };
                ubisoftSection.appendChild(ubisoftTokenInput);

                // Status message
                const ubisoftStatusMsg = document.createElement("div");
                ubisoftStatusMsg.style.cssText = "display: none; padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 13px; text-align: center;";
                ubisoftSection.appendChild(ubisoftStatusMsg);

                // Create token.ini button
                const createTokenBtn = document.createElement("button");
                createTokenBtn.innerHTML = "📝 " + i("activations.createToken");
                createTokenBtn.style.cssText = `
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, rgba(255, 152, 0, 0.6) 0%, rgba(255, 152, 0, 0.3) 100%);
                    border: 1px solid rgba(255, 152, 0, 0.6);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                `;
                createTokenBtn.onmouseenter = () => {
                    createTokenBtn.style.background = "linear-gradient(135deg, rgba(255, 152, 0, 0.8) 0%, rgba(255, 152, 0, 0.5) 100%)";
                    createTokenBtn.style.transform = "translateY(-2px)";
                };
                createTokenBtn.onmouseleave = () => {
                    createTokenBtn.style.background = "linear-gradient(135deg, rgba(255, 152, 0, 0.6) 0%, rgba(255, 152, 0, 0.3) 100%)";
                    createTokenBtn.style.transform = "translateY(0)";
                };
                createTokenBtn.onclick = async () => {
                    const token = ubisoftTokenInput.value.trim();
                    if (!token) {
                        ubisoftStatusMsg.style.display = "block";
                        ubisoftStatusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                        ubisoftStatusMsg.style.color = "#f44336";
                        ubisoftStatusMsg.textContent = "❌ " + i("activations.tokenRequired");
                        return;
                    }

                    createTokenBtn.disabled = true;
                    createTokenBtn.innerHTML = "⏳ " + i("activations.creating");
                    ubisoftStatusMsg.style.display = "block";
                    ubisoftStatusMsg.style.background = "rgba(255, 152, 0, 0.2)";
                    ubisoftStatusMsg.style.color = "#ff9800";
                    ubisoftStatusMsg.textContent = "📝 " + i("activations.creating");

                    try {
                        const result = await l("CreateUbisoftToken", { appid: currentAppId, token: token });
                        const response = typeof result === "string" ? JSON.parse(result) : result;

                        if (response.success) {
                            ubisoftStatusMsg.style.background = "rgba(92, 156, 62, 0.2)";
                            ubisoftStatusMsg.style.color = "#79c754";
                            ubisoftStatusMsg.textContent = "✅ " + response.message;
                            createTokenBtn.innerHTML = "✅ " + i("activations.success");
                        } else {
                            ubisoftStatusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                            ubisoftStatusMsg.style.color = "#f44336";
                            ubisoftStatusMsg.textContent = "❌ " + (response.error || i("generic.error"));
                            createTokenBtn.innerHTML = "📝 " + i("activations.createToken");
                            createTokenBtn.disabled = false;
                        }
                    } catch (err) {
                        ubisoftStatusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                        ubisoftStatusMsg.style.color = "#f44336";
                        ubisoftStatusMsg.textContent = "❌ " + i("generic.error") + ": " + String(err);
                        createTokenBtn.innerHTML = "📝 " + i("activations.createToken");
                        createTokenBtn.disabled = false;
                    }
                };
                ubisoftSection.appendChild(createTokenBtn);

                // Info text
                const ubisoftInfoText = document.createElement("div");
                ubisoftInfoText.style.cssText = "color: #8f98a0; font-size: 12px; margin-top: 16px; text-align: center; line-height: 1.6;";
                ubisoftInfoText.innerHTML = i("activations.createTokenInfo");
                ubisoftSection.appendChild(ubisoftInfoText);

                body.appendChild(ubisoftSection);
            } else if (isEAGame) {
                // ==================== EA Games Token Section ====================
                const eaSection = document.createElement("div");
                eaSection.style.cssText = `
                    background: linear-gradient(145deg, rgba(0, 150, 136, 0.1) 0%, rgba(42, 71, 94, 0.2) 100%);
                    border: 1px solid rgba(0, 150, 136, 0.3);
                    border-radius: 12px;
                    padding: 24px;
                `;

                // EA label
                const eaLabel = document.createElement("div");
                eaLabel.style.cssText = "color: #00bfa5; font-size: 14px; font-weight: 600; margin-bottom: 16px; text-align: center;";
                eaLabel.innerHTML = "🎮 " + i("activations.eaHeader");
                eaSection.appendChild(eaLabel);

                // EA Token input label
                const eaTokenLabel = document.createElement("div");
                eaTokenLabel.style.cssText = "color: #00bfa5; font-size: 13px; font-weight: 600; margin-bottom: 12px;";
                eaTokenLabel.textContent = "🔑 " + i("activations.eaEnterToken");
                eaSection.appendChild(eaTokenLabel);

                // EA Token input field
                const eaTokenInput = document.createElement("input");
                eaTokenInput.type = "text";
                eaTokenInput.placeholder = i("activations.pasteToken");
                eaTokenInput.style.cssText = `
                    width: 100%;
                    padding: 14px 16px;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(0, 150, 136, 0.3);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 14px;
                    margin-bottom: 16px;
                    box-sizing: border-box;
                    transition: border-color 0.2s ease;
                `;
                eaTokenInput.onfocus = () => { eaTokenInput.style.borderColor = "#00bfa5"; };
                eaTokenInput.onblur = () => { eaTokenInput.style.borderColor = "rgba(0, 150, 136, 0.3)"; };
                eaSection.appendChild(eaTokenInput);

                // EA Status message
                const eaStatusMsg = document.createElement("div");
                eaStatusMsg.style.cssText = `
                    display: none;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    font-size: 13px;
                    text-align: center;
                `;
                eaSection.appendChild(eaStatusMsg);

                // EA Activate button
                const eaActivateBtn = document.createElement("button");
                eaActivateBtn.innerHTML = "🎯 " + i("activations.eaActivate");
                eaActivateBtn.style.cssText = `
                    width: 100%;
                    padding: 14px 24px;
                    background: linear-gradient(135deg, #00bfa5 0%, #00897b 100%);
                    border: none;
                    border-radius: 10px;
                    color: #ffffff;
                    font-size: 15px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                `;
                eaActivateBtn.onmouseenter = () => {
                    eaActivateBtn.style.transform = "translateY(-2px)";
                    eaActivateBtn.style.boxShadow = "0 6px 20px rgba(0, 150, 136, 0.4)";
                };
                eaActivateBtn.onmouseleave = () => {
                    eaActivateBtn.style.transform = "translateY(0)";
                    eaActivateBtn.style.boxShadow = "none";
                };

                eaActivateBtn.onclick = async () => {
                    const token = eaTokenInput.value.trim();
                    if (!token) {
                        eaStatusMsg.style.display = "block";
                        eaStatusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                        eaStatusMsg.style.color = "#f44336";
                        eaStatusMsg.textContent = "❌ " + i("activations.enterTokenFirst");
                        return;
                    }

                    eaActivateBtn.disabled = true;
                    eaActivateBtn.innerHTML = "⏳ " + i("activations.updating");
                    eaStatusMsg.style.display = "block";
                    eaStatusMsg.style.background = "rgba(0, 150, 136, 0.2)";
                    eaStatusMsg.style.color = "#00bfa5";
                    eaStatusMsg.textContent = "📝 " + i("activations.updatingToken");

                    try {
                        const result = await l("UpdateEAConfigToken", { appid: currentAppId, token: token });
                        const response = typeof result === "string" ? JSON.parse(result) : result;

                        if (response.success) {
                            eaStatusMsg.style.background = "rgba(92, 156, 62, 0.2)";
                            eaStatusMsg.style.color = "#79c754";
                            eaStatusMsg.textContent = "✅ " + response.message;
                            eaActivateBtn.innerHTML = "✅ " + i("activations.success");
                        } else {
                            eaStatusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                            eaStatusMsg.style.color = "#f44336";
                            eaStatusMsg.textContent = "❌ " + (response.error || i("generic.error"));
                            eaActivateBtn.innerHTML = "🎯 " + i("activations.eaActivate");
                            eaActivateBtn.disabled = false;
                        }
                    } catch (err) {
                        eaStatusMsg.style.background = "rgba(244, 67, 54, 0.2)";
                        eaStatusMsg.style.color = "#f44336";
                        eaStatusMsg.textContent = "❌ " + i("generic.error") + ": " + String(err);
                        eaActivateBtn.innerHTML = "🎯 " + i("activations.eaActivate");
                        eaActivateBtn.disabled = false;
                    }
                };
                eaSection.appendChild(eaActivateBtn);

                // EA Info text
                const eaInfoText = document.createElement("div");
                eaInfoText.style.cssText = "color: #8f98a0; font-size: 12px; margin-top: 16px; text-align: center; line-height: 1.6;";
                eaInfoText.innerHTML = i("activations.eaSearchInfo");
                eaSection.appendChild(eaInfoText);

                body.appendChild(eaSection);
            }

            // Footer with back button
            const footer = document.createElement("div");
            footer.style.cssText = `
                flex: 0 0 auto;
                padding: 16px 20px;
                display: flex;
                justify-content: flex-start;
                border-top: 1px solid rgba(103, 193, 245, 0.2);
            `;

            const backBtn = document.createElement("button");
            backBtn.innerHTML = "← " + i("activations.back");
            backBtn.style.cssText = `
                background: rgba(103, 193, 245, 0.15);
                border: 1px solid rgba(103, 193, 245, 0.3);
                color: #67c1f5;
                padding: 10px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s ease;
            `;
            backBtn.onmouseenter = () => { backBtn.style.background = "rgba(103, 193, 245, 0.3)"; };
            backBtn.onmouseleave = () => { backBtn.style.background = "rgba(103, 193, 245, 0.15)"; };
            backBtn.onclick = () => {
                overlay.remove();
                createMphpMasterMenu();
            };
            footer.appendChild(backBtn);

            modal.appendChild(header);
            modal.appendChild(body);
            modal.appendChild(footer);
            overlay.appendChild(modal);

            overlay.onclick = (e) => {
                if (e.target === overlay) overlay.remove();
            };

            document.body.appendChild(overlay);
        }
        async function showLibrary(container) {
            container.innerHTML = "";
            const backBtn = document.createElement("button");
            backBtn.innerHTML = "â† " + i("generic.close");
            backBtn.style.cssText = `
                background: transparent;
                border: 1px solid #67c1f5;
                color: #67c1f5;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                margin-bottom: 15px;
                transition: all 0.2s ease;
            `;
            backBtn.onmouseenter = () => {
                backBtn.style.background = "#67c1f5";
                backBtn.style.color = "#1b2838";
            };
            backBtn.onmouseleave = () => {
                backBtn.style.background = "transparent";
                backBtn.style.color = "#67c1f5";
            };
            backBtn.onclick = () => {
                const overlay = document.querySelector('[data-mPhpMaster-menu="main"]');
                if (overlay) {
                    overlay.remove();
                    menuOpen = false;
                }
                createMphpMasterMenu();
            };
            container.appendChild(backBtn);
            const libraryTitle = document.createElement("h3");
            libraryTitle.textContent = i("menu.libraryTitle");
            libraryTitle.style.cssText = `
                color: #ffffff;
                margin: 0 0 15px 0;
                font-size: 18px;
            `;
            container.appendChild(libraryTitle);
            try {
                const result = await l("GetLocalLibrary");
                const apps = result?.apps || [];
                if (apps.length === 0) {
                    const noGames = document.createElement("p");
                    noGames.textContent = i("menu.noGames");
                    noGames.style.cssText = "color: #8f98a0; text-align: center; padding: 20px;";
                    container.appendChild(noGames);
                } else {
                    apps.forEach(appid => {
                        const gameItem = document.createElement("div");
                        gameItem.style.cssText = `
                            background: rgba(42, 71, 94, 0.5);
                            border: 1px solid rgba(103, 193, 245, 0.2);
                            border-radius: 8px;
                            padding: 12px 15px;
                            margin-bottom: 8px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            color: #ffffff;
                        `;
                        gameItem.innerHTML = `<span>App ID: ${appid}</span>`;
                        const removeBtn = document.createElement("button");
                        removeBtn.textContent = "•";
                        removeBtn.style.cssText = `
                            background: rgba(255, 82, 82, 0.2);
                            border: 1px solid rgba(255, 82, 82, 0.5);
                            color: #ff5252;
                            padding: 5px 10px;
                            border-radius: 5px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        `;
                        removeBtn.onmouseenter = () => {
                            removeBtn.style.background = "rgba(255, 82, 82, 0.4)";
                        };
                        removeBtn.onmouseleave = () => {
                            removeBtn.style.background = "rgba(255, 82, 82, 0.2)";
                        };
                        removeBtn.onclick = async () => {
                            await l("removeViamPhpMasterManifest", { appid });
                            mPhpMasterNotification.success(i("notification.gameRemoved"));
                            showLibrary(container);
                        };
                        gameItem.appendChild(removeBtn);
                        container.appendChild(gameItem);
                    });
                }
            } catch (err) {
                s(`GetLocalLibrary error: ${err}`);
            }
        }
        function showAbout(container) {
            container.innerHTML = "";
            const backBtn = document.createElement("button");
            backBtn.innerHTML = "â† " + i("generic.close");
            backBtn.style.cssText = `
                background: transparent;
                border: 1px solid #67c1f5;
                color: #67c1f5;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                margin-bottom: 15px;
                transition: all 0.2s ease;
            `;
            backBtn.onmouseenter = () => {
                backBtn.style.background = "#67c1f5";
                backBtn.style.color = "#1b2838";
            };
            backBtn.onmouseleave = () => {
                backBtn.style.background = "transparent";
                backBtn.style.color = "#67c1f5";
            };
            backBtn.onclick = () => {
                const overlay = document.querySelector('[data-mPhpMaster-menu="main"]');
                if (overlay) {
                    overlay.remove();
                    menuOpen = false;
                }
                createMphpMasterMenu();
            };
            container.appendChild(backBtn);
            const aboutContent = document.createElement("div");
            aboutContent.style.cssText = "text-align: center; padding: 20px;";
            aboutContent.innerHTML = `
                <img src="${MPHPMASTER_LOGO_URL}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #67c1f5; box-shadow: 0 0 20px rgba(103, 193, 245, 0.5);">
                <h3 style="color: #ffffff; margin: 0 0 10px 0; font-size: 24px;">mPhpMaster</h3>
                <p style="color: #67c1f5; margin: 0 0 20px 0;">Version 1.0.0</p>
                <p style="color: #8f98a0; margin: 0; line-height: 1.6;">
                    Millennium Plugin for Steam<br>
                    Download and manage games easily.
                </p>
            `;
            container.appendChild(aboutContent);
        }

        // Check if current page is a DLC
        function isDLCPage() {
            // Check for "Requires the base game" notice - this is the most reliable indicator
            const requiresBaseGame = document.querySelector('.game_area_dlc_bubble');
            if (requiresBaseGame) return true;

            // Check for DLC category in the app details (usually has "Downloadable Content" as category)
            const appDetailsBlock = document.querySelector('.game_details .details_block');
            if (appDetailsBlock) {
                const genreLinks = appDetailsBlock.querySelectorAll('a[href*="category"]');
                for (const link of genreLinks) {
                    if (link.textContent.trim().toLowerCase() === 'downloadable content') return true;
                }
            }

            return false;
        }

        // Check if current page is a Software/Application (not a game)
        function isSoftwarePage() {
            // Method 1: Check for "Software" in breadcrumbs
            const breadcrumbs = document.querySelectorAll('.breadcrumbs a, .blockbg a');
            for (const crumb of breadcrumbs) {
                const text = crumb.textContent.trim().toLowerCase();
                if (text === 'software' || text === 'برامج' || text === 'applications') return true;
            }

            // Method 2: Check for software category link
            const categoryLinks = document.querySelectorAll('a[href*="/genre/"], a[href*="/category/"]');
            for (const link of categoryLinks) {
                const href = link.getAttribute('href') || '';
                if (href.includes('Software') || href.includes('Utilities')) return true;
            }

            // Method 3: Check page URL for software indicator
            const url = window.location.href;
            if (url.includes('/software/') || url.includes('snr=1_7_7')) return true;

            // Method 4: Check the app type in page content
            const appHubClass = document.querySelector('.apphub_AppName');
            const pageTitle = document.title || '';
            const softwareIndicators = document.querySelectorAll('.game_area_purchase_game');
            for (const indicator of softwareIndicators) {
                const text = indicator.textContent.toLowerCase();
                if (text.includes('buy') && !text.includes('game') && (text.includes('software') || text.includes('tool') || text.includes('utility'))) {
                    return true;
                }
            }

            return false;
        }

        async function d(e, t, a, n, r, d) {
            // Check if this is a DLC page
            if (isDLCPage()) {
                mPhpMasterNotification.warning(i("notification.dlcWarning"), i("notification.dlcTitle"));
                a.textContent = i("btn.add");
                t.style.opacity = "1";
                t.style.pointerEvents = "auto";
                d();
                return false;
            }

            if (s(`Starting add flow for app ${e}`), !await async function (e) {
                return !0
            }(e)) return r(), d(), !1;
            a.textContent = i("btn.loading"), t.style.opacity = "0.7";
            mPhpMasterNotification.info(i("notification.downloadStarted"), "Download");
            const m = function (e = "status.downloading") {
                let t = i(e),
                    a = null,
                    n = null,
                    o = null,
                    r = !1;
                const s = () => {
                    if (!r) {
                        if (a || (a = document.querySelector('.newmodal[data-mPhpMaster-modal="download"]')), !a) {
                            const e = document.querySelector(".newmodal");
                            e && (e.setAttribute("data-mPhpMaster-modal", "download"), a = e)
                        }
                        a && (n || (n = a.querySelector(".newmodal_content"), n || (n = document.createElement("div"), a.appendChild(n))), n && (o ? o.textContent = t : (n.innerHTML = "", o = document.createElement("div"), o.style.minHeight = "40px", o.style.display = "flex", o.style.alignItems = "center", o.style.color = "#ffffff", o.textContent = t, n.appendChild(o))))
                    }
                },
                    renderModal = () => {
                        s(), o || setTimeout(s, 120)
                    },
                    c = (e = 0) => {
                        r || (r = !0, setTimeout(() => {
                            try {
                                const e = window.CModal;
                                a && a.matches('.newmodal[data-mPhpMaster-modal="download"]') && e?.DismissActiveModal ? e.DismissActiveModal() : a && "function" == typeof a.remove && a.remove()
                            } catch {
                                a && "function" == typeof a.remove && a.remove()
                            }
                        }, Math.max(0, e)))
                    };
                // Always use custom Steam modal for better Arabic support
                let progressBarEl = null;
                let percentTextEl = null;
                {
                    const e = document.createElement("div");
                    e.setAttribute("data-mPhpMaster-modal", "download");
                    e.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);z-index:10000;animation:mphpmasterFadeIn 0.3s ease;";

                    const modalBox = document.createElement("div");
                    modalBox.style.cssText = "background:linear-gradient(145deg,#1e3a4d 0%,#0d1b26 100%);border:2px solid rgba(103,193,245,0.5);border-radius:16px;padding:0;min-width:400px;max-width:480px;color:#fff;font-family:'Motiva Sans',Arial,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,0.5),0 0 30px rgba(103,193,245,0.2);overflow:hidden;animation:mphpmasterSlideIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55);direction:rtl;";

                    // Header with logo and close button
                    const header = document.createElement("div");
                    header.style.cssText = "display:flex;align-items:center;gap:14px;padding:18px 20px;background:linear-gradient(180deg,rgba(103,193,245,0.15) 0%,transparent 100%);border-bottom:1px solid rgba(103,193,245,0.2);";

                    const logo = document.createElement("img");
                    logo.src = MPHPMASTER_LOGO_URL;
                    logo.style.cssText = "width:44px;height:44px;border-radius:50%;border:2px solid #67c1f5;box-shadow:0 0 20px rgba(103,193,245,0.5);";

                    const titleText = document.createElement("div");
                    titleText.textContent = "Steam Tools";
                    titleText.style.cssText = "flex:1;color:#fff;font-size:18px;font-weight:700;text-shadow:0 2px 10px rgba(0,0,0,0.3);";

                    // Close button
                    const closeBtn = document.createElement("button");
                    closeBtn.innerHTML = "✕";
                    closeBtn.style.cssText = "background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#c7d5e0;font-size:14px;width:32px;height:32px;border-radius:8px;cursor:pointer;transition:all 0.2s ease;display:flex;align-items:center;justify-content:center;";
                    closeBtn.onmouseenter = () => { closeBtn.style.background = "rgba(244,67,54,0.3)"; closeBtn.style.borderColor = "#f44336"; closeBtn.style.color = "#fff"; };
                    closeBtn.onmouseleave = () => { closeBtn.style.background = "rgba(255,255,255,0.1)"; closeBtn.style.borderColor = "rgba(255,255,255,0.2)"; closeBtn.style.color = "#c7d5e0"; };
                    closeBtn.onclick = () => c(0);

                    titleText.style.textAlign = "left";
                    header.appendChild(closeBtn);
                    header.appendChild(titleText);
                    header.appendChild(logo);

                    // Content area
                    const contentArea = document.createElement("div");
                    contentArea.style.cssText = "padding:24px;";

                    // Status icon container (changes based on state)
                    const statusIcon = document.createElement("div");
                    statusIcon.className = "mphpmaster-status-icon";
                    statusIcon.style.cssText = "display:flex;justify-content:center;margin-bottom:16px;";
                    statusIcon.innerHTML = '<div class="mphpmaster-spinner" style="width:60px;height:60px;border:4px solid rgba(103,193,245,0.2);border-top-color:#67c1f5;border-radius:50%;animation:mphpmasterSpin 1s linear infinite;"></div>';

                    // Status text
                    o = document.createElement("div");
                    o.textContent = t;
                    o.style.cssText = "font-size:15px;color:#c7d5e0;text-align:center;margin-bottom:20px;line-height:1.6;direction:rtl;";

                    // Progress section
                    const progressSection = document.createElement("div");
                    progressSection.style.cssText = "background:rgba(0,0,0,0.2);border-radius:12px;padding:16px;";

                    // Progress bar container
                    const progressContainer = document.createElement("div");
                    progressContainer.style.cssText = "width:100%;height:10px;background:rgba(103,193,245,0.15);border-radius:5px;overflow:hidden;margin-bottom:12px;";

                    progressBarEl = document.createElement("div");
                    progressBarEl.className = "mphpmaster-download-progress";
                    progressBarEl.style.cssText = "height:100%;width:0%;background:linear-gradient(90deg,#67c1f5,#4fc3f7,#67c1f5);background-size:200% 100%;border-radius:5px;transition:width 0.3s ease;";
                    progressContainer.appendChild(progressBarEl);

                    // Percent text
                    percentTextEl = document.createElement("div");
                    percentTextEl.style.cssText = "display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#8f98a0;";
                    percentTextEl.innerHTML = '<span>0%</span><span>جاري التحميل...</span>';

                    progressSection.appendChild(progressContainer);
                    progressSection.appendChild(percentTextEl);

                    contentArea.appendChild(statusIcon);
                    contentArea.appendChild(o);
                    contentArea.appendChild(progressSection);

                    modalBox.appendChild(header);
                    modalBox.appendChild(contentArea);
                    e.appendChild(modalBox);

                    // Add animations and icons
                    const styleEl = document.createElement("style");
                    styleEl.textContent = `
                        @keyframes mphpmasterFadeIn{from{opacity:0}to{opacity:1}}
                        @keyframes mphpmasterSlideIn{from{transform:scale(0.8) translateY(-30px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}
                        @keyframes mphpmasterSpin{to{transform:rotate(360deg)}}
                        @keyframes mphpmasterPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.1);opacity:0.8}}
                        @keyframes mphpmasterBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
                        .mphpmaster-icon-success{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#4caf50,#81c784);display:flex;align-items:center;justify-content:center;animation:mphpmasterPulse 2s ease infinite;box-shadow:0 0 20px rgba(76,175,80,0.5);}
                        .mphpmaster-icon-success svg{width:32px;height:32px;fill:#fff;}
                        .mphpmaster-icon-error{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#f44336,#e57373);display:flex;align-items:center;justify-content:center;animation:mphpmasterPulse 2s ease infinite;box-shadow:0 0 20px rgba(244,67,54,0.5);}
                        .mphpmaster-icon-error svg{width:32px;height:32px;fill:#fff;}
                        .mphpmaster-icon-extract{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#ff9800,#ffb74d);display:flex;align-items:center;justify-content:center;animation:mphpmasterBounce 1s ease infinite;box-shadow:0 0 20px rgba(255,152,0,0.5);}
                        .mphpmaster-icon-extract svg{width:32px;height:32px;fill:#fff;}
                        .mphpmaster-icon-install{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#9c27b0,#ba68c8);display:flex;align-items:center;justify-content:center;animation:mphpmasterPulse 1.5s ease infinite;box-shadow:0 0 20px rgba(156,39,176,0.5);}
                        .mphpmaster-icon-install svg{width:32px;height:32px;fill:#fff;}
                        .mphpmaster-icon-download{width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#2196f3,#64b5f6);display:flex;align-items:center;justify-content:center;box-shadow:0 0 20px rgba(33,150,243,0.5);}
                        .mphpmaster-icon-download svg{width:32px;height:32px;fill:#fff;animation:mphpmasterBounce 1s ease infinite;}
                    `;
                    document.head.appendChild(styleEl);

                    document.body.appendChild(e);
                    a = e;
                    n = contentArea;

                    // Store reference to status icon for updates
                    n.statusIconEl = statusIcon;
                }
                return renderModal(), {
                    update: e => {
                        t = e, r || (o || renderModal(), o && (o.textContent = e))
                    },
                    setProgress: (percent, downloaded, total) => {
                        if (progressBarEl) {
                            progressBarEl.style.width = `${percent}%`;
                            if (percent > 0) progressBarEl.style.background = "linear-gradient(90deg,#4caf50,#81c784,#4caf50)";
                        }
                        if (percentTextEl) {
                            const dlText = downloaded && total ? `${downloaded}MB / ${total}MB` : "جاري التحميل...";
                            percentTextEl.innerHTML = `<span>${percent}%</span><span>${dlText}</span>`;
                        }
                    },
                    setStatus: (status) => {
                        if (!n || !n.statusIconEl) return;
                        const iconEl = n.statusIconEl;
                        switch (status) {
                            case 'downloading':
                                iconEl.innerHTML = '<div class="mphpmaster-icon-download"><svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg></div>';
                                break;
                            case 'extracting':
                            case 'processing':
                                iconEl.innerHTML = '<div class="mphpmaster-icon-extract"><svg viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-6 10H6v-2h8v2zm4-4H6v-2h12v2z"/></svg></div>';
                                break;
                            case 'installing':
                                iconEl.innerHTML = '<div class="mphpmaster-icon-install"><svg viewBox="0 0 24 24"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg></div>';
                                break;
                            case 'done':
                                iconEl.innerHTML = '<div class="mphpmaster-icon-success"><svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg></div>';
                                break;
                            case 'failed':
                                iconEl.innerHTML = '<div class="mphpmaster-icon-error"><svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></div>';
                                break;
                            default:
                                iconEl.innerHTML = '<div class="mphpmaster-spinner" style="width:60px;height:60px;border:4px solid rgba(103,193,245,0.2);border-top-color:#67c1f5;border-radius:50%;animation:mphpmasterSpin 1s linear infinite;"></div>';
                        }
                    },
                    showRestartNotice: () => {
                        if (!n) return;
                        if (n.querySelector('.mphpmaster-restart-notice')) return;

                        const notice = document.createElement("div");
                        notice.className = "mphpmaster-restart-notice";
                        notice.style.cssText = "margin-top:16px;padding:12px 16px;background:linear-gradient(135deg,rgba(255,152,0,0.15) 0%,rgba(255,193,7,0.1) 100%);border:1px solid rgba(255,152,0,0.4);border-radius:10px;display:flex;align-items:center;justify-content:center;gap:10px;";

                        notice.innerHTML = `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="#ff9800"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                            <span style="color:#ffb74d;font-weight:600;font-size:14px;">يجب إعادة تشغيل Steam لتظهر اللعبة</span>
                        `;

                        n.appendChild(notice);

                        // Add Restart Button
                        const restartBtn = document.createElement("button");
                        restartBtn.className = "mphpmaster-restart-btn";
                        restartBtn.innerHTML = `
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                            ${i("btn.restartSteam")}
                        `;
                        restartBtn.style.cssText = "margin-top:12px;width:100%;padding:12px;background:linear-gradient(135deg, #1976d2 0%, #1565c0 100%);color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:all 0.2s ease;box-shadow:0 4px 6px rgba(0,0,0,0.2);display:flex;align-items:center;justify-content:center;font-size:14px;";

                        restartBtn.onmouseenter = () => {
                            restartBtn.style.transform = "translateY(-2px)";
                            restartBtn.style.boxShadow = "0 6px 12px rgba(33, 150, 243, 0.4)";
                            restartBtn.style.background = "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)";
                        };
                        restartBtn.onmouseleave = () => {
                            restartBtn.style.transform = "translateY(0)";
                            restartBtn.style.boxShadow = "0 4px 6px rgba(0,0,0,0.2)";
                            restartBtn.style.background = "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)";
                        };

                        restartBtn.onclick = async () => {
                            try {
                                restartBtn.style.opacity = "0.7";
                                restartBtn.style.pointerEvents = "none";
                                // Loading spinner
                                restartBtn.innerHTML = '<div class="mphpmaster-spinner" style="width:20px;height:20px;border:2px solid rgba(255,255,255,0.3);border-top-color:#fff;border-radius:50%;animation:mphpmasterSpin 1s linear infinite;"></div>';

                                await l("RestartSteam");
                                mPhpMasterNotification.info(i("notification.steamRestarting"), "Steam");
                            } catch (err) {
                                console.error(err);
                                restartBtn.innerHTML = `<span>❌ ${i("status.failed")}</span>`;
                                restartBtn.style.background = "#f44336";
                                setTimeout(() => {
                                    restartBtn.innerHTML = `
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 8px;"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                                        ${i("btn.restartSteam")}
                                     `;
                                    restartBtn.style.background = "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)";
                                    restartBtn.style.opacity = "1";
                                    restartBtn.style.pointerEvents = "auto";
                                }, 2000);
                            }
                        };
                        n.appendChild(restartBtn);
                    },
                    close: c
                }
            }();

            try {
                let t = await l("addViamPhpMasterManifest", { appid: e });
                if (t?.success) return function (e, t, a) {
                    let n = !1;
                    const r = e => {
                        if (!n) {
                            n = !0, window.clearInterval(d);
                            try {
                                e()
                            } finally {
                                a.markIdle()
                            }
                        }
                    },
                        d = window.setInterval(async () => {
                            if (n) window.clearInterval(d);
                            else try {
                                const n = await l("GetStatus", {
                                    appid: e
                                });
                                if (!1 === n?.success) {
                                    const e = n?.error ?? i("generic.error");
                                    t.setStatus && t.setStatus('failed');
                                    mPhpMasterNotification.error(e);
                                    return t.update(`${i("status.failed")}: ${e}`), void r(() => a.onFailed(e))
                                }
                                const s = n?.state ?? n;
                                if (!s || "object" != typeof s) return;
                                const d = "string" == typeof s.status ? s.status.toLowerCase() : "";

                                // Update status icon based on current state
                                t.setStatus && t.setStatus(d);

                                // Update real progress bar
                                if (d === "downloading" && "number" == typeof s.bytesRead && "number" == typeof s.totalBytes && s.totalBytes > 0) {
                                    const percent = Math.min(100, Math.max(0, Math.floor(s.bytesRead / s.totalBytes * 100)));
                                    const downloaded = (s.bytesRead / 1048576).toFixed(1);
                                    const total = (s.totalBytes / 1048576).toFixed(1);
                                    t.setProgress && t.setProgress(percent, downloaded, total);
                                } else if (d === "extracting" || d === "processing") {
                                    t.setProgress && t.setProgress(100, null, null);
                                } else if (d === "installing") {
                                    t.setProgress && t.setProgress(100, null, null);
                                } else if (d === "done") {
                                    t.setProgress && t.setProgress(100, null, null);
                                }

                                if (t.update((e => {
                                    switch ("string" == typeof e.status ? e.status.toLowerCase() : "") {
                                        case "checking":
                                            return e.currentApi ? i("status.checkingApi", {
                                                api: e.currentApi
                                            }) : i("status.checking");
                                        case "checking_availability":
                                            return i("status.checking");
                                        case "queued":
                                            return i("status.queued");
                                        case "downloading":
                                            if ("number" == typeof e.bytesRead && "number" == typeof e.totalBytes && e.totalBytes > 0) {
                                                const t = (e.bytesRead / 1048576).toFixed(1),
                                                    a = (e.totalBytes / 1048576).toFixed(1),
                                                    n = Math.min(100, Math.max(0, Math.floor(e.bytesRead / e.totalBytes * 100)));
                                                return `${i("status.downloadingProgress", { downloaded: t, total: a })} (${n}%)`
                                            }
                                            return i("status.downloading");
                                        case "processing":
                                            return i("status.processing");
                                        case "extracting":
                                            return "number" == typeof e.extractedFiles ? i("status.extractingCount", {
                                                count: e.extractedFiles
                                            }) : i("status.extracting");
                                        case "installing":
                                            if (Array.isArray(e.installedFiles) && e.installedFiles.length > 0) return `${i("status.installing")} ${e.installedFiles[e.installedFiles.length - 1]}`;
                                            if ("string" == typeof e.installedPath) {
                                                const t = e.installedPath.split(/[\\/]/);
                                                return `${i("status.installing")} ${t[t.length - 1]}`
                                            }
                                            return i("status.installing");
                                        case "done":
                                            return i("status.gameAdded");
                                        case "failed":
                                            return e.error ? `${i("status.failed")}: ${e.error}` : i("status.failed");
                                        default:
                                            return "string" == typeof e.status && "" !== e.status.trim() ? e.status : "string" == typeof e.message ? e.message : i("status.downloading")
                                    }
                                })(s)), "done" === d) {
                                    t.setStatus && t.setStatus('done');
                                    mPhpMasterNotification.success(i("notification.gameAdded"));
                                    t.update(i("status.gameAdded"));
                                    t.showRestartNotice && t.showRestartNotice();
                                    r(a.onDone);
                                }
                                else if ("failed" === d) {
                                    const e = s.error ?? i("generic.error");
                                    t.setStatus && t.setStatus('failed');
                                    mPhpMasterNotification.error(e);
                                    t.update(`${i("status.failed")}: ${e}`), r(() => a.onFailed(e))
                                }
                            } catch (e) {
                                s(`Progress monitoring error: ${String(e)}`)
                            }
                        }, 600)
                }(e, m, {
                    onDone: () => {
                        n.remove()
                    },
                    onFailed: () => {
                        r()
                    },
                    markIdle: d
                }), !0;
                const a = t?.error ?? i("generic.error");
                m.setStatus && m.setStatus('failed');
                mPhpMasterNotification.error(a);
                return s(`Download failed: ${a}`), m.update(`${i("status.failed")}: ${a}`), d(), !1
            } catch (e) {
                const t = String(e);
                m.setStatus && m.setStatus('failed');
                mPhpMasterNotification.error(t);
                return s(`Download start error: ${t}`), m.update(`${i("status.failed")}: ${t}`), d(), !1
            }
        }
        async function u() {
            const e = function () {
                const e = window.location.href.match(/\/app\/(\d+)/);
                if (e) return parseInt(e[1], 10);
                const t = document.querySelector("[data-appid]");
                if (t) {
                    const e = t.getAttribute("data-appid");
                    if (e) {
                        const t = parseInt(e, 10);
                        if (!Number.isNaN(t)) return t
                    }
                }
                return null
            }();
            if (!e || document.querySelector('[data-mPhpMaster-button="action"]')) return;


            try {
                const a = await l("hasmPhpMasterForApp", {
                    appid: e
                }),
                    n = Boolean(a?.exists);
                const o = function () {
                    const e = [".game_area_purchase_game_wrapper .game_purchase_action_bg", ".game_area_purchase_game:not(.demo_above_purchase) .game_purchase_action_bg", ".game_area_purchase_game:not(.demo_above_purchase) .game_purchase_action", ".game_area_purchase_game:not(.demo_above_purchase) .btn_addtocart", ".game_area_purchase_game_wrapper", ".game_purchase_action_bg", ".game_purchase_action", ".btn_addtocart", '[class*="purchase"]'];
                    for (const t of e) {
                        const e = document.querySelector(t);
                        if (e) return t.endsWith(".btn_addtocart") ? e.parentElement : e
                    }
                    return null
                }();
                if (o) {
                    const t = document.createElement("div");
                    t.className = "btn_packageinfo", t.setAttribute("data-mPhpMaster-button", "action");
                    const a = document.createElement("span");
                    a.setAttribute("role", "button"), a.className = "btn_blue_steamui btn_medium", a.style.marginLeft = "2px";
                    const c = document.createElement("span");
                    // Check if it's software or game
                    const isSoftware = isSoftwarePage();
                    const addKey = isSoftware ? "btn.addSoftware" : "btn.add";
                    c.textContent = i(n ? "btn.remove" : addKey), a.appendChild(c), t.appendChild(a), a.onclick = async o => {
                        if (o.preventDefault(), o.stopPropagation(), r) return;
                        r = !0;
                        const c = () => {
                            a.style.pointerEvents = "auto", a.style.opacity = "1", c.textContent = i(n ? "btn.remove" : addKey)
                        };
                        if (n) {
                            a.style.pointerEvents = "none", a.style.opacity = "0.7", c.textContent = i("btn.removing");
                            const o = await async function (e, t, a) {
                                s(`Starting remove flow for app ${e}`);
                                try {
                                    const n = await l("removeViamPhpMasterManifest", {
                                        appid: e
                                    });
                                    if (n?.success) {
                                        mPhpMasterNotification.success(i("notification.gameRemoved"));
                                        return s("Game removed successfully from Steam Tools"), !0;
                                    }
                                    mPhpMasterNotification.error(n?.error ?? i("generic.error"));
                                    return s(`Failed to remove game: ${n?.error ?? i("generic.error")}`), a.textContent = i("btn.remove"), t.style.opacity = "1", t.style.pointerEvents = "auto", !1
                                } catch (e) {
                                    mPhpMasterNotification.error(String(e));
                                    return s(`Remove error: ${String(e)}`), a.textContent = i("btn.remove"), t.style.opacity = "1", t.style.pointerEvents = "auto", !1
                                }
                            }(e, a, c);
                            return r = !1, void (o ? t.remove() : c())
                        }
                        a.style.pointerEvents = "none", a.style.opacity = "0.7", c.textContent = i("btn.loading"), await d(e, a, c, t, c, () => {
                            r = !1
                        }) ? c.textContent = i("status.downloading") : c()
                    }, o.appendChild(t)
                }
                // Clean up old buttons
                const existingRestart = document.querySelector('[data-mPhpMaster-button="restart"]');
                if (existingRestart) existingRestart.remove();
                const existingMenu = document.querySelector('[data-mPhpMaster-button="menu"]');
                if (existingMenu) existingMenu.remove();
                const existingAuth = document.querySelector('[data-mphpmastermanifest-button="auth"]');
                if (existingAuth) existingAuth.remove();
                // Always Inject Buttons
                const queueBtn = document.querySelector("#queueBtnFollow");
                const ignoreBtn = document.querySelector("#ignoreBtn") || document.querySelector(".queue_control_button:last-child");
                if (queueBtn) {
                    // 1. Restart Steam Button
                    const t = document.createElement("div");
                    t.className = "queue_control_button", t.setAttribute("data-mPhpMaster-button", "restart");
                    const a = document.createElement("button");
                    a.className = "btnv6_blue_hoverfade btn_medium queue_btn_inactive";
                    const restartSpan = document.createElement("span");
                    restartSpan.textContent = i("btn.restartSteam");
                    restartSpan.style.direction = "rtl";
                    restartSpan.style.unicodeBidi = "embed";
                    restartSpan.style.display = "inline-block";
                    a.appendChild(restartSpan), t.appendChild(a), a.onclick = async ev => {
                        ev.preventDefault(), ev.stopPropagation();
                        const btn = ev.currentTarget;
                        try {
                            restartSpan.textContent = "Restarting...", btn.setAttribute("disabled", "true"), btn.style.opacity = "0.7", await l("RestartSteam")
                            mPhpMasterNotification.info(i("notification.steamRestarting"), "Steam");
                        } catch (err) {
                            mPhpMasterNotification.error(String(err));
                            s(`Error calling RestartSteam: ${String(err)}`)
                        } finally {
                            restartSpan.textContent = i("btn.restartSteam"), btn.removeAttribute("disabled"), btn.style.opacity = "1"
                        }
                    };
                    queueBtn.insertAdjacentElement("afterend", t);
                    // 2. Steam Tools Menu Button with Icon Only (on the right)
                    const menuBtnWrapper = document.createElement("div");
                    menuBtnWrapper.className = "queue_control_button", menuBtnWrapper.setAttribute("data-mPhpMaster-button", "menu");
                    menuBtnWrapper.style.cssText = "margin-left: 8px; display: flex; align-items: center;";
                    const menuBtn = document.createElement("button");
                    menuBtn.className = "btnv6_blue_hoverfade";
                    menuBtn.style.cssText = "display: flex; align-items: center; justify-content: center; padding: 0; width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #1b2838 0%, #2a475e 100%); border: 2px solid #67c1f5; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 0 8px rgba(103, 193, 245, 0.3);";
                    menuBtn.title = "Steam Tools";
                    menuBtn.onmouseenter = () => { menuBtn.style.boxShadow = "0 0 15px rgba(103, 193, 245, 0.6)"; menuBtn.style.transform = "scale(1.05)"; };
                    menuBtn.onmouseleave = () => { menuBtn.style.boxShadow = "0 0 8px rgba(103, 193, 245, 0.3)"; menuBtn.style.transform = "scale(1)"; };
                    const menuIcon = document.createElement("img");
                    menuIcon.src = MPHPMASTER_LOGO_URL;
                    menuIcon.style.cssText = "width: 24px; height: 24px; border-radius: 50%; object-fit: cover;";
                    menuBtn.appendChild(menuIcon);
                    menuBtnWrapper.appendChild(menuBtn);
                    menuBtn.onclick = (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        createMphpMasterMenu();
                    };
                    // Insert after ignore button (on the right side)
                    if (ignoreBtn) {
                        ignoreBtn.insertAdjacentElement("afterend", menuBtnWrapper);
                    } else {
                        const queueArea = document.querySelector(".queue_actions_ctn") || queueBtn.parentElement;
                        if (queueArea) {
                            queueArea.appendChild(menuBtnWrapper);
                        }
                    }
                }
            } catch (e) {
                s(`Failed to inject button: ${String(e)}`)
            }
        }
        let m = null;
        return e.default = async function () {
            await async function () {
                await n.init()
            }(), setTimeout(() => {
                // Show welcome notification once (using localStorage for persistence)
                if (!localStorage.getItem('mphpmasterWelcomeShown')) {
                    localStorage.setItem('mphpmasterWelcomeShown', 'true');
                    mPhpMasterNotification.info(i("notification.welcome"), i("welcomeTitle"));
                }
                new MutationObserver(() => {
                    window.location.href.includes("/app/") && (m && clearTimeout(m), m = setTimeout(() => {
                        u().catch(e => s(`Inject error: ${String(e)}`));
                        // Protection detection disabled
                    }, 200))
                }).observe(document.body, {
                    childList: !0,
                    subtree: !0
                }), u().catch(e => s(`Initial inject error: ${String(e)}`));
                // Protection detection disabled
            }, 1e3)
        }, Object.defineProperty(e, "__esModule", {
            value: !0
        }), e
    }({})
};
function ExecutePluginModule() {
    let e = window.MILLENNIUM_PLUGIN_SETTINGS_STORE.mPhpMaster;
    e.OnPluginConfigChange = function (t, a, n) {
        t in e.settingsStore && (e.ignoreProxyFlag = !0, e.settingsStore[t] = n, e.ignoreProxyFlag = !1)
    }, MILLENNIUM_BACKEND_IPC.postMessage(0, {
        pluginName: "mPhpMaster",
        methodName: "__builtins__.__millennium_plugin_settings_parser__"
    }).then(async t => {
        "string" == typeof t.returnValue && (e.ignoreProxyFlag = !0, e.settingsStore = e.DefinePluginSetting(Object.fromEntries(JSON.parse(atob(t.returnValue)).map(e => [e.functionName, e]))), e.ignoreProxyFlag = !1);
        let a = PluginEntryPointMain();
        Object.assign(window.PLUGIN_LIST.mPhpMaster, {
            ...a,
            __millennium_internal_plugin_name_do_not_use_or_change__: "mPhpMaster"
        });
        let n = await a.default();
        var i;
        n && (i = n) && void 0 !== i.title && void 0 !== i.icon && void 0 !== i.content ? (window.MILLENNIUM_SIDEBAR_NAVIGATION_PANELS.mPhpMaster = n, MILLENNIUM_BACKEND_IPC.postMessage(1, {
            pluginName: "mPhpMaster"
        })) : console.warn("Plugin mPhpMaster does not contain proper SidebarNavigation props and therefor can't be mounted by Millennium. Please ensure it has a title, icon, and content.")
    })
}
ExecutePluginModule();



