import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import storageService from '../services/storage';

function Dashboard() {
    const [stats, setStats] = useState({
        total: 0,
        thisMonth: 0,
        avgDuration: '--',
        mostCommonTrigger: '--',
        recentEntries: []
    });
    
    useEffect(() => {
        calculateStats();
    }, []);
    
    const calculateStats = () => {
        const entries = storageService.getAllEntries();
        
        // Total count
        const total = entries.length;
        
        // This month count
        const now = new Date();
        const thisMonthEntries = entries.filter(entry => {
            const entryDate = new Date(entry.startDateTime);
            return entryDate.getMonth() === now.getMonth() && 
                   entryDate.getFullYear() === now.getFullYear();
        });
        const thisMonth = thisMonthEntries.length;
        
        // Average duration
        const entriesWithDuration = entries.filter(e => e.duration);
        let avgDuration = '--';
        if (entriesWithDuration.length > 0) {
            const totalMinutes = entriesWithDuration.reduce((sum, e) => sum + e.duration, 0);
            const avgMinutes = Math.round(totalMinutes / entriesWithDuration.length);
            const hours = Math.floor(avgMinutes / 60);
            const mins = avgMinutes % 60;
            avgDuration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        }
        
        // Most common trigger
        let mostCommonTrigger = '--';
        if (entries.length > 0) {
            const triggerCounts = {};
            entries.forEach(entry => {
                entry.triggers.forEach(trigger => {
                    triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
                });
            });
            
            const sortedTriggers = Object.entries(triggerCounts)
                .sort(([,a], [,b]) => b - a);
            
            if (sortedTriggers.length > 0) {
                mostCommonTrigger = sortedTriggers[0][0];
            }
        }
        
        // Recent entries (last 5)
        const recentEntries = entries
            .sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime))
            .slice(0, 5);
        
        setStats({
            total,
            thisMonth,
            avgDuration,
            mostCommonTrigger,
            recentEntries
        });
    };
    
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };
    
    return (
        <div className="dashboard-page">
            <h2>Dashboard</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Migraines</h3>
                    <p className="stat-value">{stats.total}</p>
                </div>
                <div className="stat-card">
                    <h3>This Month</h3>
                    <p className="stat-value">{stats.thisMonth}</p>
                </div>
                <div className="stat-card">
                    <h3>Average Duration</h3>
                    <p className="stat-value">{stats.avgDuration}</p>
                </div>
                <div className="stat-card">
                    <h3>Most Common Trigger</h3>
                    <p className="stat-value">{stats.mostCommonTrigger}</p>
                </div>
            </div>
            
            <div className="recent-section">
                <h3>Recent Entries</h3>
                {stats.recentEntries.length === 0 ? (
                    <p className="empty-message">No entries yet. 
                        <Link to="/new"> Add your first entry</Link>
                    </p>
                ) : (
                    <div className="recent-entries">
                        {stats.recentEntries.map(entry => (
                            <div key={entry.id} className="recent-entry">
                                <span className="recent-date">{formatDate(entry.startDateTime)}</span>
                                <span className="recent-intensity">Intensity: {entry.intensity}/10</span>
                                <span className="recent-location">{entry.location}</span>
                            </div>
                        ))}
                        <Link to="/history" className="view-all-link">View all entries →</Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;