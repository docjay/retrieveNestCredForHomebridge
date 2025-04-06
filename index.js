/**
 * Nest Authentication Tool
 * 
 * Main entry point for the Nest authentication token collector.
 * This script helps retrieve the necessary authentication tokens
 * for the homebridge-nest plugin.
 */

const { collectNestAuth } = require('./src/nestAuth');
const { updateConfigAuth } = require('./src/configHelper');
const path = require('path');

// Configuration
const CONFIG_PATH = path.join(__dirname, 'config.json');

/**
 * Main function to run the authentication collection process
 */
async function main() {
  try {
    console.log('=== Nest Authentication Collector ===');
    console.log('This tool will help you collect the authentication tokens');
    console.log('needed for the homebridge-nest plugin.');
    console.log('');
    console.log('Instructions:');
    console.log('1. A browser window will open and navigate to home.nest.com');
    console.log('2. Please log in with your Google account when prompted');
    console.log('3. The tool will automatically collect the required tokens');
    console.log('4. Once complete, the tokens will be saved to config.json');
    console.log('');
    console.log('Starting authentication collection process...');
    
    // Run the authentication collection
    const { issueToken, cookies } = await collectNestAuth();
    
    // Update the config file with the new authentication data
    await updateConfigAuth(issueToken, cookies, CONFIG_PATH);
    
    console.log('');
    console.log('=== Authentication Process Complete ===');
    console.log(`Configuration saved to: ${CONFIG_PATH}`);
    console.log('You can now use these tokens with your homebridge-nest plugin.');
    
    return { success: true, configPath: CONFIG_PATH };
  } catch (error) {
    console.error('Authentication process failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };