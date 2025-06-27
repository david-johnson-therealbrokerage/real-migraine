import React, { useState, useEffect } from 'react';
import dataService from '../services/dataService';
import authService from '../services/authService';
import { isFirebaseEnabled } from '../config/environment';
import storageService from '../services/storage';

function Medications() {
    const [medications, setMedications] = useState([]);
    const [entries, setEntries] = useState([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingMed, setEditingMed] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        type: 'preventive',
        dosage: '',
        frequency: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        notes: ''
    });

    const medicationTypes = ['preventive', 'abortive', 'rescue', 'supplement'];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load medications
            const savedMeds = localStorage.getItem('medications');
            if (savedMeds) {
                setMedications(JSON.parse(savedMeds));
            }
            
            // Load migraine entries
            let data = [];
            if (isFirebaseEnabled() && authService.isAuthenticated()) {
                data = await dataService.getMigraines();
            } else {
                data = storageService.getAllEntries();
            }
            setEntries(data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveMedications = (updatedMeds) => {
        localStorage.setItem('medications', JSON.stringify(updatedMeds));
        setMedications(updatedMeds);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const newMed = {
            ...formData,
            id: editingMed ? editingMed.id : Date.now().toString(),
            createdAt: editingMed ? editingMed.createdAt : new Date().toISOString()
        };

        let updatedMeds;
        if (editingMed) {
            updatedMeds = medications.map(med => 
                med.id === editingMed.id ? newMed : med
            );
        } else {
            updatedMeds = [...medications, newMed];
        }

        saveMedications(updatedMeds);
        resetForm();
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this medication?')) {
            const updatedMeds = medications.filter(med => med.id !== id);
            saveMedications(updatedMeds);
        }
    };

    const handleEdit = (med) => {
        setFormData({
            name: med.name,
            type: med.type,
            dosage: med.dosage,
            frequency: med.frequency,
            startDate: med.startDate,
            endDate: med.endDate || '',
            notes: med.notes || ''
        });
        setEditingMed(med);
        setShowAddForm(true);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: 'preventive',
            dosage: '',
            frequency: '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            notes: ''
        });
        setEditingMed(null);
        setShowAddForm(false);
    };

    const calculateEffectiveness = (med) => {
        const medStart = new Date(med.startDate);
        const medEnd = med.endDate ? new Date(med.endDate) : new Date();
        
        // Get entries before medication
        const beforeEntries = entries.filter(entry => 
            new Date(entry.startDateTime) < medStart &&
            new Date(entry.startDateTime) >= new Date(medStart.getTime() - 90 * 24 * 60 * 60 * 1000)
        );
        
        // Get entries during medication
        const duringEntries = entries.filter(entry => {
            const entryDate = new Date(entry.startDateTime);
            return entryDate >= medStart && entryDate <= medEnd;
        });

        if (beforeEntries.length === 0 || duringEntries.length === 0) {
            return null;
        }

        // Calculate metrics
        const daysBefore = 90;
        const daysDuring = Math.ceil((medEnd - medStart) / (1000 * 60 * 60 * 24));
        
        const frequencyBefore = (beforeEntries.length / daysBefore) * 30;
        const frequencyDuring = (duringEntries.length / daysDuring) * 30;
        
        const avgIntensityBefore = beforeEntries.reduce((sum, e) => sum + e.intensity, 0) / beforeEntries.length;
        const avgIntensityDuring = duringEntries.reduce((sum, e) => sum + e.intensity, 0) / duringEntries.length;
        
        const frequencyReduction = ((frequencyBefore - frequencyDuring) / frequencyBefore) * 100;
        const intensityReduction = ((avgIntensityBefore - avgIntensityDuring) / avgIntensityBefore) * 100;

        return {
            frequencyBefore: frequencyBefore.toFixed(1),
            frequencyDuring: frequencyDuring.toFixed(1),
            frequencyReduction: frequencyReduction.toFixed(0),
            avgIntensityBefore: avgIntensityBefore.toFixed(1),
            avgIntensityDuring: avgIntensityDuring.toFixed(1),
            intensityReduction: intensityReduction.toFixed(0)
        };
    };

    if (loading) {
        return <div className="loading">Loading medications...</div>;
    }

    return (
        <div className="medications-page">
            <h2>Medication Tracking</h2>
            
            <div className="medications-header">
                <p>Track your migraine medications and monitor their effectiveness</p>
                <button 
                    className="btn btn-primary"
                    onClick={() => setShowAddForm(!showAddForm)}
                >
                    {showAddForm ? 'Cancel' : 'Add Medication'}
                </button>
            </div>

            {showAddForm && (
                <div className="medication-form-container">
                    <h3>{editingMed ? 'Edit Medication' : 'Add New Medication'}</h3>
                    <form onSubmit={handleSubmit} className="medication-form">
                        <div className="form-group">
                            <label htmlFor="name">Medication Name*</label>
                            <input
                                type="text"
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                required
                                placeholder="e.g., Sumatriptan"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="type">Type*</label>
                            <select
                                id="type"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                required
                            >
                                {medicationTypes.map(type => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="dosage">Dosage*</label>
                            <input
                                type="text"
                                id="dosage"
                                value={formData.dosage}
                                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                                required
                                placeholder="e.g., 100mg"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="frequency">Frequency*</label>
                            <input
                                type="text"
                                id="frequency"
                                value={formData.frequency}
                                onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                                required
                                placeholder="e.g., Once daily, As needed"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="startDate">Start Date*</label>
                            <input
                                type="date"
                                id="startDate"
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="endDate">End Date (if stopped)</label>
                            <input
                                type="date"
                                id="endDate"
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">Notes</label>
                            <textarea
                                id="notes"
                                value={formData.notes}
                                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                rows="3"
                                placeholder="Side effects, observations, etc."
                            />
                        </div>

                        <div className="form-buttons">
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                {editingMed ? 'Update' : 'Add'} Medication
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="medications-list">
                {medications.length === 0 ? (
                    <div className="empty-message">
                        <p>No medications tracked yet.</p>
                        <p>Add your first medication to start monitoring effectiveness.</p>
                    </div>
                ) : (
                    medications.map(med => {
                        const effectiveness = calculateEffectiveness(med);
                        const isActive = !med.endDate || new Date(med.endDate) >= new Date();
                        
                        return (
                            <div key={med.id} className={`medication-card ${!isActive ? 'inactive' : ''}`}>
                                <div className="medication-header">
                                    <h3>{med.name}</h3>
                                    <span className={`med-type ${med.type}`}>
                                        {med.type}
                                    </span>
                                </div>
                                
                                <div className="medication-details">
                                    <p><strong>Dosage:</strong> {med.dosage}</p>
                                    <p><strong>Frequency:</strong> {med.frequency}</p>
                                    <p><strong>Started:</strong> {new Date(med.startDate).toLocaleDateString()}</p>
                                    {med.endDate && (
                                        <p><strong>Ended:</strong> {new Date(med.endDate).toLocaleDateString()}</p>
                                    )}
                                    {med.notes && <p><strong>Notes:</strong> {med.notes}</p>}
                                </div>

                                {effectiveness && (
                                    <div className="effectiveness-section">
                                        <h4>Effectiveness Analysis</h4>
                                        <div className="effectiveness-stats">
                                            <div className="stat">
                                                <span className="stat-label">Frequency</span>
                                                <span className="stat-value">
                                                    {effectiveness.frequencyBefore} → {effectiveness.frequencyDuring} per month
                                                </span>
                                                <span className={`stat-change ${effectiveness.frequencyReduction > 0 ? 'positive' : 'negative'}`}>
                                                    {effectiveness.frequencyReduction > 0 ? '↓' : '↑'} 
                                                    {Math.abs(effectiveness.frequencyReduction)}%
                                                </span>
                                            </div>
                                            <div className="stat">
                                                <span className="stat-label">Avg Intensity</span>
                                                <span className="stat-value">
                                                    {effectiveness.avgIntensityBefore} → {effectiveness.avgIntensityDuring}
                                                </span>
                                                <span className={`stat-change ${effectiveness.intensityReduction > 0 ? 'positive' : 'negative'}`}>
                                                    {effectiveness.intensityReduction > 0 ? '↓' : '↑'} 
                                                    {Math.abs(effectiveness.intensityReduction)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="medication-actions">
                                    <button 
                                        className="btn btn-sm"
                                        onClick={() => handleEdit(med)}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleDelete(med.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default Medications;