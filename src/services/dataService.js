import authService from './authService';
import firestoreService from './firestoreService';
import storageService from './storage';

class DataService {
  constructor() {
    this.useFirebase = false; // Will be set based on environment or user preference
  }

  setUseFirebase(useFirebase) {
    this.useFirebase = useFirebase;
  }

  // Migraine operations
  async getMigraines() {
    if (this.useFirebase && authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      const result = await firestoreService.getUserMigraines(user.uid);
      if (result.success) {
        return result.data.map(m => firestoreService.convertFromFirestoreFormat(m));
      }
      throw new Error(result.error);
    } else {
      return storageService.getMigraines();
    }
  }

  async addMigraine(migraineData) {
    if (this.useFirebase && authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      const result = await firestoreService.addMigraine(user.uid, migraineData);
      if (result.success) {
        return { ...migraineData, id: result.id };
      }
      throw new Error(result.error);
    } else {
      return storageService.addMigraine(migraineData);
    }
  }

  async updateMigraine(id, updateData) {
    if (this.useFirebase && authService.isAuthenticated()) {
      const result = await firestoreService.updateMigraine(id, updateData);
      if (!result.success) {
        throw new Error(result.error);
      }
      return true;
    } else {
      return storageService.updateMigraine(id, updateData);
    }
  }

  async deleteMigraine(id) {
    if (this.useFirebase && authService.isAuthenticated()) {
      const result = await firestoreService.deleteMigraine(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return true;
    } else {
      return storageService.deleteMigraine(id);
    }
  }

  async getMigraineById(id) {
    if (this.useFirebase && authService.isAuthenticated()) {
      const result = await firestoreService.getMigraine(id);
      if (result.success) {
        return firestoreService.convertFromFirestoreFormat(result.data);
      }
      throw new Error(result.error);
    } else {
      return storageService.getMigraineById(id);
    }
  }

  async getMigrainesByDateRange(startDate, endDate) {
    if (this.useFirebase && authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      const result = await firestoreService.getMigrainesByDateRange(user.uid, startDate, endDate);
      if (result.success) {
        return result.data.map(m => firestoreService.convertFromFirestoreFormat(m));
      }
      throw new Error(result.error);
    } else {
      const allMigraines = await this.getMigraines();
      return allMigraines.filter(m => {
        const migraineDate = new Date(m.startDateTime);
        return migraineDate >= startDate && migraineDate <= endDate;
      });
    }
  }

  // User preferences
  async getUserPreferences() {
    if (this.useFirebase && authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      const result = await firestoreService.getUserPreferences(user.uid);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error);
    } else {
      return storageService.getUserPreferences();
    }
  }

  async updateUserPreferences(preferences) {
    if (this.useFirebase && authService.isAuthenticated()) {
      const user = authService.getCurrentUser();
      const result = await firestoreService.updateUserPreferences(user.uid, preferences);
      if (!result.success) {
        throw new Error(result.error);
      }
      return true;
    } else {
      return storageService.updateUserPreferences(preferences);
    }
  }

  // Export/Import operations
  async exportData() {
    const migraines = await this.getMigraines();
    const preferences = await this.getUserPreferences();
    
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        migraines,
        preferences
      }
    };
  }

  async importData(importedData) {
    if (!importedData || !importedData.data) {
      throw new Error('Invalid import data format');
    }

    const { migraines = [], preferences = {} } = importedData.data;
    
    // Import migraines
    const importResults = {
      migraines: { success: 0, failed: 0 },
      preferences: false
    };

    for (const migraine of migraines) {
      try {
        await this.addMigraine(migraine);
        importResults.migraines.success++;
      } catch (error) {
        importResults.migraines.failed++;
        console.error('Failed to import migraine:', error);
      }
    }

    // Import preferences
    try {
      await this.updateUserPreferences(preferences);
      importResults.preferences = true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
    }

    return importResults;
  }
}

export default new DataService();