const { chromium } = require('playwright');
(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('ERROR:', err.message));
    
    await page.goto('http://localhost:8080/dashboard.html');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('URL after 2 seconds:', page.url());
    
    await browser.close();
})();
