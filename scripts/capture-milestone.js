const puppeteer = require('puppeteer');
const path = require('path');

async function captureScreenshots() {
    console.log('🚀 Starting screenshot capture...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1280, height: 800 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Navigate to the app
        console.log('📱 Opening application...');
        await page.goto('http://localhost:1234', { 
            waitUntil: 'networkidle0',
            timeout: 30000 
        });
        
        // Wait for app to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we need to login first
        const needsLogin = await page.$('input[type="password"]');
        if (needsLogin) {
            console.log('🔐 Logging in...');
            await page.type('input[type="password"]', '1234');
            await page.click('button[type="submit"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Screenshot 1: Dashboard
        console.log('📸 Capturing Dashboard...');
        await page.goto('http://localhost:1234/', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ 
            path: path.join(__dirname, '../docs/screenshots/milestone-dashboard.png'),
            fullPage: true 
        });
        
        // Screenshot 2: New Entry
        console.log('📸 Capturing New Entry page...');
        await page.goto('http://localhost:1234/new', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ 
            path: path.join(__dirname, '../docs/screenshots/milestone-new-entry.png'),
            fullPage: true 
        });
        
        // Screenshot 3: History
        console.log('📸 Capturing History page...');
        await page.goto('http://localhost:1234/history', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({ 
            path: path.join(__dirname, '../docs/screenshots/milestone-history.png'),
            fullPage: true 
        });
        
        console.log('\n✅ All screenshots captured successfully!');
        console.log('📁 Screenshots saved to: docs/screenshots/');
        console.log('   - milestone-dashboard.png');
        console.log('   - milestone-new-entry.png');
        console.log('   - milestone-history.png');
        
    } catch (error) {
        console.error('❌ Error capturing screenshots:', error.message);
        throw error;
    } finally {
        await browser.close();
    }
}

// Run the capture
captureScreenshots().catch(error => {
    console.error('Failed to capture screenshots:', error);
    process.exit(1);
});