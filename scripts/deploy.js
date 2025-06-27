const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🚀 Starting deployment process...\n');

// Step 1: Build the project
console.log('📦 Building project with Parcel...');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!\n');
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Step 2: Show what will be deployed
console.log('📋 The following will be deployed to Firebase Hosting:');
console.log('   - Built files from the dist/ directory');
console.log('   - Firebase configuration from firebase.json\n');

// Step 3: Ask for confirmation
rl.question('🤔 Do you want to proceed with deployment? (yes/no): ', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('\n🚀 Deploying to Firebase Hosting...');
        try {
            execSync('firebase deploy --only hosting', { stdio: 'inherit' });
            console.log('\n✅ Deployment completed successfully!');
            console.log('🌐 Your app is now live on Firebase Hosting!');
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            process.exit(1);
        }
    } else {
        console.log('\n❌ Deployment cancelled.');
    }
    
    rl.close();
});