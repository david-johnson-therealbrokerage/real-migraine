#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔥 Deploying Firestore security rules...\n');

try {
    // Deploy only Firestore rules
    console.log('Deploying Firestore rules...');
    execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    
    console.log('\n✅ Firestore rules deployed successfully!');
    console.log('\nTo deploy indexes, run: firebase deploy --only firestore:indexes');
    console.log('To deploy everything, run: firebase deploy');
} catch (error) {
    console.error('\n❌ Error deploying rules:', error.message);
    process.exit(1);
}