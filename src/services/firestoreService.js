import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

class FirestoreService {
  constructor() {
    this.collections = {
      migraines: 'migraines',
      users: 'users'
    };
    this.isAvailable = !!db;
  }

  // Initialize user document if it doesn't exist
  async initializeUserDocument(userId, userData = {}) {
    if (!this.isAvailable || !userId) {
      return { success: false, error: 'Firestore is not available or no user ID provided' };
    }
    
    try {
      const userRef = doc(db, this.collections.users, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          ...userData,
          preferences: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      // Handle specific Firestore errors
      if (error.code === 'permission-denied') {
        console.warn('Permission denied when initializing user document. This is expected if Firestore rules are not deployed.');
        return { success: true }; // Don't block the user
      }
      
      if (error.code === 'unavailable') {
        console.warn('Firestore is unavailable. User document initialization skipped.');
        return { success: true }; // Don't block the user
      }
      
      console.error('Error initializing user document:', error);
      // Return success anyway to not block the user experience
      return { success: true };
    }
  }

  // Migraine entries
  async addMigraine(userId, migraineData) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
    }
    try {
      const docData = {
        ...migraineData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, this.collections.migraines), docData);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error adding migraine:', error);
      return { success: false, error: error.message };
    }
  }

  async updateMigraine(migraineId, updateData) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
    }
    try {
      const migraineRef = doc(db, this.collections.migraines, migraineId);
      await updateDoc(migraineRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating migraine:', error);
      return { success: false, error: error.message };
    }
  }

  async deleteMigraine(migraineId) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
    }
    try {
      await deleteDoc(doc(db, this.collections.migraines, migraineId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting migraine:', error);
      return { success: false, error: error.message };
    }
  }

  async getMigraine(migraineId) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
    }
    try {
      const docSnap = await getDoc(doc(db, this.collections.migraines, migraineId));
      if (docSnap.exists()) {
        return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
      } else {
        return { success: false, error: 'Migraine not found' };
      }
    } catch (error) {
      console.error('Error getting migraine:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserMigraines(userId, limitCount = null) {
    if (!this.isAvailable) {
      return { success: true, data: [] }; // Return empty array when Firestore not available
    }
    try {
      // First try with orderBy (requires index)
      let q = query(
        collection(db, this.collections.migraines),
        where('userId', '==', userId),
        orderBy('startDateTime', 'desc')
      );
      
      if (limitCount) {
        q = query(q, limit(limitCount));
      }
      
      const querySnapshot = await getDocs(q);
      const migraines = [];
      querySnapshot.forEach((doc) => {
        migraines.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: migraines };
    } catch (error) {
      // Check if it's an index error
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.warn('Firestore index not yet created. Trying simple query without ordering.');
        
        try {
          // Fallback to simple query without orderBy
          const simpleQuery = query(
            collection(db, this.collections.migraines),
            where('userId', '==', userId)
          );
          
          const querySnapshot = await getDocs(simpleQuery);
          const migraines = [];
          querySnapshot.forEach((doc) => {
            migraines.push({ id: doc.id, ...doc.data() });
          });
          
          // Sort in memory instead
          migraines.sort((a, b) => {
            const dateA = new Date(a.startDateTime);
            const dateB = new Date(b.startDateTime);
            return dateB - dateA; // Descending order
          });
          
          // Apply limit if specified
          if (limitCount && migraines.length > limitCount) {
            migraines.length = limitCount;
          }
          
          return { success: true, data: migraines };
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          return { success: true, data: [] };
        }
      }
      
      // Check if Firestore is not initialized
      if (error.code === 'unavailable' || error.code === 'permission-denied') {
        console.warn('Firestore unavailable or permission denied. Returning empty data.');
        return { success: true, data: [] };
      }
      
      console.error('Error getting user migraines:', error);
      return { success: true, data: [] }; // Return empty data instead of error to prevent app crashes
    }
  }

  async getMigrainesByDateRange(userId, startDate, endDate) {
    if (!this.isAvailable) {
      return { success: true, data: [] }; // Return empty array when Firestore not available
    }
    try {
      const q = query(
        collection(db, this.collections.migraines),
        where('userId', '==', userId),
        where('startDateTime', '>=', Timestamp.fromDate(startDate)),
        where('startDateTime', '<=', Timestamp.fromDate(endDate)),
        orderBy('startDateTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const migraines = [];
      querySnapshot.forEach((doc) => {
        migraines.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: migraines };
    } catch (error) {
      // Check if it's an index error
      if (error.code === 'failed-precondition' && error.message.includes('index')) {
        console.warn('Firestore index not yet created for date range query. Returning empty data.');
        return { success: true, data: [] };
      }
      
      console.error('Error getting migraines by date range:', error);
      return { success: true, data: [] }; // Return empty data instead of error
    }
  }

  // User preferences
  async getUserPreferences(userId) {
    if (!this.isAvailable) {
      return { success: true, data: {} }; // Return empty preferences when Firestore not available
    }
    try {
      const docSnap = await getDoc(doc(db, this.collections.users, userId));
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data().preferences || {} };
      } else {
        return { success: true, data: {} };
      }
    } catch (error) {
      // Handle permission errors gracefully
      if (error.code === 'permission-denied' || error.code === 'unavailable') {
        console.warn('Cannot access user preferences. Using defaults.');
        return { success: true, data: {} };
      }
      
      console.error('Error getting user preferences:', error);
      return { success: true, data: {} }; // Return empty data instead of error
    }
  }

  async updateUserPreferences(userId, preferences) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
    }
    try {
      const userRef = doc(db, this.collections.users, userId);
      
      // Check if user document exists first
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        // Create the user document if it doesn't exist
        await setDoc(userRef, {
          preferences,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Update existing document
        await updateDoc(userRef, {
          preferences,
          updatedAt: serverTimestamp()
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Convert local storage data to Firestore format
  convertToFirestoreFormat(localData) {
    return {
      ...localData,
      startDateTime: localData.startDateTime ? Timestamp.fromDate(new Date(localData.startDateTime)) : null,
      endDateTime: localData.endDateTime ? Timestamp.fromDate(new Date(localData.endDateTime)) : null,
      createdAt: localData.createdAt ? Timestamp.fromDate(new Date(localData.createdAt)) : serverTimestamp(),
      updatedAt: localData.updatedAt ? Timestamp.fromDate(new Date(localData.updatedAt)) : serverTimestamp()
    };
  }

  // Convert Firestore data to app format
  convertFromFirestoreFormat(firestoreData) {
    // Helper function to convert timestamps
    const convertTimestamp = (timestamp) => {
      if (!timestamp) return null;
      
      // If it's already a Date object, return it
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // If it's a Firestore Timestamp, convert it
      if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
      }
      
      // If it's a string, parse it
      if (typeof timestamp === 'string') {
        return new Date(timestamp);
      }
      
      // If it's a plain object with seconds (Firestore timestamp from JSON)
      if (timestamp && timestamp.seconds) {
        return new Date(timestamp.seconds * 1000);
      }
      
      return timestamp;
    };
    
    return {
      ...firestoreData,
      startDateTime: convertTimestamp(firestoreData.startDateTime),
      endDateTime: convertTimestamp(firestoreData.endDateTime),
      createdAt: convertTimestamp(firestoreData.createdAt),
      updatedAt: convertTimestamp(firestoreData.updatedAt)
    };
  }
}

export default new FirestoreService();