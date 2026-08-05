import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './SubtitleEditorModal.css';

const SubtitleEditorModal = ({ subtitle, onClose }) => {
  const { showToast, updateSubtitles } = useStore();
  const [selectedLang, setSelectedLang] = useState('English');
  const [captions, setCaptions] = useState([
    { id: 1, start: '00:00:00', end: '00:00:04', text: 'Welcome back to TechCraft Studios!' },
    { id: 2, start: '00:00:04', end: '00:00:09', text: 'Today we are building an autonomous AI agent.' },
    { id: 3, start: '00:00:09', end: '00:00:15', text: 'Let us connect it to our live systems now.' }
  ]);

  const handleAddRow = () => {
    setCaptions([
      ...captions,
      { id: Date.now(), start: '00:00:15', end: '00:00:20', text: 'New subtitle caption row...' }
    ]);
  };

  const handleDeleteRow = (id) => {
    setCaptions(captions.filter(c => c.id !== id));
  };

  const handlePublish = () => {
    showToast(`Subtitles published for ${selectedLang}`, "success");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="sub-editor-modal">
        <div className="modal-header">
          <h2>Subtitle Editor - {subtitle.videoTitle}</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="sub-editor-body">
          <div className="sub-controls-bar">
            <select value={selectedLang} onChange={(e) => setSelectedLang(e.target.value)} className="form-select">
              <option value="English">English (Original)</option>
              <option value="Spanish">Spanish</option>
              <option value="Hindi">Hindi</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
            </select>
            <button className="add-row-btn" onClick={handleAddRow}>
              <span className="material-symbols-outlined">add</span> Add Caption Row
            </button>
          </div>

          <div className="captions-table-wrapper">
            <table className="captions-table">
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Start</th>
                  <th style={{ width: '120px' }}>End</th>
                  <th>Caption Text</th>
                  <th style={{ width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {captions.map(c => (
                  <tr key={c.id}>
                    <td>
                      <input 
                        type="text" 
                        value={c.start} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setCaptions(captions.map(row => row.id === c.id ? { ...row, start: val } : row));
                        }} 
                        className="sub-input-sm" 
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={c.end} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setCaptions(captions.map(row => row.id === c.id ? { ...row, end: val } : row));
                        }} 
                        className="sub-input-sm" 
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        value={c.text} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setCaptions(captions.map(row => row.id === c.id ? { ...row, text: val } : row));
                        }} 
                        className="sub-input-full" 
                      />
                    </td>
                    <td>
                      <button className="del-row-btn" onClick={() => handleDeleteRow(c.id)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button className="prev-btn" onClick={onClose}>CANCEL</button>
          <button className="save-btn" onClick={handlePublish}>PUBLISH SUBTITLES</button>
        </div>
      </div>
    </div>
  );
};

export default SubtitleEditorModal;
