const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureMilestone() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const outputDir = path.join(__dirname, '..', 'docs', 'screenshots', 'milestone-2');
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
        const page = await browser.newPage();
        
        // Set viewport
        await page.setViewport({
            width: 1280,
            height: 800,
            deviceScaleFactor: 2
        });
        
        // Navigate to the app
        console.log('1. Navigating to app...');
        await page.goto('http://localhost:1234', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for app to load
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if we need to create a PIN (first time user)
        const isLoginPage = await page.$('.login-page');
        if (isLoginPage) {
            console.log('2. Creating PIN for first-time user...');
            
            // Enter PIN
            await page.type('input[type="password"]', '1234');
            
            // Check if we need to confirm PIN
            const confirmInput = await page.$('input[placeholder="Confirm PIN"]');
            if (confirmInput) {
                await page.type('input[placeholder="Confirm PIN"]', '1234');
            }
            
            // Submit
            await page.click('button[type="submit"]');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Navigate to New Entry page
        console.log('3. Navigating to New Entry page...');
        await page.click('a[href="/new"]');
        await page.waitForSelector('.new-entry-page');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Create Entry 1
        console.log('4. Creating migraine entry 1...');
        await createMigraineEntry(page, {
            startDate: getDateString(-2),
            startTime: '14:30',
            endDate: getDateString(-2),
            endTime: '18:45',
            intensity: 7,
            location: 'Left Side',
            symptoms: ['Nausea', 'Light Sensitivity', 'Neck Pain'],
            triggers: ['Stress', 'Lack of Sleep'],
            notes: 'Severe migraine after project deadline. Had to leave work early.'
        });
        
        // Create Entry 2
        console.log('5. Creating migraine entry 2...');
        await page.click('a[href="/new"]');
        await page.waitForSelector('.new-entry-page');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await createMigraineEntry(page, {
            startDate: getDateString(-5),
            startTime: '09:00',
            endDate: getDateString(-5),
            endTime: '11:30',
            intensity: 5,
            location: 'Both Sides',
            symptoms: ['Light Sensitivity', 'Sound Sensitivity'],
            triggers: ['Weather', 'Dehydration'],
            notes: 'Barometric pressure drop. Moderate pain but manageable with medication.'
        });
        
        // Create Entry 3
        console.log('6. Creating migraine entry 3...');
        await page.click('a[href="/new"]');
        await page.waitForSelector('.new-entry-page');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await createMigraineEntry(page, {
            startDate: getDateString(-8),
            startTime: '20:00',
            endDate: getDateString(-7),
            endTime: '02:00',
            intensity: 9,
            location: 'Right Side',
            symptoms: ['Nausea', 'Light Sensitivity', 'Sound Sensitivity', 'Aura', 'Dizziness'],
            triggers: ['Food', 'Hormones', 'Stress'],
            notes: 'Worst migraine this month. Started with visual aura. Vomiting occurred.'
        });
        
        // Screenshot New Entry page (empty form)
        console.log('7. Capturing New Entry page...');
        await page.click('a[href="/new"]');
        await page.waitForSelector('.new-entry-page');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
            path: path.join(outputDir, 'new-entry-form.png'),
            fullPage: false
        });
        
        // Navigate to History
        console.log('8. Navigating to History page...');
        await page.click('a[href="/history"]');
        await page.waitForSelector('.history-page');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Screenshot History page
        await page.screenshot({
            path: path.join(outputDir, 'history-with-entries.png'),
            fullPage: false
        });
        
        // Navigate to Dashboard
        console.log('9. Navigating to Dashboard...');
        await page.click('a[href="/"]');
        await page.waitForSelector('.dashboard-page');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Screenshot Dashboard
        await page.screenshot({
            path: path.join(outputDir, 'dashboard-with-stats.png'),
            fullPage: false
        });
        
        // Capture dark mode versions
        console.log('10. Capturing dark mode versions...');
        
        // Toggle dark mode
        await page.click('.theme-toggle');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Dashboard dark
        await page.screenshot({
            path: path.join(outputDir, 'dashboard-dark-mode.png'),
            fullPage: false
        });
        
        // History dark
        await page.click('a[href="/history"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
            path: path.join(outputDir, 'history-dark-mode.png'),
            fullPage: false
        });
        
        // Mobile view
        console.log('11. Capturing mobile view...');
        await page.setViewport({
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
            isMobile: true
        });
        
        await page.click('a[href="/"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await page.screenshot({
            path: path.join(outputDir, 'dashboard-mobile.png'),
            fullPage: false
        });
        
        console.log('✅ All screenshots captured successfully!');
        console.log(`📁 Screenshots saved to: ${outputDir}`);
        
    } catch (error) {
        console.error('Error capturing milestone:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function createMigraineEntry(page, data) {
    // Clear and set dates
    await page.evaluate(() => {
        document.querySelector('input[type="date"]').value = '';
    });
    await page.type('input[type="date"]', data.startDate);
    
    await page.evaluate(() => {
        document.querySelector('input[type="time"]').value = '';
    });
    await page.type('input[type="time"]', data.startTime);
    
    // Set end date/time if provided
    if (data.endDate) {
        const endDateInputs = await page.$$('input[type="date"]');
        await page.evaluate((el) => el.value = '', endDateInputs[1]);
        await endDateInputs[1].type(data.endDate);
        
        const endTimeInputs = await page.$$('input[type="time"]');
        await page.evaluate((el) => el.value = '', endTimeInputs[1]);
        await endTimeInputs[1].type(data.endTime);
    }
    
    // Set intensity
    await page.evaluate((intensity) => {
        document.querySelector('input[type="range"]').value = intensity;
        document.querySelector('input[type="range"]').dispatchEvent(new Event('change', { bubbles: true }));
    }, data.intensity);
    
    // Set location
    await page.select('select', data.location);
    
    // Set symptoms
    for (const symptom of data.symptoms) {
        await page.evaluate((symptomText) => {
            const labels = Array.from(document.querySelectorAll('.checkbox-label'));
            const label = labels.find(l => l.textContent.includes(symptomText));
            if (label) {
                const checkbox = label.querySelector('input[type="checkbox"]');
                if (!checkbox.checked) {
                    checkbox.click();
                }
            }
        }, symptom);
    }
    
    // Set triggers
    for (const trigger of data.triggers) {
        await page.evaluate((triggerText) => {
            const labels = Array.from(document.querySelectorAll('.checkbox-label'));
            const label = labels.find(l => l.textContent.includes(triggerText));
            if (label) {
                const checkbox = label.querySelector('input[type="checkbox"]');
                if (!checkbox.checked) {
                    checkbox.click();
                }
            }
        }, trigger);
    }
    
    // Add notes
    await page.type('textarea', data.notes);
    
    // Submit form
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await new Promise(resolve => setTimeout(resolve, 1000));
}

function getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() + daysAgo);
    return date.toISOString().split('T')[0];
}

// Run the capture
captureMilestone()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));