import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './Content.css';

const Content = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const CHANNEL_PREFIX = '/channel/UCqpdVWIzEQUcbf4pAxlneOQ';

  const { 
    videos, shorts, liveStreams, playlists, podcasts, 
    deleteVideo, bulkDeleteVideos, bulkUpdateVisibility, showToast 
  } = useStore();

  const [activeTab, setActiveTab] = useState('Videos');
  const [filterText, setFilterText] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('All');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (location.pathname.includes('/shorts')) setActiveTab('Shorts');
    else if (location.pathname.includes('/live')) setActiveTab('Live');
    else if (location.pathname.includes('/playlists')) setActiveTab('Playlists');
    else if (location.pathname.includes('/podcasts')) setActiveTab('Podcasts');
    else if (location.pathname.includes('/promotions')) setActiveTab('Promotions');
    else setActiveTab('Videos');
  }, [location.pathname]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSelectedIds([]);
    setCurrentPage(1);
    const slug = tabName.toLowerCase();
    navigate(`${CHANNEL_PREFIX}/content/${slug}`);
  };

  useEffect(() => {
    console.info('[Spreadsheet] Content Rendered', { videos: videos?.length || 0 });
  }, [videos?.length]);

  // Determine current active dataset
  let currentDataset = [];
  if (activeTab === 'Videos') currentDataset = videos;
  else if (activeTab === 'Shorts') currentDataset = shorts;
  else if (activeTab === 'Live') currentDataset = liveStreams;
  else if (activeTab === 'Playlists') currentDataset = playlists;
  else if (activeTab === 'Podcasts') currentDataset = podcasts;

  // Apply filters
  const filteredList = currentDataset.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(filterText.toLowerCase());
    const matchesVisibility = visibilityFilter === 'All' || item.visibility === visibilityFilter;
    return matchesSearch && matchesVisibility;
  });

  // Pagination
  const totalItems = filteredList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedList = filteredList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedList.map(item => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Delete ${selectedIds.length} selected items permanently?`)) {
      bulkDeleteVideos(selectedIds);
      setSelectedIds([]);
      showToast(`${selectedIds.length} items deleted`, "success");
    }
  };

  const handleBulkVisibilityChange = (visibility) => {
    bulkUpdateVisibility(selectedIds, visibility);
    setSelectedIds([]);
    showToast(`Updated visibility to ${visibility}`, "success");
  };

  const handleDeleteOne = (id, title) => {
    if (window.confirm(`Delete "${title}"?`)) {
      deleteVideo(id);
      showToast("Video deleted permanently", "success");
    }
  };

  const copyLink = (id) => {
    navigator.clipboard?.writeText(`https://youtu.be/${id}`);
    showToast("Link copied to clipboard", "info");
  };

  return (
    <div className="dashboard-container content-page">
      <h1 className="dashboard-title">Channel content</h1>
      
      {/* Navigation Tabs */}
      <div className="content-tabs">
        {['Videos', 'Shorts', 'Live', 'Playlists', 'Podcasts', 'Promotions'].map(tab => (
          <button 
            key={tab} 
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Bulk Action Bar OR Filter Bar */}
      {selectedIds.length > 0 ? (
        <div className="bulk-action-bar">
          <span className="selected-count">{selectedIds.length} selected</span>
          <div className="bulk-buttons">
            <select 
              className="bulk-select-dropdown" 
              onChange={(e) => handleBulkVisibilityChange(e.target.value)}
              defaultValue=""
            >
              <option value="" disabled>Edit Visibility</option>
              <option value="Public">Public</option>
              <option value="Unlisted">Unlisted</option>
              <option value="Private">Private</option>
            </select>
            <button className="bulk-delete-btn" onClick={handleBulkDelete}>
              <span className="material-symbols-outlined">delete</span> Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="content-filters">
          <div className="filter-search-box">
            <span className="material-symbols-outlined filter-icon">filter_list</span>
            <input 
              type="text" 
              placeholder="Filter by title..." 
              className="filter-input" 
              value={filterText}
              onChange={e => { setFilterText(e.target.value); setCurrentPage(1); }}
            />
          </div>

          <div className="filter-dropdowns">
            <select 
              className="visibility-filter-select"
              value={visibilityFilter}
              onChange={e => setVisibilityFilter(e.target.value)}
            >
              <option value="All">All Visibilities</option>
              <option value="Public">Public</option>
              <option value="Unlisted">Unlisted</option>
              <option value="Private">Private</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content Table */}
      <div className="table-container">
        {activeTab === 'Playlists' ? (
          <table className="content-table">
            <thead>
              <tr>
                <th className="video-col">Playlist</th>
                <th>Visibility</th>
                <th>Videos</th>
                <th>Last updated</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map(pl => (
                <tr key={pl.id} className="video-row">
                  <td className="video-col">
                    <div className="video-cell">
                      <span className="material-symbols-outlined pl-icon">playlist_play</span>
                      <div className="video-info">
                        <span className="video-title-link">{pl.title}</span>
                      </div>
                    </div>
                  </td>
                  <td>{pl.visibility}</td>
                  <td>{pl.videoCount} videos</td>
                  <td>{pl.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'Podcasts' ? (
          <table className="content-table">
            <thead>
              <tr>
                <th className="video-col">Podcast Show</th>
                <th>Visibility</th>
                <th>Episodes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.map(pod => (
                <tr key={pod.id} className="video-row">
                  <td className="video-col">
                    <div className="video-cell">
                      <span className="material-symbols-outlined pl-icon">podcasts</span>
                      <div className="video-info">
                        <span className="video-title-link">{pod.title}</span>
                      </div>
                    </div>
                  </td>
                  <td>{pod.visibility}</td>
                  <td>{pod.episodes} episodes</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="content-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={paginatedList.length > 0 && paginatedList.every(i => selectedIds.includes(i.id))}
                  />
                </th>
                <th className="video-col">{activeTab.slice(0, -1)}</th>
                <th>Visibility</th>
                <th>Restrictions</th>
                <th>Date</th>
                <th>Views</th>
                <th>Comments</th>
                <th>Likes</th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="no-content-cell">No items matching current filters.</td>
                </tr>
              ) : (
                paginatedList.map(item => (
                  <tr key={item.id} className="video-row">
                    <td className="checkbox-col">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(item.id)} 
                        onChange={() => handleSelectOne(item.id)}
                      />
                    </td>
                    <td className="video-col">
                      <div className="video-cell">
                        <div className="video-thumb-container" onClick={() => navigate(`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${item.id}`)}>
                          <img src={item.thumbnail} alt={item.title} className="video-thumb-small" />
                          {item.duration && <span className="video-duration-small">{item.duration}</span>}
                        </div>
                        <div className="video-info">
                          <Link to={`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/video/${item.id}`} className="video-title-link">{item.title}</Link>
                          <p className="video-desc">{item.description ? item.description.substring(0, 60) + "..." : "No description"}</p>
                          
                          {/* Row Action Buttons on Hover */}
                          <div className="hover-actions">
                            <Link to={`${CHANNEL_PREFIX}/video/${item.id}`} title="Details">
                              <span className="material-symbols-outlined">edit</span>
                            </Link>
                            <Link to={`${CHANNEL_PREFIX}/analytics/tab-overview/period-last-28-days?video=${item.id}`} title="Analytics">
                              <span className="material-symbols-outlined">insert_chart</span>
                            </Link>
                            <Link to={`${CHANNEL_PREFIX}/community/comments`} title="Comments">
                              <span className="material-symbols-outlined">comment</span>
                            </Link>
                            <Link to={`${CHANNEL_PREFIX}/monetization/overview`} title="Monetization">
                              <span className="material-symbols-outlined">monetization_on</span>
                            </Link>
                            <button title="Options" onClick={(e) => { e.stopPropagation(); copyLink(item.id); }}>
                              <span className="material-symbols-outlined">more_vert</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="visibility-cell">
                        <span className={`material-symbols-outlined visibility-icon ${(item.visibility || 'Public').toLowerCase()}`}>
                          {item.visibility === 'Public' ? 'visibility' : item.visibility === 'Private' ? 'visibility_off' : 'link'}
                        </span>
                        {item.visibility || 'Public'}
                      </div>
                    </td>
                    <td>
                      <span className={`restriction-badge ${item.restrictions !== 'None' ? 'warning' : ''}`}>
                        {item.restrictions || "None"}
                      </span>
                    </td>
                    <td>
                      <div className="date-cell">
                        <span>{item.date}</span>
                        <span className="date-type">{item.status || "Published"}</span>
                      </div>
                    </td>
                    <td>{item.viewsFormatted || item.views?.toLocaleString()}</td>
                    <td>{item.comments?.toLocaleString()}</td>
                    <td>{item.likes?.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination">
        <span className="pagination-info">
          Rows per page: 10 • Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}
        </span>
        <div className="pagination-controls">
          <button 
            disabled={currentPage === 1} 
            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button 
            disabled={currentPage >= totalPages} 
            onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Content;
