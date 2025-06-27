import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { Line, Bar, Doughnut, Scatter } from 'react-chartjs-2';
import dataService from '../services/dataService';
import authService from '../services/authService';
import { isFirebaseEnabled } from '../config/environment';
import storageService from '../services/storage';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

function Analytics() {
    const [entries, setEntries] = useState([]);
    const [timeRange, setTimeRange] = useState('30');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            let data = [];
            if (isFirebaseEnabled() && authService.isAuthenticated()) {
                data = await dataService.getMigraines();
            } else {
                data = storageService.getAllEntries();
            }
            setEntries(data.sort((a, b) => new Date(b.startDateTime) - new Date(a.startDateTime)));
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredEntries = () => {
        const now = new Date();
        const daysAgo = new Date(now.setDate(now.getDate() - parseInt(timeRange)));
        return entries.filter(entry => new Date(entry.startDateTime) >= daysAgo);
    };

    const getCalendarData = () => {
        const filtered = getFilteredEntries();
        const calendarData = {};
        
        filtered.forEach(entry => {
            const date = new Date(entry.startDateTime).toISOString().split('T')[0];
            if (!calendarData[date]) {
                calendarData[date] = {
                    count: 0,
                    totalIntensity: 0,
                    maxIntensity: 0
                };
            }
            calendarData[date].count++;
            calendarData[date].totalIntensity += entry.intensity;
            calendarData[date].maxIntensity = Math.max(calendarData[date].maxIntensity, entry.intensity);
        });

        return calendarData;
    };

    const getFrequencyChartData = () => {
        const filtered = getFilteredEntries();
        const dailyCounts = {};
        
        filtered.forEach(entry => {
            const date = new Date(entry.startDateTime).toISOString().split('T')[0];
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        });

        const sortedDates = Object.keys(dailyCounts).sort();
        
        return {
            labels: sortedDates,
            datasets: [{
                label: 'Migraines per Day',
                data: sortedDates.map(date => dailyCounts[date]),
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4
            }]
        };
    };

    const getIntensityPatternData = () => {
        const filtered = getFilteredEntries();
        const hourlyIntensity = Array(24).fill(null).map(() => []);
        
        filtered.forEach(entry => {
            const hour = new Date(entry.startDateTime).getHours();
            hourlyIntensity[hour].push(entry.intensity);
        });

        const avgIntensity = hourlyIntensity.map(intensities => 
            intensities.length > 0 
                ? intensities.reduce((a, b) => a + b, 0) / intensities.length 
                : 0
        );

        return {
            labels: Array(24).fill(null).map((_, i) => `${i}:00`),
            datasets: [{
                label: 'Average Intensity by Hour',
                data: avgIntensity,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4
            }]
        };
    };

    const getTriggerCorrelationData = () => {
        const filtered = getFilteredEntries();
        const triggerData = {};
        
        filtered.forEach(entry => {
            entry.triggers.forEach(trigger => {
                if (!triggerData[trigger]) {
                    triggerData[trigger] = {
                        count: 0,
                        totalIntensity: 0,
                        intensities: []
                    };
                }
                triggerData[trigger].count++;
                triggerData[trigger].totalIntensity += entry.intensity;
                triggerData[trigger].intensities.push(entry.intensity);
            });
        });

        const triggers = Object.keys(triggerData);
        const avgIntensities = triggers.map(trigger => 
            triggerData[trigger].totalIntensity / triggerData[trigger].count
        );

        return {
            labels: triggers,
            datasets: [{
                label: 'Average Intensity by Trigger',
                data: avgIntensities,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ]
            }]
        };
    };

    const getSymptomDistributionData = () => {
        const filtered = getFilteredEntries();
        const symptomCounts = {};
        
        filtered.forEach(entry => {
            entry.symptoms.forEach(symptom => {
                symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
            });
        });

        return {
            labels: Object.keys(symptomCounts),
            datasets: [{
                label: 'Symptom Frequency',
                data: Object.values(symptomCounts),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)',
                    'rgba(255, 159, 64, 0.6)'
                ]
            }]
        };
    };

    const getDurationAnalysisData = () => {
        const filtered = getFilteredEntries();
        const durationByIntensity = {};
        
        filtered.forEach(entry => {
            if (entry.duration) {
                const intensity = entry.intensity;
                if (!durationByIntensity[intensity]) {
                    durationByIntensity[intensity] = [];
                }
                durationByIntensity[intensity].push(entry.duration);
            }
        });

        const scatterData = [];
        Object.entries(durationByIntensity).forEach(([intensity, durations]) => {
            durations.forEach(duration => {
                scatterData.push({
                    x: parseInt(intensity),
                    y: duration / 60
                });
            });
        });

        return {
            datasets: [{
                label: 'Duration vs Intensity',
                data: scatterData,
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }]
        };
    };

    const getAdvancedStats = () => {
        const filtered = getFilteredEntries();
        
        const stats = {
            avgPerWeek: 0,
            medianIntensity: 0,
            peakHour: '--',
            longestStreak: 0,
            currentStreak: 0,
            daysWithoutMigraine: 0
        };

        if (filtered.length === 0) return stats;

        const weeksDiff = parseInt(timeRange) / 7;
        stats.avgPerWeek = (filtered.length / weeksDiff).toFixed(1);

        const intensities = filtered.map(e => e.intensity).sort((a, b) => a - b);
        const mid = Math.floor(intensities.length / 2);
        stats.medianIntensity = intensities.length % 2 === 0
            ? (intensities[mid - 1] + intensities[mid]) / 2
            : intensities[mid];

        const hourCounts = Array(24).fill(0);
        filtered.forEach(entry => {
            const hour = new Date(entry.startDateTime).getHours();
            hourCounts[hour]++;
        });
        const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
        stats.peakHour = `${maxHour}:00 - ${maxHour + 1}:00`;

        const sortedDates = filtered
            .map(e => new Date(e.startDateTime).toISOString().split('T')[0])
            .sort()
            .filter((date, index, array) => array.indexOf(date) === index);

        let currentStreak = 1;
        let maxStreak = 1;
        
        for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
                currentStreak++;
                maxStreak = Math.max(maxStreak, currentStreak);
            } else {
                currentStreak = 1;
            }
        }
        
        stats.longestStreak = maxStreak;

        const lastEntryDate = new Date(filtered[0].startDateTime);
        const today = new Date();
        stats.daysWithoutMigraine = Math.floor((today - lastEntryDate) / (1000 * 60 * 60 * 24));

        return stats;
    };

    if (loading) {
        return <div className="loading">Loading analytics...</div>;
    }

    const advancedStats = getAdvancedStats();

    return (
        <div className="analytics-page">
            <h2>Analytics Dashboard</h2>
            
            <div className="analytics-controls">
                <div className="time-range-selector">
                    <label>Time Range:</label>
                    <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
                
                <div className="tab-selector">
                    <button 
                        className={activeTab === 'overview' ? 'active' : ''}
                        onClick={() => setActiveTab('overview')}
                    >
                        Overview
                    </button>
                    <button 
                        className={activeTab === 'patterns' ? 'active' : ''}
                        onClick={() => setActiveTab('patterns')}
                    >
                        Patterns
                    </button>
                    <button 
                        className={activeTab === 'correlations' ? 'active' : ''}
                        onClick={() => setActiveTab('correlations')}
                    >
                        Correlations
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="analytics-overview">
                    <div className="advanced-stats-grid">
                        <div className="stat-card">
                            <h4>Average per Week</h4>
                            <p className="stat-value">{advancedStats.avgPerWeek}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Median Intensity</h4>
                            <p className="stat-value">{advancedStats.medianIntensity}/10</p>
                        </div>
                        <div className="stat-card">
                            <h4>Peak Hour</h4>
                            <p className="stat-value">{advancedStats.peakHour}</p>
                        </div>
                        <div className="stat-card">
                            <h4>Longest Streak</h4>
                            <p className="stat-value">{advancedStats.longestStreak} days</p>
                        </div>
                        <div className="stat-card">
                            <h4>Days Without Migraine</h4>
                            <p className="stat-value">{advancedStats.daysWithoutMigraine}</p>
                        </div>
                    </div>

                    <div className="chart-container">
                        <h3>Frequency Trend</h3>
                        <Line 
                            data={getFrequencyChartData()} 
                            options={{
                                responsive: true,
                                scales: {
                                    x: {
                                        type: 'category',
                                        title: {
                                            display: true,
                                            text: 'Date'
                                        }
                                    },
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            stepSize: 1
                                        }
                                    }
                                }
                            }}
                        />
                    </div>

                    <div className="chart-grid">
                        <div className="chart-container">
                            <h3>Symptom Distribution</h3>
                            <Doughnut data={getSymptomDistributionData()} />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'patterns' && (
                <div className="analytics-patterns">
                    <div className="chart-container">
                        <h3>Intensity Patterns by Time of Day</h3>
                        <Line 
                            data={getIntensityPatternData()}
                            options={{
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 10
                                    }
                                }
                            }}
                        />
                    </div>

                    <div className="chart-container">
                        <h3>Duration vs Intensity Analysis</h3>
                        <Scatter 
                            data={getDurationAnalysisData()}
                            options={{
                                responsive: true,
                                scales: {
                                    x: {
                                        title: {
                                            display: true,
                                            text: 'Intensity'
                                        },
                                        min: 0,
                                        max: 10
                                    },
                                    y: {
                                        title: {
                                            display: true,
                                            text: 'Duration (hours)'
                                        },
                                        beginAtZero: true
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'correlations' && (
                <div className="analytics-correlations">
                    <div className="chart-container">
                        <h3>Trigger Correlation with Intensity</h3>
                        <Bar 
                            data={getTriggerCorrelationData()}
                            options={{
                                responsive: true,
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        max: 10,
                                        title: {
                                            display: true,
                                            text: 'Average Intensity'
                                        }
                                    }
                                }
                            }}
                        />
                    </div>

                    <div className="correlation-insights">
                        <h3>Key Insights</h3>
                        {(() => {
                            const triggerData = getTriggerCorrelationData();
                            if (triggerData.labels.length === 0) {
                                return <p>No trigger data available for analysis.</p>;
                            }
                            
                            const maxIndex = triggerData.datasets[0].data.indexOf(
                                Math.max(...triggerData.datasets[0].data)
                            );
                            const minIndex = triggerData.datasets[0].data.indexOf(
                                Math.min(...triggerData.datasets[0].data)
                            );
                            
                            return (
                                <ul>
                                    <li>
                                        Most severe trigger: <strong>{triggerData.labels[maxIndex]}</strong> 
                                        (avg intensity: {triggerData.datasets[0].data[maxIndex].toFixed(1)})
                                    </li>
                                    <li>
                                        Least severe trigger: <strong>{triggerData.labels[minIndex]}</strong> 
                                        (avg intensity: {triggerData.datasets[0].data[minIndex].toFixed(1)})
                                    </li>
                                </ul>
                            );
                        })()}
                    </div>
                </div>
            )}

            {entries.length === 0 && (
                <div className="empty-message">
                    <p>No migraine data available for analysis.</p>
                    <p>Start tracking your migraines to see detailed analytics.</p>
                </div>
            )}
        </div>
    );
}

export default Analytics;