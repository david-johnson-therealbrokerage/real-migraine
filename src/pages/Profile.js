import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { isFirebaseEnabled } from '../config/environment';

function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUserInfo();
        
        // Listen for auth state changes
        const unsubscribe = authService.onAuthStateChange((user) => {
            setUser(user);
            setLoading(false);
        });
        
        return () => unsubscribe();
    }, []);

    const loadUserInfo = () => {
        const currentUser = authService.getCurrentUser();
        setUser(currentUser);
        setLoading(false);
    };

    const handleSignOut = async () => {
        if (window.confirm('Are you sure you want to sign out?')) {
            await authService.signOut();
            navigate('/login');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Show a temporary success message
            const button = event.target;
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            button.classList.add('copied');
            
            setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    };

    if (loading) {
        return (
            <div className="profile-page">
                <h2>Profile</h2>
                <div className="loading">Loading user information...</div>
            </div>
        );
    }

    if (!isFirebaseEnabled()) {
        return (
            <div className="profile-page">
                <h2>Profile</h2>
                <div className="profile-info">
                    <p className="info-message">
                        Profile information is only available when using cloud storage.
                        Currently using local storage mode.
                    </p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="profile-page">
                <h2>Profile</h2>
                <div className="profile-info">
                    <p className="error-message">No user information available. Please sign in.</p>
                    <button onClick={() => navigate('/login')} className="btn-primary">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page">
            <h2>Profile</h2>
            
            <div className="profile-section">
                <h3>User Information</h3>
                
                <div className="profile-info">
                    <div className="info-row">
                        <label>User ID:</label>
                        <div className="info-value">
                            <code>{user.uid}</code>
                            <button 
                                className="copy-btn"
                                onClick={() => copyToClipboard(user.uid)}
                                title="Copy User ID"
                            >
                                📋
                            </button>
                        </div>
                    </div>
                    
                    <div className="info-row">
                        <label>Email:</label>
                        <div className="info-value">
                            <span>{user.email || 'No email provided'}</span>
                            {user.email && (
                                <button 
                                    className="copy-btn"
                                    onClick={() => copyToClipboard(user.email)}
                                    title="Copy Email"
                                >
                                    📋
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <div className="info-row">
                        <label>Display Name:</label>
                        <div className="info-value">
                            <span>{user.displayName || 'Not set'}</span>
                        </div>
                    </div>
                    
                    <div className="info-row">
                        <label>Auth Provider:</label>
                        <div className="info-value">
                            <span>
                                {user.providerData && user.providerData[0] 
                                    ? user.providerData[0].providerId.replace('.com', '') 
                                    : 'Unknown'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="info-row">
                        <label>Account Created:</label>
                        <div className="info-value">
                            <span>
                                {user.metadata && user.metadata.creationTime 
                                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                                    : 'Unknown'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="info-row">
                        <label>Last Sign In:</label>
                        <div className="info-value">
                            <span>
                                {user.metadata && user.metadata.lastSignInTime 
                                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                                    : 'Unknown'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-actions">
                <button onClick={handleSignOut} className="btn-secondary">
                    Sign Out
                </button>
            </div>
        </div>
    );
}

export default Profile;