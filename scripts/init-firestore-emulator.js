#!/usr/bin/env node

/**
 * Initialize Firestore Emulator with seed data
 * Run this script while the Firebase emulators are running
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK with emulator settings
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

const app = initializeApp({
  projectId: 'real-migraines',
});

const db = getFirestore(app);

async function clearCollections() {
  console.log('Clearing existing collections...');
  
  // Clear users collection
  const usersSnapshot = await db.collection('users').get();
  const userDeletes = [];
  usersSnapshot.forEach(doc => {
    userDeletes.push(doc.ref.delete());
  });
  await Promise.all(userDeletes);
  
  // Clear migraines collection
  const migrainesSnapshot = await db.collection('migraines').get();
  const migraineDeletes = [];
  migrainesSnapshot.forEach(doc => {
    migraineDeletes.push(doc.ref.delete());
  });
  await Promise.all(migraineDeletes);
  
  console.log('Collections cleared.');
}

async function createSeedData() {
  console.log('Creating seed data...');
  
  // Create a test user
  const userId = 'test-user-123';
  const userRef = db.collection('users').doc(userId);
  
  await userRef.set({
    email: 'test@example.com',
    displayName: 'Test User',
    preferences: {
      theme: 'dark',
      notifications: false
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  });
  
  console.log('Created test user:', userId);
  
  // Create sample migraine entries
  const now = new Date();
  const migraineData = [
    {
      userId,
      startDateTime: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)), // 2 days ago
      endDateTime: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000)), // 4 hours later
      duration: 240, // 4 hours in minutes
      intensity: 7,
      location: 'Right temple',
      symptoms: ['Nausea', 'Light sensitivity', 'Sound sensitivity'],
      triggers: ['Stress', 'Lack of sleep'],
      notes: 'Started after a stressful meeting at work',
      createdAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000))
    },
    {
      userId,
      startDateTime: Timestamp.fromDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)), // 5 days ago
      endDateTime: Timestamp.fromDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000 + 6 * 60 * 60 * 1000)), // 6 hours later
      duration: 360, // 6 hours in minutes
      intensity: 8,
      location: 'Behind both eyes',
      symptoms: ['Nausea', 'Vomiting', 'Light sensitivity', 'Visual aura'],
      triggers: ['Bright lights', 'Dehydration'],
      notes: 'Saw flashing lights before the pain started',
      createdAt: Timestamp.fromDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000))
    },
    {
      userId,
      startDateTime: Timestamp.fromDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
      endDateTime: Timestamp.fromDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)), // 2 hours later
      duration: 120, // 2 hours in minutes
      intensity: 5,
      location: 'Forehead',
      symptoms: ['Light sensitivity'],
      triggers: ['Weather change'],
      notes: 'Mild headache, possibly related to storm front',
      createdAt: Timestamp.fromDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000))
    }
  ];
  
  // Add migraine entries
  for (const migraine of migraineData) {
    const docRef = await db.collection('migraines').add(migraine);
    console.log('Created migraine entry:', docRef.id);
  }
  
  console.log('Seed data created successfully!');
}

async function main() {
  try {
    await clearCollections();
    await createSeedData();
    
    console.log('\nFirestore emulator initialized successfully!');
    console.log('You can view the data at: http://localhost:4000/firestore');
    console.log('\nTest user credentials:');
    console.log('Email: test@example.com');
    console.log('Password: (you need to create this user in Auth emulator)');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing Firestore emulator:', error);
    process.exit(1);
  }
}

main();