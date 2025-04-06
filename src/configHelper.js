/**
 * Configuration Helper
 * 
 * Handles writing the authentication data to config.json file
 * in the format required by homebridge-nest plugin.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Writes the Nest authentication data to config.json
 * 
 * @param {string} issueToken - The Google issueToken URL
 * @param {string} cookies - The Google authentication cookies
 * @param {string} configPath - Path to save the config file (optional)
 * @returns {Promise<void>}
 */
async function writeConfigFile(issueToken, cookies, configPath = './config.json') {
  try {
    // Create config object in the format required by homebridge-nest
    const configData = {
      platform: "Nest",
      googleAuth: {
        issueToken,
        cookies
      }
    };
    
    // Pretty-print the JSON with 2-space indentation
    const configContent = JSON.stringify(configData, null, 2);
    
    // Write to file
    await fs.writeFile(path.resolve(configPath), configContent, 'utf8');
    
    console.log(`Successfully wrote authentication data to ${configPath}`);
  } catch (error) {
    console.error('Error writing config file:', error);
    throw error;
  }
}

/**
 * Reads the existing config file if it exists
 * 
 * @param {string} configPath - Path to the config file
 * @returns {Promise<Object|null>} The config object or null if file doesn't exist
 */
async function readConfigFile(configPath = './config.json') {
  try {
    const content = await fs.readFile(path.resolve(configPath), 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Config file does not exist at ${configPath}`);
      return null;
    }
    console.error('Error reading config file:', error);
    throw error;
  }
}

/**
 * Updates only the authentication portion of an existing config
 * or creates a new config if one doesn't exist
 * 
 * @param {string} issueToken - The Google issueToken URL
 * @param {string} cookies - The Google authentication cookies
 * @param {string} configPath - Path to the config file (optional)
 * @returns {Promise<void>}
 */
async function updateConfigAuth(issueToken, cookies, configPath = './config.json') {
  try {
    // Read existing config if available
    const existingConfig = await readConfigFile(configPath);
    
    // Create new config or update existing
    const updatedConfig = existingConfig 
      ? {
          ...existingConfig,
          googleAuth: { issueToken, cookies }
        }
      : {
          platform: "Nest",
          googleAuth: { issueToken, cookies }
        };
    
    // Write updated config back to file
    const configContent = JSON.stringify(updatedConfig, null, 2);
    await fs.writeFile(path.resolve(configPath), configContent, 'utf8');
    
    console.log(`Successfully updated authentication data in ${configPath}`);
  } catch (error) {
    console.error('Error updating config file:', error);
    throw error;
  }
}

module.exports = {
  writeConfigFile,
  readConfigFile,
  updateConfigAuth
};