import React, { useState, useEffect } from 'react';
import { isFirebaseEnabled } from '../config/environment';
import authService from '../services/authService';

function FirestoreStatus() {
    const [showBanner, setShowBanner] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);

    useEffect(() => {
        checkFirstTimeUser();
    }, []);

    const checkFirstTimeUser = () => {
        // Only show for Firebase users
        if (!isFirebaseEnabled() || !authService.isAuthenticated()) {
            return;
        }

        // Check if this is the user's first time
        const hasSeenBanner = sessionStorage.getItem('firestoreStatusSeen');
        if (!hasSeenBanner) {
            setShowBanner(true);
            setIsFirstTime(true);
            sessionStorage.setItem('firestoreStatusSeen', 'true');
        }
    };

    if (!showBanner) {
        return null;
    }

    return (
        <div className="firestore-status-banner">
            <div className="status-content">
                <h3>🎉 Welcome to Cloud Storage!</h3>
                <p>
                    Your data is now securely stored in the cloud. You can access it from any device
                    by signing in with the same account.
                </p>
                {isFirstTime && (
                    <p className="info-note">
                        <strong>Note:</strong> If you're seeing empty data, it's because this is your first time 
                        using cloud storage. Start adding entries to build your migraine history!
                    </p>
                )}
                <button 
                    className="btn-secondary"
                    onClick={() => setShowBanner(false)}
                >
                    Got it!
                </button>
            </div>
        </div>
    );
}

export default FirestoreStatus;