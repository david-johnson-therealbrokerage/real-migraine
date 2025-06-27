import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFirebaseConfig, isFirebaseEnabled } from '../config/environment';

let app = null;
let auth = null;
let db = null;

if (isFirebaseEnabled()) {
  try {
    const firebaseConfig = getFirebaseConfig();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    
    // Log successful initialization
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    console.warn('The app will continue to work with local storage only.');
  }
}

export { app, auth, db };
export default app;