import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Login({ onLogin }) {
    const navigate = useNavigate();
    const [pin, setPin] = useState('');
    const [isNewUser, setIsNewUser] = useState(false);
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

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
            // TODO: Save hashed PIN to local storage
            console.log('Creating new PIN');
            onLogin();
            navigate('/');
        } else {
            // TODO: Verify PIN from local storage
            console.log('Verifying PIN');
            onLogin();
            navigate('/');
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