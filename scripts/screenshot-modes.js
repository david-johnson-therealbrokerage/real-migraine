const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshotWithMode(url, outputDir, mode = 'light') {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set viewport size
        await page.setViewport({
            width: 1280,
            height: 800,
            deviceScaleFactor: 2
        });
        
        // Navigate to URL
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // If dark mode requested, click the toggle button
        if (mode === 'dark') {
            await page.click('.theme-toggle');
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait for transition
        }
        
        // Take screenshot
        const filename = `screenshot-${mode}-mode.png`;
        const filepath = path.join(outputDir, filename);
        await page.screenshot({
            path: filepath,
            fullPage: false
        });
        
        console.log(`${mode} mode screenshot saved to: ${filepath}`);
        
    } catch (error) {
        console.error(`Error capturing ${mode} mode screenshot:`, error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function captureAllModes(url, outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Capture both modes
    await captureScreenshotWithMode(url, outputDir, 'light');
    await captureScreenshotWithMode(url, outputDir, 'dark');
    
    // Also capture mobile view
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set mobile viewport
        await page.setViewport({
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            isMobile: true
        });
        
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        const mobilePath = path.join(outputDir, 'screenshot-mobile.png');
        await page.screenshot({
            path: mobilePath,
            fullPage: false
        });
        
        console.log(`Mobile screenshot saved to: ${mobilePath}`);
        
    } finally {
        await browser.close();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const url = args[0] || 'http://localhost:1234';
const outputDir = args[1] || 'docs';

// Capture all screenshots
captureAllModes(url, outputDir)
    .then(() => {
        console.log('All screenshots captured successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Failed to capture screenshots:', error);
        process.exit(1);
    });