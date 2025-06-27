import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import dataService from '../services/dataService';

function History() {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    useEffect(() => {
        loadEntries();
    }, []);
    
    const loadEntries = async () => {
        try {
            const allEntries = await dataService.getMigraines();
            // Sort by most recent first
            const sortedEntries = allEntries.sort((a, b) => 
                new Date(b.startDateTime) - new Date(a.startDateTime)
            );
            setEntries(sortedEntries);
            setError('');
        } catch (err) {
            console.error('Error loading entries:', err);
            setError('Failed to load entries. Please refresh the page.');
        } finally {
            setLoading(false);
        }
    };
    
    const formatDateTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };
    
    const formatDuration = (minutes) => {
        if (!minutes) return 'Ongoing';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };
    
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this entry?')) {
            try {
                await dataService.deleteMigraine(id);
                await loadEntries();
            } catch (err) {
                console.error('Error deleting entry:', err);
                setError('Failed to delete entry. Please try again.');
                // Clear error after 5 seconds
                setTimeout(() => setError(''), 5000);
            }
        }
    };

    return (
        <div className="history-page">
            <div className="page-header">
                <h2>Migraine History</h2>
                <Link to="/new" className="btn-primary">
                    + New Entry
                </Link>
            </div>

            {error && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="loading">Loading entries...</div>
            ) : entries.length === 0 ? (
                <div className="empty-state">
                    <p>No migraine entries yet.</p>
                    <Link to="/new" className="btn-primary">
                        Record Your First Entry
                    </Link>
                </div>
            ) : (
                <div className="entries-list">
                    {entries.map(entry => (
                        <div key={entry.id} className="entry-card">
                            <div className="entry-header">
                                <div>
                                    <h3>{formatDateTime(entry.startDateTime)}</h3>
                                    <p className="entry-duration">Duration: {formatDuration(entry.duration)}</p>
                                </div>
                                <div className="entry-intensity">
                                    <span className="intensity-badge" data-intensity={entry.intensity}>
                                        {entry.intensity}/10
                                    </span>
                                </div>
                            </div>
                            
                            <div className="entry-details">
                                <p><strong>Location:</strong> {entry.location}</p>
                                
                                {entry.symptoms.length > 0 && (
                                    <p><strong>Symptoms:</strong> {entry.symptoms.join(', ')}</p>
                                )}
                                
                                {entry.triggers.length > 0 && (
                                    <p><strong>Triggers:</strong> {entry.triggers.join(', ')}</p>
                                )}
                                
                                {entry.notes && (
                                    <p><strong>Notes:</strong> {entry.notes}</p>
                                )}
                            </div>
                            
                            <div className="entry-actions">
                                <button 
                                    onClick={() => navigate(`/edit/${entry.id}`)}
                                    className="btn-secondary"
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(entry.id)}
                                    className="btn-secondary delete-btn"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default History;