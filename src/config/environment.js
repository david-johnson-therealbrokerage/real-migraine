const ENV = {
  // Feature flags
  USE_FIREBASE: process.env.REACT_APP_USE_FIREBASE === 'true' || false,
  
  // Firebase configuration
  FIREBASE_CONFIG: {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: "real-migraines.firebaseapp.com",
    projectId: "real-migraines",
    storageBucket: "real-migraines.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  },
  
  // App configuration
  APP_VERSION: process.env.REACT_APP_VERSION || '2.0.0',
  
  // Development/Production
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production'
};

export const isFirebaseEnabled = () => {
  return ENV.USE_FIREBASE && 
         ENV.FIREBASE_CONFIG.apiKey && 
         ENV.FIREBASE_CONFIG.messagingSenderId && 
         ENV.FIREBASE_CONFIG.appId;
};

export const getFirebaseConfig = () => {
  if (!isFirebaseEnabled()) {
    throw new Error('Firebase is not properly configured. Please check your environment variables.');
  }
  return ENV.FIREBASE_CONFIG;
};

export default ENV;