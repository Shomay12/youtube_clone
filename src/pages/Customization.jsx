import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import './Customization.css';

const Customization = () => {
  const { channelInfo, updateChannelInfo } = useStore();
  const [formData, setFormData] = useState({ name: '', avatar: '' });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('Basic info');

  useEffect(() => {
    if (channelInfo) {
      setFormData({ name: channelInfo.name, avatar: channelInfo.avatar });
    }
  }, [channelInfo]);

  const hasChanges = channelInfo && (formData.name !== channelInfo.name || formData.avatar !== channelInfo.avatar);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      updateChannelInfo(formData);
      setSaving(false);
    }, 600);
  };

  const handleUndo = () => {
    setFormData({ name: channelInfo.name, avatar: channelInfo.avatar });
  };

  if (!channelInfo) return null;

  return (
    <div className="dashboard-container customization-page">
      <div className="video-details-header">
        <h1 className="dashboard-title">Channel customization</h1>
        <div className="header-actions">
          <button className="undo-btn" disabled={!hasChanges} onClick={handleUndo}>CANCEL</button>
          <button className="save-btn" disabled={!hasChanges || saving} onClick={handleSave}>
            {saving ? 'PUBLISHING...' : 'PUBLISH'}
          </button>
        </div>
      </div>

      <div className="content-tabs">
        <button 
          className={`tab ${activeTab === 'Layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('Layout')}
        >
          Layout
        </button>
        <button 
          className={`tab ${activeTab === 'Branding' ? 'active' : ''}`}
          onClick={() => setActiveTab('Branding')}
        >
          Branding
        </button>
        <button 
          className={`tab ${activeTab === 'Basic info' ? 'active' : ''}`}
          onClick={() => setActiveTab('Basic info')}
        >
          Basic info
        </button>
      </div>

      <div className="customization-content">
        {activeTab === 'Basic info' && (
          <div className="basic-info-panel">
            <div className="form-group">
              <label>Name</label>
              <p className="helper-text">Choose a channel name that represents you and your content. Changes made to your name and picture are visible only on YouTube and not other Google services.</p>
              <input 
                type="text" 
                className="form-input" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>
        )}

        {activeTab === 'Branding' && (
          <div className="branding-panel">
            <div className="branding-section">
              <div className="branding-info">
                <h3>Picture</h3>
                <p className="helper-text">Your profile picture will appear where your channel is presented on YouTube, like next to your videos and comments.</p>
                <p className="helper-text">It's recommended to use a picture that's at least 98 x 98 pixels and 4MB or less. Use a PNG or GIF (no animations) file.</p>
              </div>
              <div className="branding-preview">
                <img src={formData.avatar} alt="Avatar Preview" className="avatar-preview-lg" />
                <div className="branding-actions">
                  <input 
                    type="text" 
                    className="form-input avatar-url-input" 
                    placeholder="Enter image URL"
                    value={formData.avatar}
                    onChange={(e) => setFormData({...formData, avatar: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Layout' && (
          <div className="layout-panel">
            <p className="helper-text">Customize the layout of your channel homepage with up to 12 sections.</p>
            <div className="placeholder-box">
              <span className="material-symbols-outlined">construction</span>
              <p>Layout builder coming soon...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customization;
