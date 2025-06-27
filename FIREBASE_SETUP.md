# Firebase Setup Guide

## Overview
This application supports two modes:
- **Local Storage Mode** (default): Data stored locally, PIN authentication
- **Firebase Mode**: Cloud storage with Google/Email authentication

## Enabling Firebase Integration

### 1. Firebase Console Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing "real-migraines" project
3. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable "Email/Password" provider
   - Enable "Google" provider
   - Add your domain to Authorized domains
4. Enable Firestore:
   - Go to Firestore Database
   - Create database in production mode
   - Set up security rules (see below)

### 2. Local Configuration
1. Copy `.env.example` to `.env`
2. Set `REACT_APP_USE_FIREBASE=true`
3. Add your Firebase credentials from Project Settings > General
4. Restart the development server with `npm start`

### 3. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own migraine entries
    match /migraines/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 4. Features When Firebase is Enabled
- **Required Authentication**: Users must sign in with Google or Email/Password
- **Cloud Storage**: All data stored in Firestore
- **Multi-device Sync**: Access your data from any device
- **Data Migration**: Automatic prompt to migrate local data to cloud
- **Secure**: Each user's data is isolated and protected

### 5. Testing with Firebase Emulators
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Start emulators
npm run start:firebase:emulators

# In another terminal, start the app
npm start
```

### 6. Deployment
```bash
# Build the app
npm run build

# Deploy to Firebase Hosting
firebase deploy
```
