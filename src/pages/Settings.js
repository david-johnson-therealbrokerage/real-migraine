import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import storage from '../services/storage';
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