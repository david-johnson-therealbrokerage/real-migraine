import React, { useState, useEffect } from 'react';
import './styles/App.css';

function App() {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    return (
        <div className="app">
            <header className="app-header">
                <h1>Migraine Tracker</h1>
                <button 
                    className="theme-toggle"
                    onClick={() => setDarkMode(!darkMode)}
                    aria-label="Toggle dark mode"
                >
                    {darkMode ? '☀️' : '🌙'}
                </button>
            </header>
            
            <main className="app-main">
                <div className="welcome-container">
                    <h2>Welcome to Migraine Tracker</h2>
                    <p>Track your migraines to better understand patterns and triggers.</p>
                    
                    <div className="feature-list">
                        <div className="feature-card">
                            <h3>📝 Log Migraines</h3>
                            <p>Record intensity, duration, symptoms, and triggers</p>
                        </div>
                        <div className="feature-card">
                            <h3>📊 View Analytics</h3>
                            <p>Understand patterns and frequency</p>
                        </div>
                        <div className="feature-card">
                            <h3>💾 Local Storage</h3>
                            <p>Your data stays private on your device</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;