# Nest Credentials Capture Tool

This tool automates the capture of authentication credentials for Nest devices by monitoring network traffic during the login process to home.nest.com.

## Features

- Automatically captures the issue token and authentication cookies
- Displays and temporarily saves credentials to a text file
- Implements browser automation with anti-detection measures
- Handles browser installation automatically

## Prerequisites

- Node.js (v14 or later recommended)
- npm (comes with Node.js)
- macOS (for the start_nest.command script)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/docjay/nest.git
   cd nest
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Usage

### Method 1: Using the command script (macOS)

1. Double-click the `start_nest.command` file in Finder
2. The script will:
   - Install required browser dependencies
   - Launch Chrome in automation mode
   - Navigate to home.nest.com
   - Begin monitoring network traffic

### Method 2: Manual execution

1. Run the script with npm:
   ```
   npm start
   ```

2. A browser window will open automatically.
3. Log in to your Nest account using the browser window.
4. The script will capture the required credentials and display them.

## How It Works

1. The tool launches a Chrome browser in automation mode with anti-detection measures
2. It navigates to home.nest.com and allows you to log in manually
3. During the login process, it monitors network traffic for:
   - Requests containing "issuetoken" - captures the complete URL
   - Requests to "oauth2/iframe" - captures all cookies for the domain
4. Once both pieces of information are captured, it displays and temporarily saves them
5. The browser automatically closes after credentials are captured

## Troubleshooting

- If the browser fails to launch, try running: `npx playwright install chromium --force`
- For permission issues on macOS, run: `chmod +x start_nest.command`
- If Google login detection occurs, try manual interaction with the browser

## License

ISC License - See package.json for details
