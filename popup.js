// Popup script for Bearer Token Copier extension

document.addEventListener('DOMContentLoaded', async () => {
    await loadCurrentOriginInfo();
    await loadAllTokens();
    setupEventListeners();
});

// Get current tab's origin and load token info
async function loadCurrentOriginInfo() {
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        if (currentTab && currentTab.url) {
            const url = new URL(currentTab.url);
            const origin = url.origin;
            
            document.getElementById('originUrl').textContent = origin;
            
            // Get token for current origin
            chrome.runtime.sendMessage({
                action: 'getTokenForOrigin',
                origin: origin
            }, (response) => {
                if (response.tokenData) {
                    showCurrentToken(response.tokenData);
                } else {
                    showNoToken();
                }
            });
        }
    } catch (error) {
        console.error('Error loading current origin info:', error);
        document.getElementById('originUrl').textContent = 'Unable to detect origin';
        showNoToken();
    }
}

// Display current token info
function showCurrentToken(tokenData) {
    const currentTokenSection = document.getElementById('currentTokenSection');
    const noTokenMessage = document.getElementById('noTokenMessage');
    const tokenPreview = document.getElementById('currentTokenPreview');
    const tokenMeta = document.getElementById('currentTokenMeta');
    
    currentTokenSection.style.display = 'block';
    noTokenMessage.style.display = 'none';
    
    // Show token preview (first 30 chars + ...)
    const preview = tokenData.token.length > 30 
        ? tokenData.token.substring(0, 30) + '...' 
        : tokenData.token;
    tokenPreview.textContent = preview;
    
    // Show metadata
    const timestamp = new Date(tokenData.timestamp).toLocaleString();
    const method = tokenData.method || 'Unknown';
    tokenMeta.innerHTML = `
        <div class="meta-item">📅 ${timestamp}</div>
        <div class="meta-item">🔗 ${method} request</div>
    `;
    
    // Store full token for copying
    document.getElementById('copyCurrentToken').dataset.token = tokenData.token;
}

// Show no token message
function showNoToken() {
    const currentTokenSection = document.getElementById('currentTokenSection');
    const noTokenMessage = document.getElementById('noTokenMessage');
    
    currentTokenSection.style.display = 'none';
    noTokenMessage.style.display = 'block';
}

// Load all captured tokens
async function loadAllTokens() {
    chrome.runtime.sendMessage({ action: 'getTokens' }, (response) => {
        const tokensList = document.getElementById('tokensList');
        const loadingMessage = document.getElementById('loadingMessage');
        
        loadingMessage.style.display = 'none';
        
        if (response.tokens && Object.keys(response.tokens).length > 0) {
            displayTokens(response.tokens);
        } else {
            tokensList.innerHTML = '<div class="no-tokens">No tokens captured yet</div>';
        }
    });
}

// Display all tokens in the list
function displayTokens(tokens) {
    const tokensList = document.getElementById('tokensList');
    tokensList.innerHTML = '';
    
    // Sort tokens by timestamp (newest first)
    const sortedTokens = Object.entries(tokens).sort((a, b) => b[1].timestamp - a[1].timestamp);
    
    sortedTokens.forEach(([origin, tokenData]) => {
        const tokenItem = createTokenItem(origin, tokenData);
        tokensList.appendChild(tokenItem);
    });
}

// Create a token item element
function createTokenItem(origin, tokenData) {
    const tokenItem = document.createElement('div');
    tokenItem.className = 'token-item';
    
    const timestamp = new Date(tokenData.timestamp).toLocaleString();
    const tokenPreview = tokenData.token.length > 40 
        ? tokenData.token.substring(0, 40) + '...' 
        : tokenData.token;
    
    tokenItem.innerHTML = `
        <div class="token-origin">${origin}</div>
        <div class="token-preview">${tokenPreview}</div>
        <div class="token-meta">
            <span class="timestamp">📅 ${timestamp}</span>
            <span class="method">🔗 ${tokenData.method || 'Unknown'}</span>
        </div>
        <div class="token-actions">
            <button class="copy-btn small" data-token="${tokenData.token}" title="Copy token">
                📋 Copy
            </button>
        </div>
    `;
    
    return tokenItem;
}

// Setup event listeners
function setupEventListeners() {
    // Copy current token button
    document.getElementById('copyCurrentToken').addEventListener('click', (e) => {
        const token = e.target.dataset.token;
        if (token) {
            copyToken(token);
        }
    });
    
    // Clear all tokens button
    document.getElementById('clearAllTokens').addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all captured tokens?')) {
            chrome.runtime.sendMessage({ action: 'clearTokens' }, (response) => {
                if (response.success) {
                    loadAllTokens();
                    showNoToken();
                    showNotification('All tokens cleared!');
                }
            });
        }
    });
    
    // Event delegation for copy buttons in token list
    document.getElementById('tokensList').addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const token = e.target.dataset.token;
            if (token) {
                copyToken(token);
            }
        }
    });
}

// Copy token to clipboard
async function copyToken(token) {
    try {
        // Try to get current tab to send message to content script
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentTab = tabs[0];
        
        if (currentTab && currentTab.id) {
            chrome.tabs.sendMessage(currentTab.id, {
                action: 'copyToken',
                token: token
            }, (response) => {
                if (chrome.runtime.lastError) {
                    // Fallback to direct clipboard API
                    fallbackCopy(token);
                } else if (response && response.success) {
                    showNotification('Token copied to clipboard!');
                } else {
                    fallbackCopy(token);
                }
            });
        } else {
            fallbackCopy(token);
        }
    } catch (error) {
        fallbackCopy(token);
    }
}

// Fallback copy method
async function fallbackCopy(token) {
    try {
        await navigator.clipboard.writeText(token);
        showNotification('Token copied to clipboard!');
    } catch (err) {
        console.error('Failed to copy token:', err);
        showNotification('Failed to copy token', 'error');
    }
}

// Show notification in popup
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    const container = document.querySelector('.container');
    container.appendChild(notification);
    
    // Auto-remove after 2 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 2000);
}
