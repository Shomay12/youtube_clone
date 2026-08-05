import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './UploadModal.css';

const UploadModal = ({ onClose }) => {
  const { addVideo, playlists, showToast } = useStore();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80');
  const [playlist, setPlaylist] = useState('AI Experiments');
  const [visibility, setVisibility] = useState('Public');

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handlePublish = () => {
    setUploading(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          addVideo({
            title: title.trim() || "Untitled Video",
            description: description.trim() || "Uploaded via YouTube Studio Simulator",
            thumbnail,
            playlist,
            visibility
          });
          showToast(`"${title || 'New Video'}" published to your channel!`, "success");
          onClose();
        }, 500);
      }
    }, 150);
  };

  const isLastStep = step === 4;

  return (
    <div className="modal-overlay">
      <div className="upload-modal">
        <div className="modal-header">
          <h2>{uploading ? 'Uploading and processing...' : title || 'Upload video'}</h2>
          <button className="close-btn" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="modal-content">
          {!uploading && (
            <div className="stepper">
              <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Details</div>
              <div className="step-divider"></div>
              <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Video elements</div>
              <div className="step-divider"></div>
              <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Checks</div>
              <div className="step-divider"></div>
              <div className={`step ${step >= 4 ? 'active' : ''}`}>4. Visibility</div>
            </div>
          )}

          <div className="step-content">
            {uploading ? (
              <div className="upload-progress-container">
                <p>Uploading video file... {progress}%</p>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="notif-time mt-3">HD processing will begin automatically</p>
              </div>
            ) : (
              <>
                {step === 1 && (
                  <div className="step-panel details-step">
                    <div className="form-group">
                      <label>Title (required)</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Add a title that describes your video"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        className="form-textarea" 
                        rows="3" 
                        placeholder="Tell viewers about your video"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Thumbnail URL</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={thumbnail}
                        onChange={(e) => setThumbnail(e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Playlist</label>
                      <select 
                        className="form-select"
                        value={playlist}
                        onChange={(e) => setPlaylist(e.target.value)}
                      >
                        {playlists.map(p => (
                          <option key={p.id} value={p.title}>{p.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                {step === 2 && (
                  <div className="step-panel">
                    <h3>Video Elements</h3>
                    <p className="text-secondary mt-3">Add subtitles, cards, and an end screen to engage viewers during playback.</p>
                    <div className="element-option-box mt-3">
                      <span className="material-symbols-outlined">subtitles</span>
                      <div>
                        <strong>Add subtitles</strong>
                        <p className="text-secondary">Reach wider audiences by adding captions</p>
                      </div>
                      <button className="create-btn" onClick={() => showToast("Subtitles added", "info")}>ADD</button>
                    </div>
                  </div>
                )}
                {step === 3 && (
                  <div className="step-panel">
                    <h3>Automated Checks Complete</h3>
                    <p className="text-secondary">We checked your video for copyright issues and ad suitability.</p>
                    <p className="success-text mt-3"><span className="material-symbols-outlined">check_circle</span> Copyright: No issues found</p>
                    <p className="success-text mt-3"><span className="material-symbols-outlined">check_circle</span> Ad suitability: Suitable for monetization</p>
                  </div>
                )}
                {step === 4 && (
                  <div className="step-panel visibility-step">
                    <h3>Save or Publish</h3>
                    <p className="text-secondary">Make your video public, unlisted, or private</p>
                    <div className="radio-group">
                      <label><input type="radio" name="vis" checked={visibility === 'Public'} onChange={() => setVisibility('Public')} /> Public</label>
                      <label><input type="radio" name="vis" checked={visibility === 'Unlisted'} onChange={() => setVisibility('Unlisted')} /> Unlisted</label>
                      <label><input type="radio" name="vis" checked={visibility === 'Private'} onChange={() => setVisibility('Private')} /> Private</label>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div className="left-footer">
            <span className="material-symbols-outlined">upload</span>
            <span className="footer-text">Checks complete • Draft saved</span>
          </div>
          <div className="right-footer">
            {step > 1 && !uploading && (
              <button className="prev-btn" onClick={handlePrev}>BACK</button>
            )}
            {!isLastStep && !uploading && (
              <button className="next-btn" onClick={handleNext}>NEXT</button>
            )}
            {isLastStep && !uploading && (
              <button className="save-btn" onClick={handlePublish}>PUBLISH</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
