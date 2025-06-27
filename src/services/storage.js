const STORAGE_KEYS = {
    ENTRIES: 'migraine_entries',
    USER_PREFERENCES: 'user_preferences',
    AUTH_CREDENTIALS: 'auth_credentials',
    PIN_HASH: 'pin_hash', // For compatibility with existing PIN storage
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
        try {
            const data = {
                version: CURRENT_SCHEMA_VERSION,
                exportDate: new Date().toISOString(),
                entries: this.getAllEntries(),
                preferences: this.getPreferences(),
                // Include PIN hash for complete backup
                pinHash: localStorage.getItem(STORAGE_KEYS.PIN_HASH)
            };
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            throw new Error('Failed to export data');
        }
    }

    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            
            // Validate import data
            if (!data || !data.version) {
                throw new Error('Invalid backup file format');
            }

            // Backup current data before import
            const currentEntries = this.getAllEntries();
            const currentPrefs = this.getPreferences();
            
            try {
                // Import entries
                if (data.entries && Array.isArray(data.entries)) {
                    this.set(STORAGE_KEYS.ENTRIES, data.entries);
                }

                // Import preferences
                if (data.preferences) {
                    this.set(STORAGE_KEYS.USER_PREFERENCES, data.preferences);
                }
                
                // Import PIN if provided
                if (data.pinHash) {
                    localStorage.setItem(STORAGE_KEYS.PIN_HASH, data.pinHash);
                }
                
                return {
                    success: true,
                    importedCount: data.entries ? data.entries.length : 0,
                    message: `Successfully imported ${data.entries ? data.entries.length : 0} entries`
                };
            } catch (importError) {
                // Restore backup on failure
                this.set(STORAGE_KEYS.ENTRIES, currentEntries);
                this.set(STORAGE_KEYS.USER_PREFERENCES, currentPrefs);
                throw importError;
            }
        } catch (error) {
            console.error('Error importing data:', error);
            throw new Error('Failed to import data: ' + error.message);
        }
    }

    // Export as CSV for medical providers
    exportCSV() {
        try {
            const entries = this.getAllEntries();
            
            if (entries.length === 0) {
                return '';
            }

            // CSV headers
            const headers = [
                'Start Date',
                'Start Time',
                'End Date',
                'End Time',
                'Duration (hours)',
                'Intensity (1-10)',
                'Location',
                'Symptoms',
                'Triggers',
                'Notes'
            ];

            // Convert entries to CSV rows
            const rows = entries.map(entry => {
                const startDate = new Date(entry.startDateTime);
                const endDate = entry.endDateTime ? new Date(entry.endDateTime) : null;
                const duration = entry.duration ? (entry.duration / 60).toFixed(1) : '';

                return [
                    startDate.toLocaleDateString(),
                    startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    endDate ? endDate.toLocaleDateString() : '',
                    endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                    duration,
                    entry.intensity || '',
                    entry.location || '',
                    (entry.symptoms || []).join('; '),
                    (entry.triggers || []).join('; '),
                    (entry.notes || '').replace(/"/g, '""') // Escape quotes in notes
                ];
            });

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => 
                    row.map(cell => `"${cell}"`).join(',')
                )
            ].join('\n');

            return csvContent;
        } catch (error) {
            console.error('Error exporting CSV:', error);
            throw new Error('Failed to export CSV');
        }
    }

    // Storage usage info
    getStorageInfo() {
        try {
            const entries = this.getAllEntries();
            const allData = JSON.stringify(localStorage);
            const dataSize = new Blob([allData]).size;
            const maxSize = 5 * 1024 * 1024; // 5MB typical localStorage limit
            
            return {
                entriesCount: entries.length,
                dataSize: dataSize,
                dataSizeFormatted: this.formatBytes(dataSize),
                maxSize: maxSize,
                maxSizeFormatted: this.formatBytes(maxSize),
                usagePercentage: ((dataSize / maxSize) * 100).toFixed(1),
                remainingSpace: maxSize - dataSize,
                remainingSpaceFormatted: this.formatBytes(maxSize - dataSize),
                isNearLimit: dataSize > (maxSize * 0.8) // Warning if over 80%
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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