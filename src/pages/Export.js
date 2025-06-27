import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';
import dataService from '../services/dataService';
import authService from '../services/authService';
import { isFirebaseEnabled } from '../config/environment';
import storageService from '../services/storage';

function Export() {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportRange, setExportRange] = useState('all');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [exportFormat, setExportFormat] = useState('pdf');
    const [includeCharts, setIncludeCharts] = useState(true);

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
        let filtered = [...entries];
        const now = new Date();

        switch (exportRange) {
            case 'last30':
                const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                filtered = entries.filter(entry => new Date(entry.startDateTime) >= thirtyDaysAgo);
                break;
            case 'last90':
                const ninetyDaysAgo = new Date(now.setDate(now.getDate() - 90));
                filtered = entries.filter(entry => new Date(entry.startDateTime) >= ninetyDaysAgo);
                break;
            case 'lastYear':
                const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
                filtered = entries.filter(entry => new Date(entry.startDateTime) >= oneYearAgo);
                break;
            case 'custom':
                if (customStartDate && customEndDate) {
                    const start = new Date(customStartDate);
                    const end = new Date(customEndDate);
                    end.setHours(23, 59, 59, 999);
                    filtered = entries.filter(entry => {
                        const entryDate = new Date(entry.startDateTime);
                        return entryDate >= start && entryDate <= end;
                    });
                }
                break;
        }

        return filtered;
    };

    const generateSummaryStats = (data) => {
        if (data.length === 0) return null;

        const totalDays = Math.ceil((new Date() - new Date(data[data.length - 1].startDateTime)) / (1000 * 60 * 60 * 24));
        const avgPerMonth = (data.length / (totalDays / 30)).toFixed(1);
        
        const intensities = data.map(e => e.intensity);
        const avgIntensity = (intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(1);
        
        const durations = data.filter(e => e.duration).map(e => e.duration);
        const avgDuration = durations.length > 0 
            ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
            : 0;

        const triggerCounts = {};
        const symptomCounts = {};
        
        data.forEach(entry => {
            entry.triggers.forEach(trigger => {
                triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
            });
            entry.symptoms.forEach(symptom => {
                symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
            });
        });

        const topTriggers = Object.entries(triggerCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);
        
        const topSymptoms = Object.entries(symptomCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            totalMigraines: data.length,
            avgPerMonth,
            avgIntensity,
            avgDuration,
            topTriggers,
            topSymptoms
        };
    };

    const generatePDF = async () => {
        const filteredData = getFilteredEntries();
        const stats = generateSummaryStats(filteredData);
        
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.width;
        
        // Header
        pdf.setFontSize(20);
        pdf.text('Migraine Report', pageWidth / 2, 20, { align: 'center' });
        
        pdf.setFontSize(12);
        const dateRange = exportRange === 'all' 
            ? 'All Time' 
            : exportRange === 'custom' 
                ? `${customStartDate} to ${customEndDate}`
                : exportRange === 'last30' ? 'Last 30 Days' 
                : exportRange === 'last90' ? 'Last 90 Days' 
                : 'Last Year';
        pdf.text(`Report Period: ${dateRange}`, pageWidth / 2, 30, { align: 'center' });
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 36, { align: 'center' });
        
        // Summary Stats
        if (stats) {
            let yPos = 50;
            pdf.setFontSize(16);
            pdf.text('Summary Statistics', 14, yPos);
            
            pdf.setFontSize(11);
            yPos += 10;
            pdf.text(`Total Migraines: ${stats.totalMigraines}`, 14, yPos);
            yPos += 6;
            pdf.text(`Average per Month: ${stats.avgPerMonth}`, 14, yPos);
            yPos += 6;
            pdf.text(`Average Intensity: ${stats.avgIntensity}/10`, 14, yPos);
            yPos += 6;
            const hours = Math.floor(stats.avgDuration / 60);
            const mins = stats.avgDuration % 60;
            pdf.text(`Average Duration: ${hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}`, 14, yPos);
            
            // Top Triggers
            yPos += 12;
            pdf.setFontSize(14);
            pdf.text('Most Common Triggers', 14, yPos);
            pdf.setFontSize(11);
            yPos += 8;
            stats.topTriggers.forEach(([trigger, count]) => {
                pdf.text(`• ${trigger} (${count} occurrences)`, 18, yPos);
                yPos += 6;
            });
            
            // Top Symptoms
            yPos += 6;
            pdf.setFontSize(14);
            pdf.text('Most Common Symptoms', 14, yPos);
            pdf.setFontSize(11);
            yPos += 8;
            stats.topSymptoms.forEach(([symptom, count]) => {
                pdf.text(`• ${symptom} (${count} occurrences)`, 18, yPos);
                yPos += 6;
            });
        }
        
        // Detailed Entries Table
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Detailed Migraine Log', 14, 20);
        
        const tableColumns = ['Date', 'Duration', 'Intensity', 'Location', 'Triggers'];
        const tableRows = filteredData.map(entry => {
            const date = new Date(entry.startDateTime).toLocaleDateString();
            const duration = entry.duration 
                ? `${Math.floor(entry.duration / 60)}h ${entry.duration % 60}m`
                : 'N/A';
            return [
                date,
                duration,
                `${entry.intensity}/10`,
                entry.location || 'N/A',
                entry.triggers.join(', ') || 'None'
            ];
        });
        
        pdf.autoTable({
            head: [tableColumns],
            body: tableRows,
            startY: 30,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [74, 144, 226] }
        });
        
        // Save the PDF
        pdf.save(`migraine-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const generateCSV = () => {
        const filteredData = getFilteredEntries();
        
        const headers = [
            'Date',
            'Start Time',
            'End Time',
            'Duration (minutes)',
            'Intensity',
            'Location',
            'Symptoms',
            'Triggers',
            'Notes'
        ];
        
        const rows = filteredData.map(entry => {
            const startDate = new Date(entry.startDateTime);
            const endDate = entry.endDateTime ? new Date(entry.endDateTime) : null;
            
            return [
                startDate.toLocaleDateString(),
                startDate.toLocaleTimeString(),
                endDate ? endDate.toLocaleTimeString() : '',
                entry.duration || '',
                entry.intensity,
                entry.location || '',
                entry.symptoms.join('; '),
                entry.triggers.join('; '),
                entry.notes ? entry.notes.replace(/"/g, '""') : ''
            ];
        });
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `migraine-data-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateJSON = () => {
        const filteredData = getFilteredEntries();
        const stats = generateSummaryStats(filteredData);
        
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalEntries: filteredData.length,
                dateRange: {
                    start: filteredData.length > 0 ? filteredData[filteredData.length - 1].startDateTime : null,
                    end: filteredData.length > 0 ? filteredData[0].startDateTime : null
                }
            },
            summary: stats,
            entries: filteredData
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `migraine-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleExport = () => {
        switch (exportFormat) {
            case 'pdf':
                generatePDF();
                break;
            case 'csv':
                generateCSV();
                break;
            case 'json':
                generateJSON();
                break;
        }
    };

    const sendEmail = () => {
        const filteredData = getFilteredEntries();
        const stats = generateSummaryStats(filteredData);
        
        let emailBody = 'Migraine Report Summary\n\n';
        
        if (stats) {
            emailBody += `Total Migraines: ${stats.totalMigraines}\n`;
            emailBody += `Average per Month: ${stats.avgPerMonth}\n`;
            emailBody += `Average Intensity: ${stats.avgIntensity}/10\n`;
            const hours = Math.floor(stats.avgDuration / 60);
            const mins = stats.avgDuration % 60;
            emailBody += `Average Duration: ${hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}\n\n`;
            
            emailBody += 'Top Triggers:\n';
            stats.topTriggers.forEach(([trigger, count]) => {
                emailBody += `• ${trigger} (${count} occurrences)\n`;
            });
            
            emailBody += '\nTop Symptoms:\n';
            stats.topSymptoms.forEach(([symptom, count]) => {
                emailBody += `• ${symptom} (${count} occurrences)\n`;
            });
        }
        
        const mailtoLink = `mailto:?subject=Migraine Report&body=${encodeURIComponent(emailBody)}`;
        window.location.href = mailtoLink;
    };

    if (loading) {
        return <div className="loading">Loading export options...</div>;
    }

    return (
        <div className="export-page">
            <h2>Export Data</h2>
            
            <div className="export-options">
                <div className="export-section">
                    <h3>Date Range</h3>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                value="all"
                                checked={exportRange === 'all'}
                                onChange={(e) => setExportRange(e.target.value)}
                            />
                            All Time
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="last30"
                                checked={exportRange === 'last30'}
                                onChange={(e) => setExportRange(e.target.value)}
                            />
                            Last 30 Days
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="last90"
                                checked={exportRange === 'last90'}
                                onChange={(e) => setExportRange(e.target.value)}
                            />
                            Last 90 Days
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="lastYear"
                                checked={exportRange === 'lastYear'}
                                onChange={(e) => setExportRange(e.target.value)}
                            />
                            Last Year
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="custom"
                                checked={exportRange === 'custom'}
                                onChange={(e) => setExportRange(e.target.value)}
                            />
                            Custom Range
                        </label>
                    </div>
                    
                    {exportRange === 'custom' && (
                        <div className="custom-date-range">
                            <div className="form-group">
                                <label htmlFor="startDate">Start Date</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="endDate">End Date</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="export-section">
                    <h3>Export Format</h3>
                    <div className="radio-group">
                        <label>
                            <input
                                type="radio"
                                value="pdf"
                                checked={exportFormat === 'pdf'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            PDF Report (Doctor-friendly)
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="csv"
                                checked={exportFormat === 'csv'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            CSV (Spreadsheet)
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="json"
                                checked={exportFormat === 'json'}
                                onChange={(e) => setExportFormat(e.target.value)}
                            />
                            JSON (Full Data)
                        </label>
                    </div>
                </div>
                
                <div className="export-preview">
                    <h3>Preview</h3>
                    <p>{getFilteredEntries().length} entries will be exported</p>
                    {generateSummaryStats(getFilteredEntries()) && (
                        <div className="preview-stats">
                            <p>Average Intensity: {generateSummaryStats(getFilteredEntries()).avgIntensity}/10</p>
                            <p>Average per Month: {generateSummaryStats(getFilteredEntries()).avgPerMonth}</p>
                        </div>
                    )}
                </div>
                
                <div className="export-actions">
                    <button 
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={getFilteredEntries().length === 0}
                    >
                        Download {exportFormat.toUpperCase()}
                    </button>
                    <button 
                        className="btn btn-secondary"
                        onClick={sendEmail}
                        disabled={getFilteredEntries().length === 0}
                    >
                        Email Summary
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Export;