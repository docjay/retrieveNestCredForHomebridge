#!/bin/bash

# Move to the directory where this script is located
cd "$(dirname "$0")"

# Display some information about the script
echo "========================================"
echo "Nest Credentials Capture Script Launcher"
echo "========================================"
echo "Starting npm script in: $(pwd)"
echo ""

# Force install Playwright browsers - more reliable approach
echo "Installing Playwright browsers..."
npx playwright install chromium --force
echo "Browsers installation complete."

# Set environment variables that might be needed for passkey access
export WEBKIT_FORCE_COMPLEX_TEXT=0
# Explicitly tell Playwright where to find browsers
export PLAYWRIGHT_BROWSERS_PATH=$(pwd)/node_modules/playwright-core/.local-browsers

# Request explicit permissions for keychain access (macOS specific)
security unlock-keychain login.keychain &> /dev/null || true

# Run the npm start command with additional browser permissions
npm start

# Keep the terminal window open after the script finishes
echo ""
echo "========================================"
echo "Script execution completed."