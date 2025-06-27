import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import './styles/App.css';
import storageService from './services/storage';
import ErrorBoundary from './components/ErrorBoundary';
import authService from './services/authService';
import dataService from './services/dataService';
import ENV, { isFirebaseEnabled } from './config/environment';

// Pages
import Login from './pages/Login';
import FirebaseLogin from './pages/FirebaseLogin';
import Dashboard from './pages/Dashboard';
import NewEntry from './pages/NewEntry';
import History from './pages/History';
import EditEntry from './pages/EditEntry';
import Settings from './pages/Settings';
import Profile from './pages/Profile';

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const preferences = storageService.getPreferences();
        return preferences.darkMode || false;
    });
    
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const useFirebase = isFirebaseEnabled();

    useEffect(() => {
        // Configure data service
        dataService.setUseFirebase(useFirebase);
        
        if (useFirebase) {
            // Set up Firebase auth listener
            const unsubscribe = authService.onAuthStateChange((user) => {
                setCurrentUser(user);
                setIsAuthenticated(!!user);
                setIsLoading(false);
            });
            
            return () => unsubscribe();
        } else {
            // Check if user has set up a PIN
            const hasPin = storageService.hasPin();
            if (!hasPin) {
                setIsAuthenticated(true); // No PIN required yet
            }
            setIsLoading(false);
        }
    }, [useFirebase]);

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        const preferences = storageService.getPreferences();
        storageService.savePreferences({ ...preferences, darkMode });
    }, [darkMode]);

    const handleLogin = () => {
        setIsAuthenticated(true);
    };

    const handleLogout = async () => {
        if (useFirebase) {
            await authService.signOut();
        }
        setIsAuthenticated(false);
    };

    if (isLoading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <ErrorBoundary>
            <Router>
                <div className="app">
                {isAuthenticated && (
                    <header className="app-header">
                        <Link to="/" className="app-title">
                            <h1>Migraine Tracker</h1>
                        </Link>
                        <nav className="app-nav">
                            <Link to="/" className="nav-link">Dashboard</Link>
                            <Link to="/new" className="nav-link">New Entry</Link>
                            <Link to="/history" className="nav-link">History</Link>
                            <Link to="/settings" className="nav-link">Settings</Link>
                            {useFirebase && <Link to="/profile" className="nav-link">Profile</Link>}
                        </nav>
                        <div className="header-actions">
                            <button 
                                className="theme-toggle"
                                onClick={() => setDarkMode(!darkMode)}
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>
                            {useFirebase && currentUser && (
                                <Link to="/profile" className="user-icon" title={currentUser.email || 'Profile'}>
                                    👤
                                </Link>
                            )}
                            {(useFirebase || storageService.hasPin()) && (
                                <button 
                                    className="logout-btn"
                                    onClick={handleLogout}
                                    aria-label="Logout"
                                >
                                    🔒
                                </button>
                            )}
                        </div>
                    </header>
                )}
                
                <main className="app-main">
                    <Routes>
                        {!isAuthenticated ? (
                            <>
                                <Route 
                                    path="/login" 
                                    element={useFirebase ? 
                                        <FirebaseLogin onLogin={handleLogin} /> : 
                                        <Login onLogin={handleLogin} />
                                    } 
                                />
                                <Route path="*" element={<Navigate to="/login" />} />
                            </>
                        ) : (
                            <>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/new" element={<NewEntry />} />
                                <Route path="/history" element={<History />} />
                                <Route path="/edit/:id" element={<EditEntry />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/login" element={<Navigate to="/" />} />
                            </>
                        )}
                    </Routes>
                </main>
            </div>
        </Router>
        </ErrorBoundary>
    );
}

export default App;