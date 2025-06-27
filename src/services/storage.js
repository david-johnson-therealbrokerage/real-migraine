const STORAGE_KEYS = {
    ENTRIES: 'migraine_entries',
    USER_PREFERENCES: 'user_preferences',
    AUTH_CREDENTIALS: 'auth_credentials',
    SCHEMA_VERSION: 'schema_version'
};

const CURRENT_SCHEMA_VERSION = 1;

class StorageService {
    constructor() {
        this.initializeStorage();
    }

    initializeStorage() {
        const version = this.get(STORAGE_KEYS.SCHEMA_VERSION);
        if (!version) {
            // First time setup
            this.set(STORAGE_KEYS.SCHEMA_VERSION, CURRENT_SCHEMA_VERSION);
            this.set(STORAGE_KEYS.ENTRIES, []);
            this.set(STORAGE_KEYS.USER_PREFERENCES, {
                darkMode: false,
                notifications: false
            });
        } else if (version < CURRENT_SCHEMA_VERSION) {
            // Handle migrations in the future
            this.migrateData(version, CURRENT_SCHEMA_VERSION);
        }
    }

    migrateData(fromVersion, toVersion) {
        console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
        // Add migration logic here as schema evolves
        this.set(STORAGE_KEYS.SCHEMA_VERSION, toVersion);
    }

    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error(`Error reading from localStorage for key ${key}:`, error);
            return null;
        }
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage for key ${key}:`, error);
            return false;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage for key ${key}:`, error);
            return false;
        }
    }

    // Migraine Entry Methods
    getAllEntries() {
        return this.get(STORAGE_KEYS.ENTRIES) || [];
    }

    getEntry(id) {
        const entries = this.getAllEntries();
        // Convert both to string for comparison since URL params are strings
        return entries.find(entry => String(entry.id) === String(id));
    }

    saveEntry(entry) {
        const entries = this.getAllEntries();
        const newEntry = {
            ...entry,
            id: entry.id || Date.now().toString(),
            createdAt: entry.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const existingIndex = entries.findIndex(e => String(e.id) === String(newEntry.id));
        if (existingIndex >= 0) {
            entries[existingIndex] = newEntry;
        } else {
            entries.push(newEntry);
        }

        return this.set(STORAGE_KEYS.ENTRIES, entries) ? newEntry : null;
    }

    deleteEntry(id) {
        const entries = this.getAllEntries();
        const filtered = entries.filter(entry => String(entry.id) !== String(id));
        return this.set(STORAGE_KEYS.ENTRIES, filtered);
    }

    // User Preferences Methods
    getPreferences() {
        return this.get(STORAGE_KEYS.USER_PREFERENCES) || {
            darkMode: false,
            notifications: false
        };
    }

    savePreferences(preferences) {
        return this.set(STORAGE_KEYS.USER_PREFERENCES, preferences);
    }

    // Authentication Methods
    hashPin(pin) {
        // Simple hash function for demo purposes
        // In production, use a proper crypto library
        let hash = 0;
        for (let i = 0; i < pin.length; i++) {
            const char = pin.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    setPin(pin) {
        const hashedPin = this.hashPin(pin);
        return this.set(STORAGE_KEYS.AUTH_CREDENTIALS, { pin: hashedPin });
    }

    verifyPin(pin) {
        const stored = this.get(STORAGE_KEYS.AUTH_CREDENTIALS);
        if (!stored || !stored.pin) return false;
        return stored.pin === this.hashPin(pin);
    }

    hasPin() {
        const stored = this.get(STORAGE_KEYS.AUTH_CREDENTIALS);
        return !!(stored && stored.pin);
    }

    // Export/Import Methods
    exportData() {
        return {
            version: CURRENT_SCHEMA_VERSION,
            exportDate: new Date().toISOString(),
            entries: this.getAllEntries(),
            preferences: this.getPreferences()
        };
    }

    importData(data) {
        if (!data || !data.version) {
            throw new Error('Invalid import data format');
        }

        // Validate and import entries
        if (data.entries && Array.isArray(data.entries)) {
            this.set(STORAGE_KEYS.ENTRIES, data.entries);
        }

        // Import preferences
        if (data.preferences) {
            this.set(STORAGE_KEYS.USER_PREFERENCES, data.preferences);
        }

        return true;
    }

    // Storage usage info
    getStorageInfo() {
        const usage = new Blob(Object.values(localStorage)).size;
        const usageInKB = (usage / 1024).toFixed(2);
        return {
            usage: usageInKB + ' KB',
            entriesCount: this.getAllEntries().length,
            // Most browsers have 5-10MB limit
            estimatedCapacity: '5 MB'
        };
    }

    clearAllData() {
        // Keep schema version to avoid re-initialization
        const version = this.get(STORAGE_KEYS.SCHEMA_VERSION);
        localStorage.clear();
        this.set(STORAGE_KEYS.SCHEMA_VERSION, version);
        this.initializeStorage();
    }
}

export default new StorageService();