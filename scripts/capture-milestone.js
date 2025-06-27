const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Helper function to prompt user
function promptUser(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function captureScreenshots() {
    console.log('🚀 Starting Milestone 3 screenshot capture...\n');
    
    // Create milestone-3 directory if it doesn't exist
    const screenshotDir = path.join(__dirname, '../docs/milestone-3');
    if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
        console.log('📁 Created directory: docs/milestone-3/\n');
    }
    
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
        const needsLogin = await page.$('input[type="password"], .firebase-login, .login-container');
        if (needsLogin) {
            console.log('🔐 Login required.');
            console.log('👉 Please complete the login process in the browser window.\n');
            
            // Wait for user to confirm they've completed login
            await promptUser('Press Enter when you have completed the login process...');
            
            console.log('\n✅ Thank you! Proceeding with screenshots...\n');
            
            // Give the app a moment to stabilize after login
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Helper function to capture a screenshot
        async function captureScreen(name, description) {
            console.log(`📸 Capturing ${description}...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            await page.screenshot({ 
                path: path.join(screenshotDir, `${name}.png`),
                fullPage: true 
            });
        }
        
        // Navigate to dashboard first
        await page.goto('http://localhost:1234/', { waitUntil: 'networkidle0' });
        
        // Define the navigation items
        const navItems = [
            { selector: 'a[href="/"]', name: 'dashboard', description: 'Dashboard' },
            { selector: 'a[href="/new"]', name: 'new-entry', description: 'New Entry' },
            { selector: 'a[href="/history"]', name: 'history', description: 'History' },
            { selector: 'a[href="/settings"]', name: 'settings', description: 'Settings' },
            { selector: 'a[href="/profile"]', name: 'profile', description: 'Profile' }
        ];
        
        // Capture screenshot for each navigation item
        for (const item of navItems) {
            try {
                // Check if the navigation item exists
                const navElement = await page.$(item.selector);
                if (navElement) {
                    // Click the navigation item
                    await page.click(item.selector);
                    await page.waitForNavigation({ waitUntil: 'networkidle0' });
                    
                    // Capture screenshot
                    await captureScreen(item.name, item.description);
                } else {
                    console.log(`⚠️  Navigation item not found: ${item.description}`);
                }
            } catch (error) {
                console.log(`⚠️  Error capturing ${item.description}: ${error.message}`);
            }
        }
        
        // Also capture dark mode versions
        console.log('\n🌙 Switching to dark mode...');
        
        // Navigate back to dashboard to find theme toggle
        await page.goto('http://localhost:1234/', { waitUntil: 'networkidle0' });
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Try to find and click the theme toggle
        const themeToggle = await page.$('.theme-toggle');
        if (themeToggle) {
            await themeToggle.click();
            await new Promise(resolve => setTimeout(resolve, 30000));
            
            // Capture dark mode dashboard
            await captureScreen('dashboard-dark', 'Dashboard (Dark Mode)');
            
            // Capture a few key pages in dark mode
            await page.goto('http://localhost:1234/new', { waitUntil: 'networkidle0' });
            await captureScreen('new-entry-dark', 'New Entry (Dark Mode)');
            
            await page.goto('http://localhost:1234/history', { waitUntil: 'networkidle0' });
            await captureScreen('history-dark', 'History (Dark Mode)');
        } else {
            console.log('⚠️  Theme toggle not found');
        }
        
        console.log('\n✅ All screenshots captured successfully!');
        console.log(`📁 Screenshots saved to: docs/milestone-3/`);
        
        // List all captured screenshots
        const files = fs.readdirSync(screenshotDir).filter(f => f.endsWith('.png'));
        files.forEach(file => console.log(`   - ${file}`));
        
    } catch (error) {
        console.error('❌ Error capturing screenshots:', error.message);
        throw error;
    } finally {
        await browser.close();
        rl.close();
    }
}

// Run the capture
captureScreenshots().catch(error => {
    console.error('Failed to capture screenshots:', error);
    rl.close();
    process.exit(1);
});