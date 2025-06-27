import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import storageService from '../services/storage';

function EditEntry() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        intensity: 5,
        location: '',
        symptoms: [],
        triggers: [],
        notes: ''
    });

    const symptomOptions = [
        'Nausea', 'Light Sensitivity', 'Sound Sensitivity', 
        'Aura', 'Dizziness', 'Fatigue', 'Neck Pain'
    ];

    const triggerOptions = [
        'Stress', 'Lack of Sleep', 'Weather', 'Food', 
        'Dehydration', 'Screen Time', 'Hormones', 'Exercise'
    ];

    const locationOptions = [
        'Left Side', 'Right Side', 'Both Sides', 'Front', 'Back', 'Behind Eyes'
    ];

    useEffect(() => {
        loadEntry();
    }, [id]);

    const loadEntry = () => {
        console.log('Loading entry with ID:', id);
        const entry = storageService.getEntry(id);
        console.log('Found entry:', entry);
        
        if (!entry) {
            setError('Entry not found');
            setLoading(false);
            return;
        }

        try {
            // Parse the entry data for the form
            const startDateTime = new Date(entry.startDateTime);
            const formData = {
                startDate: startDateTime.toISOString().split('T')[0],
                startTime: startDateTime.toTimeString().split(' ')[0].slice(0, 5),
                endDate: '',
                endTime: '',
                intensity: entry.intensity,
                location: entry.location,
                symptoms: entry.symptoms || [],
                triggers: entry.triggers || [],
                notes: entry.notes || ''
            };

            if (entry.endDateTime) {
                const endDateTime = new Date(entry.endDateTime);
                formData.endDate = endDateTime.toISOString().split('T')[0];
                formData.endTime = endDateTime.toTimeString().split(' ')[0].slice(0, 5);
            }

            setFormData(formData);
            setLoading(false);
        } catch (error) {
            console.error('Error parsing entry data:', error);
            setError('Error loading entry data');
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Calculate duration if end date/time provided
        let duration = null;
        if (formData.endDate && formData.endTime) {
            const start = new Date(`${formData.startDate}T${formData.startTime}`);
            const end = new Date(`${formData.endDate}T${formData.endTime}`);
            duration = Math.round((end - start) / (1000 * 60)); // duration in minutes
        }
        
        const updatedEntry = {
            id, // Keep the same ID
            startDateTime: `${formData.startDate}T${formData.startTime}`,
            endDateTime: formData.endDate && formData.endTime ? `${formData.endDate}T${formData.endTime}` : null,
            duration,
            intensity: formData.intensity,
            location: formData.location,
            symptoms: formData.symptoms,
            triggers: formData.triggers,
            notes: formData.notes
        };
        
        const savedEntry = storageService.saveEntry(updatedEntry);
        if (savedEntry) {
            navigate('/history');
        } else {
            alert('Failed to save entry. Please try again.');
        }
    };

    const handleCancel = () => {
        navigate('/history');
    };

    if (loading) {
        return <div className="loading">Loading entry...</div>;
    }

    if (error) {
        return (
            <div className="error-page">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/history')} className="btn-primary">
                    Back to History
                </button>
            </div>
        );
    }

    return (
        <div className="edit-entry-page">
            <h2>Edit Migraine Entry</h2>
            <form onSubmit={handleSubmit} className="migraine-form">
                <div className="form-group">
                    <label>Start Date & Time</label>
                    <div className="datetime-group">
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                            required
                        />
                        <input
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>End Date & Time (optional)</label>
                    <div className="datetime-group">
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                        />
                        <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Pain Intensity: {formData.intensity}</label>
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={formData.intensity}
                        onChange={(e) => setFormData({...formData, intensity: parseInt(e.target.value)})}
                        className="intensity-slider"
                    />
                    <div className="intensity-labels">
                        <span>1</span>
                        <span>5</span>
                        <span>10</span>
                    </div>
                </div>

                <div className="form-group">
                    <label>Location</label>
                    <select
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        required
                    >
                        <option value="">Select location...</option>
                        {locationOptions.map(loc => (
                            <option key={loc} value={loc}>{loc}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label>Symptoms</label>
                    <div className="checkbox-group">
                        {symptomOptions.map(symptom => (
                            <label key={symptom} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.symptoms.includes(symptom)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData({...formData, symptoms: [...formData.symptoms, symptom]});
                                        } else {
                                            setFormData({...formData, symptoms: formData.symptoms.filter(s => s !== symptom)});
                                        }
                                    }}
                                />
                                {symptom}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Triggers</label>
                    <div className="checkbox-group">
                        {triggerOptions.map(trigger => (
                            <label key={trigger} className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.triggers.includes(trigger)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData({...formData, triggers: [...formData.triggers, trigger]});
                                        } else {
                                            setFormData({...formData, triggers: formData.triggers.filter(t => t !== trigger)});
                                        }
                                    }}
                                />
                                {trigger}
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Notes</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows="4"
                        placeholder="Additional notes..."
                    />
                </div>

                <div className="form-buttons">
                    <button type="button" onClick={handleCancel} className="btn-secondary">
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
}

export default EditEntry;