import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import storageService from '../services/storage';

function Login({ onLogin }) {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    
    useEffect(() => {
        // Check if user already has a PIN
        const hasPin = storageService.hasPin();
        setIsNewUser(!hasPin);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isNewUser) {
            if (pin.length < 4) {
                setError('PIN must be at least 4 digits');
                return;
            }
            if (pin !== confirmPin) {
                setError('PINs do not match');
                return;
            }
            // Save PIN
            const success = storageService.setPin(pin);
            if (success) {
                onLogin();
                navigate('/');
            } else {
                setError('Failed to save PIN. Please try again.');
            }
        } else {
            // Verify PIN
            const isValid = storageService.verifyPin(pin);
            if (isValid) {
                onLogin();
                navigate('/');
            } else {
                setError('Incorrect PIN');
            }
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>Migraine Tracker</h1>
                <h2>{isNewUser ? 'Create PIN' : 'Enter PIN'}</h2>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="Enter PIN"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            required
                        />
                    </div>

                    {isNewUser && (
                        <div className="form-group">
                            <input
                                type="password"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                placeholder="Confirm PIN"
                                value={confirmPin}
                                onChange={(e) => setConfirmPin(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" className="btn-primary">
                        {isNewUser ? 'Create Account' : 'Login'}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={() => {
                        setIsNewUser(!isNewUser);
                        setError('');
                        setPin('');
                        setConfirmPin('');
                    }}
                    className="link-button"
                >
                    {isNewUser ? 'Already have a PIN? Login' : 'New user? Create PIN'}
                </button>

                <p className="privacy-note">
                    Your data is stored locally on this device only.
                </p>
            </div>
        </div>
    );
}

export default Login;