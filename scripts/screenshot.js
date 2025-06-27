const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshot(url, outputPath, options = {}) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set viewport size
        await page.setViewport({
            width: options.width || 1280,
            height: options.height || 800,
            deviceScaleFactor: options.deviceScaleFactor || 2
        });
        
        // Navigate to URL
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait a bit for any animations to complete
        if (options.wait) {
            await new Promise(resolve => setTimeout(resolve, options.wait));
        }
        
        // Take screenshot
        await page.screenshot({
            path: outputPath,
            fullPage: options.fullPage || false,
            type: options.type || 'png'
        });
        
        console.log(`Screenshot saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('Error capturing screenshot:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node screenshot.js <url> <output-path> [options]');
    console.log('Options: --width=1280 --height=800 --fullPage --wait=1000');
    process.exit(1);
}

const url = args[0];
const outputPath = args[1];

// Parse options
const options = {};
args.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        if (key === 'fullPage') {
            options.fullPage = true;
        } else if (key === 'width' || key === 'height' || key === 'wait') {
            options[key] = parseInt(value);
        } else if (key === 'deviceScaleFactor') {
            options[key] = parseFloat(value);
        }
    }
});

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Capture screenshot
captureScreenshot(url, outputPath, options)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));