import authService from './authService';
import firestoreService from './firestoreService';
import storageService from './storage';

class MigrationService {
  async migrateLocalDataToFirestore() {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get local storage data
      const localMigraines = storageService.getAllEntries() || [];
      const localPreferences = storageService.getPreferences() || {};

      // Track migration results
      const results = {
        migraines: { success: 0, failed: 0, errors: [] },
        preferences: { success: false, error: null }
      };

      // Migrate migraines
      for (const migraine of localMigraines) {
        try {
          const firestoreData = firestoreService.convertToFirestoreFormat(migraine);
          const result = await firestoreService.addMigraine(user.uid, firestoreData);
          
          if (result.success) {
            results.migraines.success++;
          } else {
            results.migraines.failed++;
            results.migraines.errors.push({ migraine, error: result.error });
          }
        } catch (error) {
          results.migraines.failed++;
          results.migraines.errors.push({ migraine, error: error.message });
        }
      }

      // Migrate preferences
      try {
        const prefResult = await firestoreService.updateUserPreferences(user.uid, localPreferences);
        results.preferences.success = prefResult.success;
        if (!prefResult.success) {
          results.preferences.error = prefResult.error;
        }
      } catch (error) {
        results.preferences.error = error.message;
      }

      return {
        success: results.migraines.failed === 0 && results.preferences.success,
        results
      };
    } catch (error) {
      console.error('Migration error:', error);
      return { success: false, error: error.message };
    }
  }

  async checkMigrationStatus() {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        return { migrated: false, reason: 'Not authenticated' };
      }

      // Check if user has any data in Firestore
      const migrainesResult = await firestoreService.getUserMigraines(user.uid, 1);
      const prefsResult = await firestoreService.getUserPreferences(user.uid);

      const hasFirestoreData = (migrainesResult.success && migrainesResult.data.length > 0) ||
                               (prefsResult.success && Object.keys(prefsResult.data).length > 0);

      // Check for local data
      const localMigraines = storageService.getAllEntries() || [];
      const hasLocalData = localMigraines.length > 0;

      return {
        migrated: hasFirestoreData,
        hasLocalData,
        hasFirestoreData,
        needsMigration: hasLocalData && !hasFirestoreData
      };
    } catch (error) {
      console.error('Error checking migration status:', error);
      return { migrated: false, error: error.message };
    }
  }

  clearLocalStorageAfterMigration() {
    try {
      localStorage.removeItem('migraine_entries');
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('auth_credentials');
      return { success: true };
    } catch (error) {
      console.error('Error clearing local storage:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new MigrationService();