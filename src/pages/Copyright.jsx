import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './Copyright.css';

const Copyright = () => {
  const { copyrightClaims, resolveCopyrightClaim, showToast } = useStore();
  const [activeTab, setActiveTab] = useState('Match tool');
  const [showTakedownModal, setShowTakedownModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const handleRequestRemoval = (claim) => {
    setSelectedClaim(claim);
    setShowTakedownModal(true);
  };

  const submitTakedown = () => {
    setShowTakedownModal(false);
    showToast("Simulated Copyright Takedown Request submitted!", "success");
  };

  return (
    <div className="dashboard-container copyright-page">
      <h1 className="dashboard-title">Channel copyright</h1>

      {/* Sub Tabs */}
      <div className="content-tabs">
        <button 
          className={`tab ${activeTab === 'Match tool' ? 'active' : ''}`}
          onClick={() => setActiveTab('Match tool')}
        >
          Match tool ({copyrightClaims.length})
        </button>
        <button 
          className={`tab ${activeTab === 'Removal requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('Removal requests')}
        >
          Removal requests (0)
        </button>
        <button 
          className={`tab ${activeTab === 'Archive' ? 'active' : ''}`}
          onClick={() => setActiveTab('Archive')}
        >
          Archive
        </button>
      </div>

      {activeTab === 'Match tool' && (
        <div className="table-container">
          <table className="content-table">
            <thead>
              <tr>
                <th className="video-col">Your Video</th>
                <th>Matching Video</th>
                <th>Channel</th>
                <th>Match %</th>
                <th>Segment</th>
                <th>Date detected</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {copyrightClaims.map(claim => (
                <tr key={claim.id} className="video-row">
                  <td className="video-col">
                    <div className="video-cell">
                      <span className="material-symbols-outlined cr-ic">copyright</span>
                      <div className="video-info">
                        <span className="video-title-link">{claim.videoTitle}</span>
                      </div>
                    </div>
                  </td>
                  <td>{claim.matchingVideo}</td>
                  <td>{claim.matchingChannel}</td>
                  <td>
                    <span className="match-badge">{claim.matchPercentage} match</span>
                  </td>
                  <td>{claim.matchedSegment}</td>
                  <td>{claim.detectedDate}</td>
                  <td>
                    <div className="cr-actions">
                      <button className="cr-action-btn" onClick={() => resolveCopyrightClaim(claim.id)} title="Archive claim">
                        ARCHIVE
                      </button>
                      <button className="cr-action-btn primary" onClick={() => handleRequestRemoval(claim)}>
                        REQUEST REMOVAL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Removal requests' && (
        <div className="empty-state-box">
          <span className="material-symbols-outlined empty-ic">gavel</span>
          <p>You haven't submitted any copyright removal requests yet.</p>
        </div>
      )}

      {activeTab === 'Archive' && (
        <div className="empty-state-box">
          <span className="material-symbols-outlined empty-ic">archive</span>
          <p>No archived copyright claims.</p>
        </div>
      )}

      {/* Simulated Copyright Removal Modal */}
      {showTakedownModal && selectedClaim && (
        <div className="modal-overlay">
          <div className="takedown-modal">
            <div className="modal-header">
              <h2>Request Video Removal</h2>
              <button className="close-btn" onClick={() => setShowTakedownModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="takedown-modal-body">
              <p><strong>Target Video:</strong> {selectedClaim.matchingVideo} ({selectedClaim.matchingChannel})</p>
              <p><strong>Matched Segment:</strong> {selectedClaim.matchedSegment} ({selectedClaim.matchPercentage} match with your video)</p>
              
              <div className="form-group mt-3">
                <label>Type of Removal</label>
                <select className="form-select">
                  <option value="scheduled">Standard: Send 7-day notice before takedown</option>
                  <option value="urgent">Urgent: Request immediate removal (DMCA simulation)</option>
                </select>
              </div>

              <div className="form-group mt-3">
                <label>Copyright Owner Full Legal Name</label>
                <input type="text" className="form-input" defaultValue="TechCraft Studios Legal Team" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="prev-btn" onClick={() => setShowTakedownModal(false)}>CANCEL</button>
              <button className="save-btn" onClick={submitTakedown}>SUBMIT TAKEDOWN REQUEST</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Copyright;
