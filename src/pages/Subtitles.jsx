import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import SubtitleEditorModal from '../components/SubtitleEditorModal';
import './Subtitles.css';

const Subtitles = () => {
  const { subtitles, showToast } = useStore();
  const [filterText, setFilterText] = useState('');
  const [editingSub, setEditingSub] = useState(null);

  const filteredSubs = subtitles.filter(s => s.videoTitle.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <div className="dashboard-container subtitles-page">
      <h1 className="dashboard-title">Channel subtitles</h1>

      {/* Filter Bar */}
      <div className="content-filters">
        <div className="filter-search-box">
          <span className="material-symbols-outlined filter-icon">filter_list</span>
          <input 
            type="text" 
            placeholder="Filter videos..." 
            className="filter-input"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
      </div>

      {/* Subtitles Table */}
      <div className="table-container">
        <table className="content-table">
          <thead>
            <tr>
              <th className="video-col">Video</th>
              <th>Languages</th>
              <th>Modified date</th>
              <th>Title & description</th>
              <th>Subtitles status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubs.map(sub => (
              <tr key={sub.id} className="video-row">
                <td className="video-col">
                  <div className="video-cell">
                    <span className="material-symbols-outlined sub-icon">subtitles</span>
                    <div className="video-info">
                      <span className="video-title-link">{sub.videoTitle}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="lang-chips">
                    {sub.languages.map((l, i) => (
                      <span key={i} className="lang-chip">{l}</span>
                    ))}
                  </div>
                </td>
                <td>{sub.date}</td>
                <td><span className="status-tag success">Published</span></td>
                <td><span className="status-tag success">{sub.status}</span></td>
                <td>
                  <button className="edit-sub-btn" onClick={() => setEditingSub(sub)}>
                    <span className="material-symbols-outlined">edit</span> EDIT
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingSub && (
        <SubtitleEditorModal 
          subtitle={editingSub} 
          onClose={() => setEditingSub(null)} 
        />
      )}
    </div>
  );
};

export default Subtitles;
