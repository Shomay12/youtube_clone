import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './SettingsModal.css';

const SettingsModal = ({ onClose }) => {
  const { settings, updateSettings, refreshSpreadsheet, showToast } = useStore();
  const [activeTab, setActiveTab] = useState('General');
  const [formData, setFormData] = useState({ ...settings });

  const handleSave = () => {
    updateSettings(formData);
    showToast("Settings updated successfully", "success");
    onClose();
  };

  const handleRefreshSpreadsheet = () => {
    refreshSpreadsheet();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="settings-modal">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="settings-modal-body">
          {/* Settings Sub-Sidebar */}
          <div className="settings-nav">
            {['General', 'Channel', 'Upload defaults', 'Permissions', 'Community', 'Agreements'].map(tab => (
              <div 
                key={tab} 
                className={`settings-nav-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </div>
            ))}
          </div>

          {/* Settings Content Area */}
          <div className="settings-tab-content">
            {activeTab === 'General' && (
              <div className="settings-panel">
                <h3>Default units</h3>
                <div className="form-group mt-3">
                  <label>Currency</label>
                  <select 
                    className="form-select" 
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  >
                    <option value="USD ($)">USD - US Dollar ($)</option>
                    <option value="EUR (€)">EUR - Euro (€)</option>
                    <option value="GBP (£)">GBP - British Pound (£)</option>
                    <option value="INR (₹)">INR - Indian Rupee (₹)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'Channel' && (
              <div className="settings-panel">
                <h3>Basic info</h3>
                <div className="form-group mt-3">
                  <label>Country of residence</label>
                  <select 
                    className="form-select"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                  >
                    <option value="United States">United States</option>
                    <option value="India">India</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="form-group mt-3">
                  <label>Keywords (comma separated)</label>
                  <textarea 
                    className="form-textarea" 
                    rows="4" 
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                  />
                </div>
              </div>
            )}

            {activeTab === 'Upload defaults' && (
              <div className="settings-panel">
                <h3>Basic info</h3>
                <div className="form-group mt-3">
                  <label>Default Visibility</label>
                  <select 
                    className="form-select"
                    value={formData.uploadDefaultVisibility}
                    onChange={(e) => setFormData({...formData, uploadDefaultVisibility: e.target.value})}
                  >
                    <option value="Public">Public</option>
                    <option value="Unlisted">Unlisted</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'Community' && (
              <div className="settings-panel">
                <h3>Automated Filters</h3>
                <div className="form-group mt-3">
                  <label>Blocked Words</label>
                  <textarea 
                    className="form-textarea" 
                    rows="4" 
                    value={formData.blockedWords}
                    onChange={(e) => setFormData({...formData, blockedWords: e.target.value})}
                  />
                </div>
              </div>
            )}

            {['Permissions', 'Agreements'].includes(activeTab) && (
              <div className="settings-panel">
                <h3>{activeTab}</h3>
                <p className="text-secondary mt-3">All permissions & agreements are active and compliant with YouTube Partner Program standards.</p>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer settings-footer">
          <button className="reset-demo-btn" onClick={handleRefreshSpreadsheet}>
            <span className="material-symbols-outlined">refresh</span> REFRESH SPREADSHEET
          </button>
          <div className="right-footer">
            <button className="prev-btn" onClick={onClose}>CANCEL</button>
            <button className="save-btn" onClick={handleSave}>SAVE</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
