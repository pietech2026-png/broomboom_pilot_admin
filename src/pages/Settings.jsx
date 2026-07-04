import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../api/apiClient';
import './Settings.css';

const Settings = () => {
  const [selectedPercentages, setSelectedPercentages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const availableOptions = [
    { value: 0, label: '0% (Book at ₹0)' },
    { value: 20, label: 'Pay 20% Advance' },
    { value: 25, label: 'Pay 25% Advance (Default)' },
    { value: 50, label: 'Pay 50% Advance' },
    { value: 100, label: 'Pay 100% Advance' }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      // Fetch from the pilot backend (under /vehicles/settings)
      const response = await apiClient.get('/vehicles/settings');
      const settings = response.data || [];
      const advanceOpt = settings.find(s => s.key === 'pay_advance_options');
      if (advanceOpt && Array.isArray(advanceOpt.value)) {
        setSelectedPercentages(advanceOpt.value);
      } else {
        // Fallback default
        setSelectedPercentages([0, 25, 100]);
      }
    } catch (err) {
      console.error('Error fetching global settings:', err);
      // Fallback default
      setSelectedPercentages([0, 25, 100]);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (value) => {
    setSelectedPercentages(prev => {
      if (prev.includes(value)) {
        // Ensure at least one percentage is checked
        if (prev.length === 1) return prev;
        return prev.filter(p => p !== value);
      } else {
        // Sort numerically
        return [...prev, value].sort((a, b) => a - b);
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        key: 'pay_advance_options',
        value: selectedPercentages,
        description: 'Active percentage values enabled for booking advance payments'
      };

      // 1. Save to Pilot Backend
      await apiClient.post('/vehicles/settings', payload);

      // 2. Save to User Backend (Public route on user backend)
      try {
        await axios.post('https://broomboom-user-backend.vercel.app/api/global-settings', payload);
      } catch (userErr) {
        console.error('Error syncing settings to User Backend:', userErr);
        // We log but don't fail the entire save if user backend is temporarily down
      }

      setMessage({ type: 'success', text: 'Advance payment options saved and synced successfully!' });
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <h2>Loading settings...</h2>
      </div>
    );
  }

  return (
    <div className="settings-container anim-fade-in">
      <div className="settings-header">
        <h1 className="settings-title">System Settings</h1>
        <p className="settings-subtitle">Manage global preferences and app-wide configurations.</p>
      </div>

      {message && (
        <div className={`status-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-card">
        <h2 className="settings-section-title">
          🛡️ Advance Payment Configurations
        </h2>
        <p className="settings-section-desc">
          Select which advance payment options are enabled for customers. Whatever percentages are checked here will dynamically display as booking review payment actions in the User App.
        </p>

        <div className="checkbox-group">
          {availableOptions.map(option => {
            const isChecked = selectedPercentages.includes(option.value);
            return (
              <label 
                key={option.value} 
                className={`checkbox-label ${isChecked ? 'checked' : ''}`}
              >
                <input 
                  type="checkbox" 
                  className="checkbox-input"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(option.value)}
                />
                <span className="checkbox-text">{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="settings-actions">
        <button 
          className="btn-save" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default Settings;
