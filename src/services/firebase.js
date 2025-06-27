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
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

export { app, auth, db };
export default app;