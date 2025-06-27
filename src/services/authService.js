import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
    
    // Only set up auth listener if Firebase is initialized
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        this.currentUser = user;
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