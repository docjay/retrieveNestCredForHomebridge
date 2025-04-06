# Nest Authentication Collector

A tool to automate the collection of authentication tokens required for the `homebridge-nest` plugin.

## Overview

This script automates the process of retrieving the `issueToken` and `cookies` values needed to authenticate with the Nest API via Google authentication. These tokens are required for the homebridge-nest plugin to access your Nest devices.

## Prerequisites

- Node.js (v14 or newer)
- npm (comes with Node.js)

### For macOS Users

If you don't have Node.js installed, you can use Homebrew to install it:

1. Install Homebrew (if not already installed):
```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

2. Install Node.js using Homebrew:
```
brew install node
```

## Installation

1. Clone or download this repository
2. Install dependencies:
```
npm install
```
3. Install the required browser:
```
npx playwright install chromium
```

## Usage

Run the script:
```
npm start
```

Or directly with Node:
```
node index.js
```

### What to expect:

1. A Chromium browser window will open and navigate to https://home.nest.com
2. You'll need to manually log in with your Google account
3. The script will automatically detect and capture the necessary authentication tokens
4. Once both tokens are collected, the browser will close
5. The tokens will be saved to `config.json` in the required format for homebridge-nest

## Using with Homebridge

After running the script successfully, copy the generated `config.json` file to your Homebridge configuration directory, or copy the `issueToken` and `cookies` values to your existing Homebridge configuration.

## Scheduled Refresh

These tokens expire periodically. You can set up a scheduled task (cron job) to refresh them:

```
0 0 */7 * * cd /path/to/nest-auth-collector && node index.js
```

This example would run the script every 7 days at midnight.

## Modular Design

This project is designed to be modular:
- `src/nestAuth.js` - Handles the browser automation and token collection
- `src/configHelper.js` - Manages reading/writing configuration files
- `index.js` - Main entry point that coordinates the process

You can import these modules in other projects to extend functionality.