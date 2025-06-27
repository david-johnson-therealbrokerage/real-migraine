const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureMilestone() {
    // Set headless: false to see what's happening during debugging
    const browser = await puppeteer.launch({
        headless: process.env.DEBUG ? false : 'new',
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
            console.log('2. Handling authentication...');
            
            // Check if this is a new user (confirm PIN field exists)
            const confirmInput = await page.$('input[placeholder="Confirm PIN"]');
            
            if (confirmInput) {
                console.log('   Creating new PIN...');
                // New user - create PIN
                await page.type('input[type="password"]', '1234');
                await confirmInput.type('1234');
            } else {
                console.log('   Entering existing PIN...');
                // Existing user - just enter PIN
                await page.type('input[type="password"]', '1234');
            }
            
            // Submit
            await page.click('button[type="submit"]');
            await page.waitForSelector('.app-nav', { timeout: 5000 });
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
    try {
        // Type slowly to ensure proper input
        const typeOptions = { delay: 100 };
        
        // Clear and set start date
        await page.evaluate(() => {
            document.querySelector('input[type="date"]').value = '';
        });
        await page.type('input[type="date"]', data.startDate, typeOptions);
        await new Promise(resolve => setTimeout(resolve, 200));
    
        // Set start time
        await page.evaluate(() => {
            document.querySelector('input[type="time"]').value = '';
        });
        await page.type('input[type="time"]', data.startTime, typeOptions);
        await new Promise(resolve => setTimeout(resolve, 200));
    
        // Set end date/time if provided
        if (data.endDate) {
            const endDateInputs = await page.$$('input[type="date"]');
            await page.evaluate((el) => el.value = '', endDateInputs[1]);
            await endDateInputs[1].click(); // Focus the input first
            await new Promise(resolve => setTimeout(resolve, 100));
            await endDateInputs[1].type(data.endDate, typeOptions);
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const endTimeInputs = await page.$$('input[type="time"]');
            await page.evaluate((el) => el.value = '', endTimeInputs[1]);
            await endTimeInputs[1].click(); // Focus the input first
            await new Promise(resolve => setTimeout(resolve, 100));
            await endTimeInputs[1].type(data.endTime, typeOptions);
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    
    // Set intensity
    await page.evaluate((intensity) => {
        document.querySelector('input[type="range"]').value = intensity;
        document.querySelector('input[type="range"]').dispatchEvent(new Event('change', { bubbles: true }));
    }, data.intensity);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Set location
    await page.select('select', data.location);
    await new Promise(resolve => setTimeout(resolve, 200));
    
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
    await page.type('textarea', data.notes, typeOptions);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Submit form
    console.log('   Submitting entry...');
    await page.click('button[type="submit"]');
    // Wait for navigation to history page (client-side routing)
    await page.waitForSelector('.history-page', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    } catch (error) {
        console.error('Error creating migraine entry:', error);
        throw error;
    }
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