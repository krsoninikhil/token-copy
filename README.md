# Bearer Token Copier Chrome Extension

This Chrome extension captures Bearer tokens from API calls in Authorization headers for the same origin and allows you to easily copy them to the clipboard.

> This project is coded by Cursor using Claude-4-Sonnet model. Use with caution.

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the folder containing these files
5. The extension icon should appear in your browser toolbar, pin it quick access.

## Usage

### Via Extension Popup
1. Click the extension icon in the toolbar
2. View captured tokens for all origins
3. Click "Copy" next to any token to copy it to clipboard
4. Current page's token is highlighted at the top

### Via Keyboard Shortcut
- Press `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac) on any page to quickly copy that origin's latest token

## Features

- ✅ Automatically captures Bearer tokens from API requests
- ✅ Stores tokens by origin for easy organization
- ✅ Beautiful popup UI showing all captured tokens
- ✅ One-click copying to clipboard
- ✅ Keyboard shortcut for quick access
- ✅ Visual notifications when tokens are copied
- ✅ Automatic cleanup of old tokens (24+ hours)
- ✅ Works only for same-origin requests for security

## Security

- Tokens are stored locally in the browser only
- Only captures tokens from the same origin as the current page
- Tokens are automatically cleaned up after 24 hours
- No data is sent to external servers

## Files Structure

- `manifest.json` - Extension configuration
- `background.js` - Service worker that intercepts network requests
- `content.js` - Content script for clipboard operations and notifications
- `popup.html/css/js` - Extension popup interface

Note: You'll need to create simple icon files (icon16.png, icon48.png, icon128.png) or remove the icons section from manifest.json.
