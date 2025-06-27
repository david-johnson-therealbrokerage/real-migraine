import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dataService from '../services/dataService';

function NewEntry() {
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        startDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toTimeString().split(' ')[0].slice(0, 5),
        endDate: '',
        endTime: '',
        intensity: 5,
        location: 'Unspecified',
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
        'Unspecified', 'Left Side', 'Right Side', 'Both Sides', 'Front', 'Back', 'Behind Eyes'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        
        try {
            // Validate form data
            if (!formData.startDate || !formData.startTime) {
                throw new Error('Start date and time are required');
            }
            
            // Validate end time is after start time if provided
            if (formData.endDate && formData.endTime) {
                const start = new Date(`${formData.startDate}T${formData.startTime}`);
                const end = new Date(`${formData.endDate}T${formData.endTime}`);
                if (end <= start) {
                    throw new Error('End time must be after start time');
                }
            }
            
            // Calculate duration if end date/time provided
            let duration = null;
            if (formData.endDate && formData.endTime) {
                const start = new Date(`${formData.startDate}T${formData.startTime}`);
                const end = new Date(`${formData.endDate}T${formData.endTime}`);
                duration = Math.round((end - start) / (1000 * 60)); // duration in minutes
            }
            
            const entry = {
                startDateTime: `${formData.startDate}T${formData.startTime}`,
                endDateTime: formData.endDate && formData.endTime ? `${formData.endDate}T${formData.endTime}` : null,
                duration,
                intensity: formData.intensity,
                location: formData.location,
                symptoms: formData.symptoms,
                triggers: formData.triggers,
                notes: formData.notes
            };
            
            // Save the new entry using dataService
            await dataService.addMigraine(entry);
            navigate('/history');
        } catch (err) {
            console.error('Error saving entry:', err);
            setError(err.message || 'Failed to save entry. Please try again.');
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/');
    };

    return (
        <div className="new-entry-page">
            <h2>New Migraine Entry</h2>
            
            {error && (
                <div className="error-message" role="alert">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="migraine-form">
                <div className="form-buttons">
                    <button type="button" onClick={handleCancel} className="btn-secondary" disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>

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
                    <button type="button" onClick={handleCancel} className="btn-secondary" disabled={isSubmitting}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default NewEntry;