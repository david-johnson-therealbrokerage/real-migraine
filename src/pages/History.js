import React from 'react';
import { Link } from 'react-router-dom';

function History() {
    // TODO: Load entries from local storage
    const entries = [];

    return (
        <div className="history-page">
            <div className="page-header">
                <h2>Migraine History</h2>
                <Link to="/new" className="btn-primary">
                    + New Entry
                </Link>
            </div>

            {entries.length === 0 ? (
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
                            {/* Entry details will go here */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default History;