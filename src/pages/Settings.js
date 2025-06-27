import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import storage from '../services/storage';
import dataService from '../services/dataService';
import './Settings.css';

function Settings() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [storageInfo, setStorageInfo] = useState(null);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        updateStorageInfo();
    }, []);

    const updateStorageInfo = () => {
        const info = storage.getStorageInfo();
        setStorageInfo(info);
    };

    const showMessage = (msg, isError = false) => {
        if (isError) {
            setError(msg);
            setMessage('');
        } else {
            setMessage(msg);
            setError('');
        }
        setTimeout(() => {
            setMessage('');
            setError('');
        }, 5000);
    };

    const handleExportJSON = () => {
        try {
            const data = storage.exportData();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `migraine-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMessage('Data exported successfully!');
        } catch (err) {
            showMessage('Failed to export data: ' + err.message, true);
        }
    };

    const handleExportCSV = () => {
        try {
            const csv = storage.exportCSV();
            if (!csv) {
                showMessage('No entries to export', true);
                return;
            }
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `migraine-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showMessage('CSV exported successfully!');
        } catch (err) {
            showMessage('Failed to export CSV: ' + err.message, true);
        }
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = storage.importData(e.target.result);
                showMessage(result.message);
                updateStorageInfo();
                // Reset file input
                fileInputRef.current.value = '';
            } catch (err) {
                showMessage('Failed to import data: ' + err.message, true);
            }
        };
        reader.readAsText(file);
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to clear all data? This cannot be undone!')) {
            if (window.confirm('This will delete ALL your migraine entries. Are you absolutely sure?')) {
                storage.clearAllData();
                showMessage('All data cleared successfully');
                updateStorageInfo();
                navigate('/');
            }
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('authenticated');
        navigate('/login');
    };

    const generateSeedData = async () => {
        if (window.confirm('This will create 30 sample migraine entries over the last 3 months. Continue?')) {
            try {
                const symptoms = [
                    'Nausea', 'Light Sensitivity', 'Sound Sensitivity', 
                    'Aura', 'Dizziness', 'Fatigue', 'Neck Pain'
                ];
                
                const triggers = [
                    'Stress', 'Lack of Sleep', 'Weather', 'Food', 
                    'Dehydration', 'Screen Time', 'Hormones', 'Exercise'
                ];
                
                const locations = [
                    'Left Side', 'Right Side', 'Both Sides', 'Front', 'Back', 'Behind Eyes'
                ];
                
                const notes = [
                    'Took medication early, helped reduce severity',
                    'Weather change seemed to trigger this one',
                    'Started during work meeting',
                    'Woke up with migraine',
                    'Gradual onset throughout the day',
                    'Very sudden onset',
                    'Medication was effective',
                    'Had to lie down in dark room',
                    'Missed work due to severity',
                    ''
                ];
                
                const seedEntries = [];
                const now = new Date();
                
                for (let i = 0; i < 30; i++) {
                    // Random date within last 3 months
                    const daysAgo = Math.floor(Math.random() * 90);
                    const startDate = new Date(now);
                    startDate.setDate(startDate.getDate() - daysAgo);
                    
                    // Random time of day
                    startDate.setHours(Math.floor(Math.random() * 24));
                    startDate.setMinutes(Math.floor(Math.random() * 60));
                    
                    // Random duration between 30 minutes and 48 hours
                    const duration = Math.floor(Math.random() * (48 * 60 - 30) + 30);
                    
                    const endDate = new Date(startDate);
                    endDate.setMinutes(endDate.getMinutes() + duration);
                    
                    // Random intensity weighted towards middle values
                    const intensityWeights = [1, 2, 3, 4, 5, 5, 6, 6, 7, 7, 8, 9, 10];
                    const intensity = intensityWeights[Math.floor(Math.random() * intensityWeights.length)];
                    
                    // Random symptoms (1-4)
                    const numSymptoms = Math.floor(Math.random() * 4) + 1;
                    const selectedSymptoms = [];
                    const symptomsCopy = [...symptoms];
                    for (let j = 0; j < numSymptoms; j++) {
                        const index = Math.floor(Math.random() * symptomsCopy.length);
                        selectedSymptoms.push(symptomsCopy[index]);
                        symptomsCopy.splice(index, 1);
                    }
                    
                    // Random triggers (1-3)
                    const numTriggers = Math.floor(Math.random() * 3) + 1;
                    const selectedTriggers = [];
                    const triggersCopy = [...triggers];
                    for (let j = 0; j < numTriggers; j++) {
                        const index = Math.floor(Math.random() * triggersCopy.length);
                        selectedTriggers.push(triggersCopy[index]);
                        triggersCopy.splice(index, 1);
                    }
                    
                    const entry = {
                        startDateTime: startDate.toISOString(),
                        endDateTime: endDate.toISOString(),
                        duration: duration,
                        intensity: intensity,
                        location: locations[Math.floor(Math.random() * locations.length)],
                        symptoms: selectedSymptoms,
                        triggers: selectedTriggers,
                        notes: notes[Math.floor(Math.random() * notes.length)]
                    };
                    
                    seedEntries.push(entry);
                }
                
                // Sort by date (oldest first) for more realistic addition
                seedEntries.sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime));
                
                // Add all entries
                for (const entry of seedEntries) {
                    await dataService.addMigraine(entry);
                }
                
                showMessage(`Successfully created ${seedEntries.length} sample migraine entries!`);
                updateStorageInfo();
            } catch (err) {
                showMessage('Failed to generate seed data: ' + err.message, true);
            }
        }
    };

    return (
        <div className="settings-page">
            <h1>Settings</h1>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <section className="settings-section">
                <h2>Data Management</h2>
                
                <div className="button-group">
                    <button onClick={handleExportJSON} className="btn btn-primary">
                        💾 Export Backup (JSON)
                    </button>
                    <button onClick={handleExportCSV} className="btn btn-secondary">
                        📊 Export for Doctor (CSV)
                    </button>
                    <label className="btn btn-import">
                        📥 Import Backup
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </section>

            <section className="settings-section">
                <h2>Storage Information</h2>
                {storageInfo && (
                    <div className="storage-info">
                        <div className="info-item">
                            <span>Total Entries:</span>
                            <span>{storageInfo.entriesCount}</span>
                        </div>
                        <div className="info-item">
                            <span>Storage Used:</span>
                            <span>{storageInfo.dataSizeFormatted} / {storageInfo.maxSizeFormatted}</span>
                        </div>
                        <div className="info-item">
                            <span>Usage:</span>
                            <span className={storageInfo.isNearLimit ? 'warning' : ''}>
                                {storageInfo.usagePercentage}%
                            </span>
                        </div>
                        {storageInfo.isNearLimit && (
                            <div className="warning-message">
                                Warning: Storage is nearly full. Consider exporting and clearing old data.
                            </div>
                        )}
                    </div>
                )}
            </section>

            <section className="settings-section">
                <h2>Development Tools</h2>
                <p>Generate sample data for testing and demonstration purposes.</p>
                <button onClick={generateSeedData} className="btn btn-secondary">
                    🌱 Generate Seed Data
                </button>
            </section>

            <section className="settings-section danger-zone">
                <h2>Danger Zone</h2>
                <button onClick={handleClearData} className="btn btn-danger">
                    Clear All Data
                </button>
            </section>

            <section className="settings-section">
                <h2>Account</h2>
                <button onClick={handleLogout} className="btn btn-secondary">
                    Logout
                </button>
            </section>
        </div>
    );
}

export default Settings;