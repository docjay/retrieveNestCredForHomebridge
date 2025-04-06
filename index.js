const { chromium } = require('playwright');

async function run() {
  // Launch the browser
  const browser = await chromium.launch({
    headless: false // Set to true in production
  });
  
  // Create a new browser context
  const context = await browser.newContext();
  
  // Create a new page in the browser context
  const page = await context.newPage();
  
  try {
    // Navigate to a website
    console.log('Navigating to website...');
    await page.goto('https://example.com');
    
    // Wait for the content to load
    await page.waitForSelector('h1');
    
    // Take a screenshot
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'screenshot.png' });
    
    // Get the page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // You can add more automation steps here
    
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    // Close browser
    await browser.close();
    console.log('Browser closed');
  }
}

// Run the automation script
run().catch(console.error);