import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './VideoEditor.css';

const VideoEditor = ({ video }) => {
  const { showToast } = useStore();
  const [activeTool, setActiveTool] = useState('Trim');
  const [playhead, setPlayhead] = useState(25); // percentage
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSave = () => {
    showToast("Editor changes saved successfully!", "success");
  };

  return (
    <div className="video-editor-container">
      <div className="editor-top-bar">
        <div className="editor-tools">
          <button className={`tool-btn ${activeTool === 'Trim' ? 'active' : ''}`} onClick={() => setActiveTool('Trim')}>
            <span className="material-symbols-outlined">content_cut</span> Trim & cut
          </button>
          <button className={`tool-btn ${activeTool === 'Blur' ? 'active' : ''}`} onClick={() => setActiveTool('Blur')}>
            <span className="material-symbols-outlined">blur_on</span> Blur
          </button>
          <button className={`tool-btn ${activeTool === 'Audio' ? 'active' : ''}`} onClick={() => setActiveTool('Audio')}>
            <span className="material-symbols-outlined">music_note</span> Audio
          </button>
          <button className={`tool-btn ${activeTool === 'EndScreen' ? 'active' : ''}`} onClick={() => setActiveTool('EndScreen')}>
            <span className="material-symbols-outlined">featured_video</span> End screen
          </button>
        </div>
        <div className="editor-actions">
          <button className="editor-discard-btn" onClick={() => showToast("Discarded unsaved edits", "warning")}>DISCARD CHANGES</button>
          <button className="editor-save-btn" onClick={handleSave}>SAVE</button>
        </div>
      </div>

      <div className="editor-main-stage">
        <div className="editor-preview-wrapper">
          <img src={video.thumbnail} alt="Preview" className="editor-stage-video" />
          <button className="stage-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
            <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="editor-timeline-container">
        <div className="timeline-header">
          <div className="timeline-controls">
            <button onClick={() => setIsPlaying(!isPlaying)}>
              <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
            </button>
            <span className="timeline-time">05:12 / {video.duration || "24:18"}</span>
          </div>
          <div className="zoom-controls">
            <span className="material-symbols-outlined">zoom_out</span>
            <input type="range" min="1" max="100" defaultValue="50" className="zoom-slider" />
            <span className="material-symbols-outlined">zoom_in</span>
          </div>
        </div>

        {/* Timeline Tracks */}
        <div className="timeline-tracks">
          {/* Playhead bar */}
          <div className="timeline-playhead" style={{ left: `${playhead}%` }}></div>

          <div className="track-row video-track-row">
            <span className="track-label"><span className="material-symbols-outlined">movie</span> Video</span>
            <div className="track-content video-thumbnails-strip">
              <div className="thumb-strip-block" style={{ backgroundImage: `url(${video.thumbnail})` }}></div>
              <div className="thumb-strip-block" style={{ backgroundImage: `url(${video.thumbnail})` }}></div>
              <div className="thumb-strip-block" style={{ backgroundImage: `url(${video.thumbnail})` }}></div>
            </div>
          </div>

          <div className="track-row audio-track-row">
            <span className="track-label"><span className="material-symbols-outlined">audiotrack</span> Audio</span>
            <div className="track-content audio-waveform-bar">
              <div className="waveform-sim"></div>
            </div>
          </div>

          <div className="track-row element-track-row">
            <span className="track-label"><span className="material-symbols-outlined">branding_watermark</span> Elements</span>
            <div className="track-content element-bar">
              <span className="element-chip">End Screen - Subscribe Card</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
