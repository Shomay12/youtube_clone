import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import './AudioLibrary.css';

const AudioLibrary = () => {
  const { audioTracks, toggleStarAudioTrack, showToast } = useStore();
  const [activeTab, setActiveTab] = useState('Free music');
  const [filterText, setFilterText] = useState('');
  const [genreFilter, setGenreFilter] = useState('All');

  // Currently playing track state
  const [playingTrack, setPlayingTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  let filteredTracks = audioTracks;
  if (activeTab === 'Free music') filteredTracks = audioTracks.filter(t => t.type === 'music');
  else if (activeTab === 'Sound effects') filteredTracks = audioTracks.filter(t => t.type === 'sfx');
  else if (activeTab === 'Starred') filteredTracks = audioTracks.filter(t => t.starred);

  if (filterText.trim()) {
    filteredTracks = filteredTracks.filter(t => 
      t.title.toLowerCase().includes(filterText.toLowerCase()) || 
      t.artist.toLowerCase().includes(filterText.toLowerCase())
    );
  }

  if (genreFilter !== 'All') {
    filteredTracks = filteredTracks.filter(t => t.genre === genreFilter);
  }

  const handlePlayPause = (track) => {
    if (playingTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingTrack(track);
      setIsPlaying(true);
    }
  };

  const handleDownload = (title) => {
    showToast(`Downloaded "${title}" to your computer`, "success");
  };

  return (
    <div className="dashboard-container audio-library-page">
      <h1 className="dashboard-title">Audio library</h1>

      {/* Sub Tabs */}
      <div className="content-tabs">
        <button 
          className={`tab ${activeTab === 'Free music' ? 'active' : ''}`}
          onClick={() => setActiveTab('Free music')}
        >
          Free music
        </button>
        <button 
          className={`tab ${activeTab === 'Sound effects' ? 'active' : ''}`}
          onClick={() => setActiveTab('Sound effects')}
        >
          Sound effects
        </button>
        <button 
          className={`tab ${activeTab === 'Starred' ? 'active' : ''}`}
          onClick={() => setActiveTab('Starred')}
        >
          Starred ({audioTracks.filter(t => t.starred).length})
        </button>
      </div>

      {/* Filters */}
      <div className="content-filters">
        <div className="filter-search-box">
          <span className="material-symbols-outlined filter-icon">filter_list</span>
          <input 
            type="text" 
            placeholder="Search audio library..." 
            className="filter-input"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
          />
        </div>
        <select 
          className="visibility-filter-select"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
        >
          <option value="All">All Genres</option>
          <option value="Electronic">Electronic</option>
          <option value="Ambient">Ambient</option>
          <option value="Hip Hop">Hip Hop</option>
          <option value="Cinematic">Cinematic</option>
          <option value="Lo-Fi">Lo-Fi</option>
        </select>
      </div>

      {/* Tracks Table */}
      <div className="table-container pb-player">
        <table className="content-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}></th>
              <th style={{ width: '40px' }}></th>
              <th>Track title</th>
              <th>Genre</th>
              <th>Mood</th>
              <th>Artist</th>
              <th>Duration</th>
              <th>Added</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTracks.map(track => {
              const isThisPlaying = playingTrack?.id === track.id && isPlaying;
              return (
                <tr key={track.id} className={`video-row ${isThisPlaying ? 'playing-row' : ''}`}>
                  <td>
                    <button className="play-track-btn" onClick={() => handlePlayPause(track)}>
                      <span className="material-symbols-outlined">
                        {isThisPlaying ? 'pause_circle' : 'play_circle'}
                      </span>
                    </button>
                  </td>
                  <td>
                    <button className="star-track-btn" onClick={() => toggleStarAudioTrack(track.id)}>
                      <span className={`material-symbols-outlined ${track.starred ? 'active-star' : ''}`}>
                        {track.starred ? 'star' : 'star_border'}
                      </span>
                    </button>
                  </td>
                  <td><span className="track-name">{track.title}</span></td>
                  <td><span className="genre-chip">{track.genre}</span></td>
                  <td>{track.mood}</td>
                  <td>{track.artist}</td>
                  <td>{track.duration}</td>
                  <td>{track.added}</td>
                  <td>
                    <button className="dl-track-btn" onClick={() => handleDownload(track.title)}>
                      <span className="material-symbols-outlined">download</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Audio Player Bar */}
      {playingTrack && (
        <div className="bottom-audio-player">
          <button className="player-play-btn" onClick={() => setIsPlaying(!isPlaying)}>
            <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
          </button>
          <div className="player-track-details">
            <span className="p-title">{playingTrack.title}</span>
            <span className="p-artist">{playingTrack.artist}</span>
          </div>
          <div className="player-progress-bar">
            <div className="p-progress-fill" style={{ width: isPlaying ? '45%' : '20%' }}></div>
          </div>
          <span className="player-time">01:15 / {playingTrack.duration}</span>
        </div>
      )}
    </div>
  );
};

export default AudioLibrary;
