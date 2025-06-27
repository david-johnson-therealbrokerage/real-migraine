import React, { useState, useEffect } from 'react';
import migrationService from '../services/migrationService';
import authService from '../services/authService';
import { isFirebaseEnabled } from '../config/environment';

function MigrationBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState(null);
    const [isMigrating, setIsMigrating] = useState(false);
    const [migrationResult, setMigrationResult] = useState(null);

    useEffect(() => {
        checkMigrationNeeded();
    }, []);

    const checkMigrationNeeded = async () => {
        if (!isFirebaseEnabled() || !authService.isAuthenticated()) {
            setShowBanner(false);
            return;
        }

        try {
            const status = await migrationService.checkMigrationStatus();
            setMigrationStatus(status);
            setShowBanner(status.needsMigration);
        } catch (error) {
            console.error('Error checking migration status:', error);
        }
    };

    const handleMigration = async () => {
        setIsMigrating(true);
        setMigrationResult(null);

        try {
            const result = await migrationService.migrateLocalDataToFirestore();
            setMigrationResult(result);
            
            if (result.success) {
                // Optionally clear local storage after successful migration
                const confirmClear = window.confirm(
                    'Migration successful! Would you like to clear your local data? (Your data is now safely stored in the cloud)'
                );
                
                if (confirmClear) {
                    migrationService.clearLocalStorageAfterMigration();
                }
                
                setShowBanner(false);
            }
        } catch (error) {
            console.error('Migration error:', error);
            setMigrationResult({
                success: false,
                error: error.message
            });
        } finally {
            setIsMigrating(false);
        }
    };

    const dismissBanner = () => {
        setShowBanner(false);
        // Store dismissal in session storage so it doesn't show again this session
        sessionStorage.setItem('migrationBannerDismissed', 'true');
    };

    if (!showBanner || sessionStorage.getItem('migrationBannerDismissed')) {
        return null;
    }

    return (
        <div className="migration-banner">
            <div className="migration-content">
                <h3>🔄 Migrate Your Data to the Cloud</h3>
                <p>
                    We detected local data on this device. Would you like to migrate it to your cloud account?
                    This will allow you to access your data from any device.
                </p>
                
                {migrationResult && (
                    <div className={`migration-result ${migrationResult.success ? 'success' : 'error'}`}>
                        {migrationResult.success ? (
                            <>
                                <strong>✅ Migration Successful!</strong>
                                <p>
                                    Migrated {migrationResult.results.migraines.success} entries
                                    {migrationResult.results.migraines.failed > 0 && 
                                        ` (${migrationResult.results.migraines.failed} failed)`
                                    }
                                </p>
                            </>
                        ) : (
                            <>
                                <strong>❌ Migration Failed</strong>
                                <p>{migrationResult.error || 'An error occurred during migration'}</p>
                            </>
                        )}
                    </div>
                )}
                
                <div className="migration-actions">
                    <button 
                        className="btn-primary"
                        onClick={handleMigration}
                        disabled={isMigrating}
                    >
                        {isMigrating ? 'Migrating...' : 'Migrate Now'}
                    </button>
                    <button 
                        className="btn-secondary"
                        onClick={dismissBanner}
                        disabled={isMigrating}
                    >
                        Not Now
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MigrationBanner;