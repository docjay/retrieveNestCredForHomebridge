/**
 * Nest Authentication Collector
 * 
 * This script uses Playwright to capture the authentication tokens needed for homebridge-nest:
 * 1. issueToken - from iframerpc request with action=issueToken
 * 2. cookies - collected directly from the browser context
 */

const { chromium } = require('playwright');
const { writeConfigFile } = require('./configHelper');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const https = require('https');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to get user confirmation
const askQuestion = (query) => new Promise((resolve) => {
  rl.question(query, resolve);
});

// Helper function to validate the authentication tokens with a test API call
async function validateTokens(cookies) {
  return new Promise((resolve) => {
    console.log('\n🔍 Validating authentication tokens with Nest API...');
    
    // Create a simple GET request to the Nest API
    const options = {
      hostname: 'home.nest.com',
      path: '/api/0.1/user',
      method: 'GET',
      headers: {
        'Cookie': cookies,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://home.nest.com/'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      // Log the response status code
      console.log(`API Response Status: ${res.statusCode}`);
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            // Try to parse the response as JSON
            const userData = JSON.parse(data);
            if (userData && userData.user_id) {
              console.log(`✅ Authentication successful! User ID: ${userData.user_id}`);
              console.log(`✅ User Email: ${userData.email}`);
              resolve(true);
            } else {
              console.log('⚠️ API response was successful but no user data found');
              resolve(false);
            }
          } catch (error) {
            console.log('⚠️ Error parsing API response:', error.message);
            resolve(false);
          }
        } else {
          console.log(`⚠️ API response error: ${res.statusCode}`);
          console.log('Response data:', data);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('⚠️ API request error:', error.message);
      resolve(false);
    });
    
    req.end();
  });
}

