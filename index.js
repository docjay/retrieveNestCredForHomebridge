const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Variables to store captured data
let capturedIssueToken = null;
let capturedCookies = null;

// File path to save the captured data
const outputFilePath = path.join(__dirname, 'nest_credentials.txt');

// Function to write data to file
function writeDataToFile(issueToken, cookies) {
  const timestamp = new Date().toLocaleString();
  const fileContent = `[Nest Credentials - Generated on ${timestamp}]
===================================================
ISSUE TOKEN:
${issueToken}

COOKIES:
${cookies}
===================================================`;

  fs.writeFileSync(outputFilePath, fileContent);
  console.log(`Data saved to: ${outputFilePath}`);
  
  // Open the file automatically using the default text editor
  exec(`open "${outputFilePath}"`, (error) => {
    if (error) {
      console.error(`Error opening the file: ${error.message}`);
    } else {
      console.log(`Opened ${outputFilePath} in your default text editor.`);
      
      // Delete the file after a short delay
      // This gives the text editor enough time to fully load the content
      setTimeout(() => {
        fs.unlink(outputFilePath, (err) => {
          if (err) {
            console.error(`Error deleting file: ${err.message}`);
          } else {
            console.log(`Successfully deleted: ${outputFilePath}`);
          }
        });
      }, 1500); // Delete after 1.5 seconds
    }
  });
}

/**
 * Function to start capturing filtered network logs
 * Only logs requests containing "issuetoken" or "oauth2/iframe" in the URL
 * Stores the issuetoken URL when detected
 */
function startNetworkLogging(page, context) {
  console.log('Started capturing filtered network logs...');
  
  // Listen for filtered requests
  page.on('request', async request => {
    const url = request.url();
    
    // Process URLs containing the specified keywords
    if (url.includes('issuetoken') || url.includes('oauth2/iframe')) {
      const headers = request.headers();
      
      console.log(`\n--- Filtered Request Detected ---`);
      console.log(`URL: ${url}`);
      
      // For oauth2/iframe, get all cookies for the domain
      if (url.includes('oauth2/iframe')) {
        try {
          // Extract domain from URL
          const urlObj = new URL(url);
          const domain = urlObj.hostname;
          
          // Get all cookies for this domain
          const cookies = await context.cookies(url);
          
          // Format cookies in the requested format: name=value; name=value
          if (cookies && cookies.length > 0) {
            const formattedCookies = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
            // Store the formatted cookies in the global variable
            capturedCookies = formattedCookies;
            console.log(`Cookies have been stored in memory and will be saved when the script exits.`);
          }
        } catch (error) {
          console.error(`Error getting cookies:`, error);
        }
      }
      
      // Store the issuetoken URL when detected
      if (url.includes('issueToken')) {
        capturedIssueToken = url;
        console.log(`\n!!! issueToken URL was captured !!!`);
      }
      
      console.log(`-------------------------------`);
    }
  });
  
  return () => {
    // Return a function that can be used to stop logging if needed
    page.removeListener('request', () => {});
    console.log('Network logging stopped');
    
    // Report on captured data
    if (capturedIssueToken) {
      console.log(`\nFinal report - issueToken URL was captured:`);
      console.log(capturedIssueToken);
    } else {
      console.log(`\nNo issueToken URL was captured during this session.`);
    }
    
    // Report on captured cookies
    if (capturedCookies) {
      console.log(`\nFinal report - oauth2/iframe cookies were captured:`);
      console.log(capturedCookies);
    } else {
      console.log(`\nNo oauth2/iframe cookies were captured during this session.`);
    }
  };
}

async function run() {
  // Launch the browser with specific arguments to avoid detection
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50, // Add delay between actions to appear more human-like
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ]
  });
  
  // Create a new browser context with specific settings to appear more like a real browser
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    hasTouch: false,
    acceptDownloads: true,
    javaScriptEnabled: true,
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    bypassCSP: true
  });
  
  // Hide WebDriver to avoid detection
  await context.addInitScript(() => {
    // Override navigator.webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });
    
    // Override chrome property
    window.chrome = {
      runtime: {},
      app: {
        InstallState: 'hehe',
        RunningState: 'running',
        getDetails: function() {},
        getIsInstalled: function() {},
        installState: function() { 
          return 'installed';
        }
      }
    };
    
    // Override permissions API
    const originalQuery = window.navigator.permissions?.query;
    if (originalQuery) {
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' 
          ? Promise.resolve({ state: Notification.permission }) 
          : originalQuery(parameters)
      );
    }
    
    // Add language plugins to appear more like a regular browser
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en', 'es'],
    });
    
    // Add plugins array to avoid detection
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
  });
  
  // Create a new page in the browser context
  const page = await context.newPage();
  
  try {
    // Navigate to Nest home website with more realistic loading behavior
    console.log('Navigating to home.nest.com...');
    
    // Use a more authentic loading approach
    await page.goto('https://home.nest.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 // Longer timeout for complete page load
    });
    
    // Wait for the page to load with a longer timeout
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Log once loading completes
    console.log('Page loaded successfully: home.nest.com');
    
    // Start capturing network logs after page loads
    const stopLogging = startNetworkLogging(page, context);
    
    console.log('Browser will remain open to capture needed data.');
    console.log('NOTE: For Google login, try using manual interaction with the browser window');
    
    // Set up a periodic check for both captured values
    const checkInterval = setInterval(async () => {
      if (capturedCookies && capturedIssueToken) {
        clearInterval(checkInterval);
        
        console.log('\n\n=================================================');
        console.log('CAPTURED DATA COMPLETE! RESULTS:');
        console.log('=================================================');
        console.log('ISSUE TOKEN:');
        console.log(capturedIssueToken);
        console.log('\nCOOKIES:');
        console.log(capturedCookies);
        console.log('=================================================');
        
        // Write the captured data to a file
        writeDataToFile(capturedIssueToken, capturedCookies);
        
        console.log('All data has been captured. Waiting 5 seconds before closing browser...');
        
        // Add a 5-second delay before closing the browser
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        console.log('Closing browser now.');
        await browser.close();
      }
    }, 2000); // Check every 2 seconds
    
  } catch (error) {
    console.error('An error occurred:', error);
    await browser.close();
  }
}

// Run the automation script
run().catch(console.error);