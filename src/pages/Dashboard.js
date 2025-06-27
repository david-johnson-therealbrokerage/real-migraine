import React from 'react';

function Dashboard() {
    return (
        <div className="dashboard-page">
            <h2>Dashboard</h2>
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Migraines</h3>
                    <p className="stat-value">0</p>
                </div>
                <div className="stat-card">
                    <h3>This Month</h3>
                    <p className="stat-value">0</p>
                </div>
                <div className="stat-card">
                    <h3>Average Duration</h3>
                    <p className="stat-value">-- hrs</p>
                </div>
                <div className="stat-card">
                    <h3>Most Common Trigger</h3>
                    <p className="stat-value">--</p>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;