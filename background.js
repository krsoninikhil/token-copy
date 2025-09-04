// Background script to intercept network requests and capture Bearer tokens

let capturedTokens = new Map(); // Store tokens by origin

// Listen for web requests with Authorization headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (details.requestHeaders) {
      const authHeader = details.requestHeaders.find(
        header => header.name.toLowerCase() === 'authorization'
      );
      
      if (authHeader && authHeader.value.toLowerCase().startsWith('bearer ')) {
        const token = authHeader.value.substring(7); // Remove 'Bearer ' prefix
        const url = new URL(details.url);
        const origin = url.origin;
        
        // Store the token with timestamp and URL info
        capturedTokens.set(origin, {
          token: token,
          timestamp: Date.now(),
          url: details.url,
          method: details.method
        });
        
        // Store in chrome storage for persistence
        chrome.storage.local.set({
          [`token_${origin}`]: {
            token: token,
            timestamp: Date.now(),
            url: details.url,
            method: details.method
          }
        });
        
        console.log(`Bearer token captured for ${origin}:`, token.substring(0, 20) + '...');
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTokens') {
    // Get all stored tokens
    chrome.storage.local.get(null, (items) => {
      const tokens = {};
      Object.keys(items).forEach(key => {
        if (key.startsWith('token_')) {
          const origin = key.substring(6); // Remove 'token_' prefix
          tokens[origin] = items[key];
        }
      });
      sendResponse({ tokens: tokens });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'clearTokens') {
    // Clear all stored tokens
    chrome.storage.local.clear(() => {
      capturedTokens.clear();
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === 'getTokenForOrigin') {
    const origin = request.origin;
    chrome.storage.local.get(`token_${origin}`, (items) => {
      const tokenData = items[`token_${origin}`];
      sendResponse({ tokenData: tokenData });
    });
    return true;
  }
});

// Clean up old tokens (older than 24 hours)
setInterval(() => {
  const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
  
  chrome.storage.local.get(null, (items) => {
    Object.keys(items).forEach(key => {
      if (key.startsWith('token_') && items[key].timestamp < twentyFourHoursAgo) {
        chrome.storage.local.remove(key);
      }
    });
  });
}, 60 * 60 * 1000); // Run every hour
