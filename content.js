// Content script to handle token copying functionality

// Function to copy text to clipboard
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'copyToken') {
    copyToClipboard(request.token).then(success => {
      if (success) {
        // Show a temporary notification
        showNotification('Token copied to clipboard!');
        sendResponse({ success: true });
      } else {
        showNotification('Failed to copy token', 'error');
        sendResponse({ success: false, error: 'Failed to copy to clipboard' });
      }
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'getCurrentOrigin') {
    sendResponse({ origin: window.location.origin });
    return true;
  }
});

// Function to show notification
function showNotification(message, type = 'success') {
  // Remove any existing notification
  const existing = document.getElementById('token-copy-notification');
  if (existing) {
    existing.remove();
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.id = 'token-copy-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#f44336' : '#4CAF50'};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add animation keyframes
  if (!document.getElementById('token-copy-styles')) {
    const style = document.createElement('style');
    style.id = 'token-copy-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 300);
    }
  }, 3000);
}

// Add keyboard shortcut (Ctrl/Cmd + Shift + T) to copy current origin's token
document.addEventListener('keydown', async (event) => {
  if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
    event.preventDefault();
    
    // Get token for current origin
    chrome.runtime.sendMessage({
      action: 'getTokenForOrigin',
      origin: window.location.origin
    }, (response) => {
      if (response.tokenData && response.tokenData.token) {
        copyToClipboard(response.tokenData.token).then(success => {
          if (success) {
            showNotification(`Token copied! (${response.tokenData.token.substring(0, 20)}...)`);
          } else {
            showNotification('Failed to copy token', 'error');
          }
        });
      } else {
        showNotification('No token found for this origin', 'error');
      }
    });
  }
});
