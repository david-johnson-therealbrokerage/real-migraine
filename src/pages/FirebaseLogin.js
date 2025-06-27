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
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
                                <path fill="#ffc107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917"/>
                                <path fill="#ff3d00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691"/>
                                <path fill="#4caf50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.9 11.9 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44"/>
                                <path fill="#1976d2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917"/>
                            </svg>
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