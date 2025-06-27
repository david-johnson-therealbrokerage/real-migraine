import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

function FirebaseLogin({ onLogin }) {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            if (isResetPassword) {
                const result = await authService.resetPassword(email);
                if (result.success) {
                    setSuccessMessage('Password reset email sent! Check your inbox.');
                    setIsResetPassword(false);
                } else {
                    setError(result.error);
                }
            } else if (isSignUp) {
                const result = await authService.signUp(email, password, displayName);
                if (result.success) {
                    onLogin();
                    navigate('/');
                } else {
                    setError(result.error);
                }
            } else {
                const result = await authService.signIn(email, password);
                if (result.success) {
                    onLogin();
                    navigate('/');
                } else {
                    setError(result.error);
                }
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setError('');
        setLoading(true);

        try {
            const result = await authService.signInWithGoogle();
            if (result.success) {
                onLogin();
                navigate('/');
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setDisplayName('');
        setError('');
        setSuccessMessage('');
    };

    const switchMode = (mode) => {
        resetForm();
        if (mode === 'signin') {
            setIsSignUp(false);
            setIsResetPassword(false);
        } else if (mode === 'signup') {
            setIsSignUp(true);
            setIsResetPassword(false);
        } else if (mode === 'reset') {
            setIsResetPassword(true);
            setIsSignUp(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1>Migraine Tracker</h1>
                <h2>
                    {isResetPassword ? 'Reset Password' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </h2>
                
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    {!isResetPassword && (
                        <div className="form-group">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                minLength={6}
                            />
                        </div>
                    )}

                    {isSignUp && (
                        <div className="form-group">
                            <input
                                type="text"
                                placeholder="Display Name (optional)"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>
                    )}

                    {error && <p className="error-message">{error}</p>}
                    {successMessage && <p className="success-message">{successMessage}</p>}

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Loading...' : (
                            isResetPassword ? 'Send Reset Email' : (isSignUp ? 'Create Account' : 'Sign In')
                        )}
                    </button>
                </form>

                {!isResetPassword && (
                    <div className="oauth-section">
                        <div className="divider">
                            <span>OR</span>
                        </div>
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            className="btn-google"
                            disabled={loading}
                        >
                            <span className="google-icon">🔵</span>
                            Sign in with Google
                        </button>
                    </div>
                )}

                <div className="auth-links">
                    {!isResetPassword && (
                        <button
                            type="button"
                            onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}
                            className="link-button"
                        >
                            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                        </button>
                    )}

                    {!isSignUp && (
                        <button
                            type="button"
                            onClick={() => switchMode(isResetPassword ? 'signin' : 'reset')}
                            className="link-button"
                        >
                            {isResetPassword ? 'Back to Sign In' : 'Forgot Password?'}
                        </button>
                    )}
                </div>

                <p className="privacy-note">
                    Your data is securely stored in the cloud and synced across devices.
                </p>
            </div>
        </div>
    );
}

export default FirebaseLogin;