async function collectNestAuth() {
  // Collected data holders
  let issueToken = null;
  let cookies = null;
  // Keep track of oauth2/iframe requests for reference
  let oauthIframeRequests = [];
  
  console.log('Launching browser to collect Nest authentication tokens...');
  console.log('\nFINAL IMPROVED AUTHENTICATION FLOW:');
  console.log('1. We\'ll open a browser window and navigate to home.nest.com');
  console.log('2. The page will load WITHOUT monitoring network traffic yet');
  console.log('3. You\'ll be prompted to enable Third-party cookies and click Sign in');
  console.log('4. ONLY THEN will we start monitoring network requests');
  console.log('5. We\'ll specifically capture the iframerpc request with action=issueToken');
  console.log('6. We\'ll collect cookies DIRECTLY from the browser after login');
  console.log('7. We\'ll validate the tokens with a test API call');
  
  // Create a clean browser session
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    hasTouch: false,
    acceptDownloads: true,
  });
  
  const page = await context.newPage();
  
  try {
    // First, navigate to Nest login page WITHOUT intercepting network requests
    console.log('\nNavigating to Nest login page...');
    await page.goto('https://home.nest.com/');
    
    console.log('\nIMPORTANT INSTRUCTIONS:');
    console.log('1. Click the "eye" icon in the address bar');
    console.log('2. Enable "Third-party cookies" if it is blocked');
    
    // Wait for user to confirm they're ready to start the sign-in process
    await askQuestion('\nNow click "Sign in with Google" but DON\'T sign in yet. Press Enter when ready to start monitoring...');
    
    console.log('\n🔍 Starting network monitoring. Complete the Google sign-in now...');
    
    // NOW start monitoring network requests - but only after the page is loaded and user is ready
    await context.route('**', async (route, request) => {
      try {
        const url = request.url();
        const headers = request.headers();
        
        // Method 1: Capture issueToken ONLY from iframerpc request with action=issueToken
        if (url.includes('iframerpc') && url.includes('action=issueToken') && !issueToken) {
          console.log('\n✅ Found iframerpc request with action=issueToken!');
          console.log(`URL: ${url}`);
          
          // Store the issueToken
          issueToken = url;
          console.log('✅ issueToken collected!');
        }
        
        // For reference only: log oauth2/iframe requests 
        if (url.includes('oauth2/iframe')) {
          if (headers['cookie']) {
            const requestIndex = oauthIframeRequests.length + 1;
            
            // Store this request
            oauthIframeRequests.push({
              index: requestIndex,
              url: url,
              cookies: headers['cookie'],
              timestamp: new Date().toISOString()
            });
            
            // Log information about this iframe request
            console.log(`\n👀 [IFRAME REQUEST #${requestIndex}] - For reference only`);
            console.log(`URL: ${url}`);
          }
        }
        
        // Continue with the request
        await route.continue();
        
      } catch (error) {
        console.error('Error processing request:', error);
        await route.continue();
      }
    });
    
    console.log('\nComplete the Google sign-in process now and wait for the Nest home page to load...');
    
    // Wait for user confirmation when they've completed login
    await askQuestion('\nPress Enter when you have successfully logged in and are on the Nest home page...');
    
    // Log what we've found so far
    console.log('\n=== AUTHENTICATION DATA COLLECTION RESULTS ===');
    
    if (issueToken) {
      console.log('✅ issueToken captured successfully');
      console.log(`issueToken: ${issueToken}`);
    } else {
      console.log('❌ issueToken not found');
    }
    
    // IMPORTANT: Collect cookies directly from the browser context
    console.log('\n🔍 Collecting cookies directly from browser...');
    
    // Get ALL Google cookies from the browser context
    const allCookies = await context.cookies();
    const googleCookies = allCookies
      .filter(c => c.domain.includes('.google.com'))
      .sort((a, b) => a.name.localeCompare(b.name));  // Sort alphabetically
    
    if (googleCookies.length > 0) {
      console.log(`\n✅ Found ${googleCookies.length} Google cookies in browser context`);
      
      // Check for critical cookies
      const hasSIDCC = googleCookies.some(c => c.name.includes('SIDCC'));
      const hasSecure1PSIDCC = googleCookies.some(c => c.name.includes('__Secure-1PSIDCC'));
      const hasSecure3PSIDCC = googleCookies.some(c => c.name.includes('__Secure-3PSIDCC'));
      
      console.log(`Contains SIDCC: ${hasSIDCC ? 'Yes' : 'No'}`);
      console.log(`Contains __Secure-1PSIDCC: ${hasSecure1PSIDCC ? 'Yes' : 'No'}`);
      console.log(`Contains __Secure-3PSIDCC: ${hasSecure3PSIDCC ? 'Yes' : 'No'}`);
      
      // Print the critical cookies for verification
      console.log("\nCritical Cookies:\n------------------");
      for (const cookie of googleCookies) {
        if (cookie.name === 'SIDCC' || 
            cookie.name === '__Secure-1PSIDCC' || 
            cookie.name === '__Secure-3PSIDCC' ||
            cookie.name === 'SID' ||
            cookie.name === 'HSID' ||
            cookie.name === 'SSID' ||
            cookie.name === 'APISID' ||
            cookie.name === 'SAPISID') {
          console.log(`${cookie.name}=${cookie.value}`);
        }
      }
      
      // Format all google cookies as a single string
      cookies = googleCookies.map(c => `${c.name}=${c.value}`).join('; ');
      
      console.log(`\nCookie string length: ${cookies.length} characters`);
      console.log(`First 50 chars: ${cookies.substring(0, 50)}...`);
    } else {
      console.log('❌ No Google cookies found in browser context');
    }
    
    // If we have both tokens, save them and validate
    if (issueToken && cookies) {
      // Write to config file
      await writeConfigFile(issueToken, cookies);
      console.log('\n✅ Authentication data saved to config.json');
      
      // Validate the tokens with a test API call
      const isValid = await validateTokens(cookies);
      
      if (isValid) {
        console.log('\n✅ Tokens validated successfully! Your authentication is working properly.');
      } else {
        console.log('\n⚠️ Token validation failed. The tokens may not work with the Nest API.');
        console.log('You may need to try running the script again or collecting tokens manually.');
      }
    } else {
      console.log('\n⚠️ Warning: Could not collect all required authentication data:');
      console.log(`- issueToken: ${issueToken ? 'Collected' : 'Missing'}`);
      console.log(`- cookies: ${cookies ? 'Collected' : 'Missing'}`);
    }
  } catch (error) {
    console.error('Error during authentication collection:', error);
  } finally {
    // Close the readline interface and browser
    rl.close();
    await browser.close();
    
    console.log('\nBrowser closed.');
    
    // Final status check
    if (issueToken && cookies) {
      console.log('✅ Authentication data collected and saved to config.json');
      return { issueToken, cookies };
    } else {
      console.log('\n⚠️ Authentication data collection incomplete.');
      throw new Error('Authentication data collection incomplete');
    }
  }
}

// If this script is run directly
if (require.main === module) {
  collectNestAuth()
    .catch(console.error)
    .finally(() => process.exit(0));
}

module.exports = { collectNestAuth, validateTokens };