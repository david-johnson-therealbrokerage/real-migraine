import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from './firebase';
import firestoreService from './firestoreService';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    this.googleProvider = auth ? new GoogleAuthProvider() : null;
    
    // Only set up auth listener if Firebase is initialized
    if (auth) {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        
        // Initialize user document in Firestore if user just signed in and Firestore is available
        if (user && firestoreService.isAvailable) {
          try {
            await firestoreService.initializeUserDocument(user.uid, {
              email: user.email,
              displayName: user.displayName || ''
            });
          } catch (error) {
            // Don't let initialization errors block the auth flow
            console.warn('Could not initialize user document:', error);
          }
        }
        
        this.notifyListeners(user);
      });
    }
  }

  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(listener => listener !== callback);
    };
  }

  notifyListeners(user) {
    this.authStateListeners.forEach(listener => listener(user));
  }

  async signUp(email, password, displayName) {
    if (!auth) {
      return { success: false, error: 'Firebase authentication is not available' };
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email, password) {
    if (!auth) {
      return { success: false, error: 'Firebase authentication is not available' };
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signInWithGoogle() {
    if (!auth || !this.googleProvider) {
      return { success: false, error: 'Google authentication is not available' };
    }
    try {
      const result = await signInWithPopup(auth, this.googleProvider);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    if (!auth) {
      return { success: false, error: 'Firebase authentication is not available' };
    }
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email) {
    if (!auth) {
      return { success: false, error: 'Firebase authentication is not available' };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return auth ? !!this.currentUser : false;
  }
}

export default new AuthService();