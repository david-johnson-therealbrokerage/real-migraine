import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs,
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
      return { success: false, error: 'Firestore is not available' };
    }
    try {
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
      console.error('Error getting user migraines:', error);
      return { success: false, error: error.message };
    }
  }

  async getMigrainesByDateRange(userId, startDate, endDate) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
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
      console.error('Error getting migraines by date range:', error);
      return { success: false, error: error.message };
    }
  }

  // User preferences
  async getUserPreferences(userId) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
    }
    try {
      const docSnap = await getDoc(doc(db, this.collections.users, userId));
      if (docSnap.exists()) {
        return { success: true, data: docSnap.data().preferences || {} };
      } else {
        return { success: true, data: {} };
      }
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  async updateUserPreferences(userId, preferences) {
    if (!this.isAvailable) {
      return { success: false, error: 'Firestore is not available' };
    }
    try {
      const userRef = doc(db, this.collections.users, userId);
      await updateDoc(userRef, {
        preferences,
        updatedAt: serverTimestamp()
      });
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
    return {
      ...firestoreData,
      startDateTime: firestoreData.startDateTime?.toDate(),
      endDateTime: firestoreData.endDateTime?.toDate(),
      createdAt: firestoreData.createdAt?.toDate(),
      updatedAt: firestoreData.updatedAt?.toDate()
    };
  }
}

export default new FirestoreService();