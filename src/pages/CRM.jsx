import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import './CRM.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(2)}K`
  : String(Math.round(n));

const fmtINR = (n) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PRESET_THUMBNAILS = [
  { label: 'Studio Neon 1', url: '/thumbnails/1.webp' },
  { label: 'Studio Neon 2', url: '/thumbnails/2.webp' },
  { label: 'Studio Neon 3', url: '/thumbnails/3.webp' },
  { label: 'AI Neural Core', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80' },
  { label: 'Abstract 3D Waves', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
  { label: 'Cyberpunk Setup', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tech Workspace', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80' },
  { label: 'Matrix Code', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80' }
];

// ── sub-components ───────────────────────────────────────────────────────────
const StatPreview = ({ label, value, color = '#a78bfa' }) => (
  <div className="crm-stat-preview">
    <span className="crm-stat-label">{label}</span>
    <span className="crm-stat-value" style={{ color }}>{value}</span>
  </div>
);

const CRMInput = ({ label, value, onChange, type = 'number', min, max, step = 1, unit, placeholder }) => (
  <div className="crm-field">
    <label className="crm-field-label">{label}{unit && <span className="crm-unit">{unit}</span>}</label>
    <input
      className="crm-input"
      type={type}
      placeholder={placeholder}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
    />
  </div>
);

// ── Main CRM Component ────────────────────────────────────────────────────────
export default function CRM() {
  const {
    channelInfo, videos,
    crmUpdateChannelMetrics, updateVideoMetrics,
    bulkSetVideoRPM, bulkMultiplyViews,
    crmApplyPreset, reloadFromSpreadsheet,
    showToast
  } = useStore();

  const [activeSection, setActiveSection] = useState('growth');
  const [videoSearch, setVideoSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({});
  const [bulkRPM, setBulkRPM] = useState(33.64);
  const [bulkFactor, setBulkFactor] = useState(1.0);

  // Selected video for dedicated Video Growth & Thumbnails section
  const [selectedVideoId, setSelectedVideoId] = useState(videos[0]?.id || 'vid_01');
  const [selectedVideoDraft, setSelectedVideoDraft] = useState({
    thumbnail: videos[0]?.thumbnail || '/thumbnails/1.webp',
    subscribersGained: videos[0]?.subscribersGained || 29800,
    subscribersLost: videos[0]?.subscribersLost || 3576,
    views: videos[0]?.views || 2130000,
    likes: videos[0]?.likes || 98000,
    comments: videos[0]?.comments || 7240,
    rpm: videos[0]?.rpm || 33.64,
    title: videos[0]?.title || ''
  });

  const fileInputRef = useRef(null);

  const [channelDraft, setChannelDraft] = useState({
    subscribers: channelInfo?.subscribers ?? 406597,
    subscribersGainedLast28Days: channelInfo?.subscribersGainedLast28Days ?? -242,
    viewsLast28Days: channelInfo?.viewsLast28Days ?? 130000,
    watchTimeLast28Days: channelInfo?.watchTimeLast28Days ?? 4300,
    revenueLast28Days: channelInfo?.revenueLast28Days ?? 11337.11,
    name: channelInfo?.name || 'Talk Money With Pavan',
    avatar: channelInfo?.avatar || '',
  });

  useEffect(() => {
    if (channelInfo) {
      setChannelDraft({
        subscribers: channelInfo.subscribers ?? 406597,
        subscribersGainedLast28Days: channelInfo.subscribersGainedLast28Days ?? -242,
        viewsLast28Days: channelInfo.viewsLast28Days ?? 130000,
        watchTimeLast28Days: channelInfo.watchTimeLast28Days ?? 4300,
        revenueLast28Days: channelInfo.revenueLast28Days ?? 11337.11,
        name: channelInfo.name || 'Talk Money With Pavan',
        avatar: channelInfo.avatar || '',
      });
    }
  }, [channelInfo]);

  // Keep selected video draft in sync when selecting a different video
  const activeVideo = useMemo(() => {
    return videos.find(v => v.id === selectedVideoId || String(v.id) === String(selectedVideoId)) || videos[0];
  }, [videos, selectedVideoId]);

  useEffect(() => {
    if (activeVideo) {
      setSelectedVideoDraft({
        thumbnail: activeVideo.thumbnail || '/thumbnails/1.webp',
        subscribersGained: activeVideo.subscribersGained !== undefined ? activeVideo.subscribersGained : Math.round((activeVideo.views || 10000) * 0.014),
        subscribersLost: activeVideo.subscribersLost !== undefined ? activeVideo.subscribersLost : Math.round(((activeVideo.subscribersGained || 1000) * 0.12)),
        views: activeVideo.views || 0,
        likes: activeVideo.likes || 0,
        comments: activeVideo.comments || 0,
        rpm: activeVideo.rpm || 33.64,
        title: activeVideo.title || ''
      });
    }
  }, [selectedVideoId, activeVideo]);

  const filteredVideos = useMemo(() =>
    videos.filter(v => v.title?.toLowerCase().includes(videoSearch.toLowerCase())),
    [videos, videoSearch]
  );

  const totalRevenue = useMemo(() =>
    videos.reduce((acc, v) => acc + (v.revenue || 0), 0), [videos]);

  const totalViews = useMemo(() =>
    videos.reduce((acc, v) => acc + (v.views || 0), 0), [videos]);

  const avgRPM = useMemo(() => {
    const rpms = videos.filter(v => v.rpm).map(v => v.rpm);
    return rpms.length ? (rpms.reduce((a, b) => a + b, 0) / rpms.length).toFixed(2) : '0.00';
  }, [videos]);

  function startEdit(v) {
    setEditingId(v.id);
    setEditBuf({
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      rpm: v.rpm || 33.64,
      subscribersGained: v.subscribersGained !== undefined ? v.subscribersGained : Math.round(v.views * 0.014),
      thumbnail: v.thumbnail
    });
  }

  function saveEdit(id) {
    updateVideoMetrics(id, editBuf);
    setEditingId(null);
    showToast('Video metrics & thumbnail updated ✓', 'success');
  }

  function cancelEdit() { setEditingId(null); }

  function applyChannel() {
    crmUpdateChannelMetrics(channelDraft);
    showToast('Channel metrics updated ✓', 'success');
  }

  function applyBulkRPM() {
    bulkSetVideoRPM(bulkRPM);
    showToast(`RPM set to ₹${bulkRPM} for all videos ✓`, 'success');
  }

  function applyBulkMultiply() {
    bulkMultiplyViews(bulkFactor);
    showToast(`All video views multiplied by ${bulkFactor}× ✓`, 'success');
  }

  function applyVideoGrowthChanges() {
    if (!activeVideo) return;
    updateVideoMetrics(activeVideo.id, selectedVideoDraft);
    showToast(`Video "${activeVideo.title?.slice(0, 24)}…" updated ✓ Reflecting across all Studio pages.`, 'success');
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result;
      if (dataUrl) {
        setSelectedVideoDraft(d => ({ ...d, thumbnail: String(dataUrl) }));
        showToast('Local thumbnail image uploaded successfully ✓', 'info');
      }
    };
    reader.readAsDataURL(file);
  };

  const navItems = [
    { key: 'growth',   icon: '🖼️', label: 'Thumbnails & Subs' },
    { key: 'videos',   icon: '🎬', label: 'Videos Manager' },
    { key: 'channel',  icon: '📡', label: 'Channel Metrics' },
    { key: 'bulk',     icon: '⚡', label: 'Bulk Actions' },
    { key: 'preview',  icon: '👁️', label: 'Live Preview' },
  ];

  return (
    <div className="crm-root">
      {/* ── Sidebar ── */}
      <aside className="crm-sidebar">
        <div className="crm-logo">
          <span className="crm-logo-icon">⚙️</span>
          <div>
            <div className="crm-logo-title">Studio CRM</div>
            <div className="crm-logo-sub">Data & Visuals Control</div>
          </div>
        </div>

        <nav className="crm-nav">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`crm-nav-item ${activeSection === item.key ? 'active' : ''}`}
              onClick={() => setActiveSection(item.key)}
            >
              <span className="crm-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <a href="/channel/UCqpdVWIzEQUcbf4pAxlneOQ/dashboard" className="crm-back-btn">
          ← Back to Studio
        </a>
      </aside>

      {/* ── Main ── */}
      <main className="crm-main">

        {/* ── Header ── */}
        <div className="crm-header">
          <div>
            <h1 className="crm-title">{navItems.find(n => n.key === activeSection)?.label}</h1>
            <p className="crm-subtitle">
              {activeSection === 'growth' && 'Edit per-video subscriber gain and replace thumbnails with live instant synchronization across Studio & Analytics'}
              {activeSection === 'videos' && 'Edit per-video metrics — subscriber gains, thumbnails, views, likes & RPM'}
              {activeSection === 'channel' && 'Edit channel-level stats — changes reflect instantly in YouTube Studio'}
              {activeSection === 'bulk' && 'Apply batch changes across all videos at once'}
              {activeSection === 'preview' && 'Read-only live snapshot of current store values'}
            </p>
          </div>
          <div className="crm-header-badges">
            <span className="crm-badge crm-badge-green">● Live Sync</span>
            <span className="crm-badge">{videos.length} videos</span>
          </div>
        </div>

        {/* ── DEDICATED THUMBNAILS & SUBS SECTION ── */}
        {activeSection === 'growth' && (
          <div className="crm-section">
            {/* Top Video Selector Rail */}
            <div className="crm-card">
              <div className="crm-card-header-flex">
                <div className="crm-card-title">🎯 1. Select Video to Customize</div>
                <span className="crm-badge">{filteredVideos.length} Available</span>
              </div>
              <input
                className="crm-search"
                placeholder="🔍  Search video title to select…"
                value={videoSearch}
                onChange={e => setVideoSearch(e.target.value)}
              />

              <div className="crm-video-chips-grid">
                {filteredVideos.map(v => {
                  const isSel = (v.id === selectedVideoId || String(v.id) === String(selectedVideoId));
                  return (
                    <div
                      key={v.id}
                      className={`crm-video-chip ${isSel ? 'active' : ''}`}
                      onClick={() => setSelectedVideoId(v.id)}
                    >
                      <img src={v.thumbnail} alt="" className="crm-chip-thumb" />
                      <div className="crm-chip-details">
                        <div className="crm-chip-title">{v.title}</div>
                        <div className="crm-chip-meta">
                          <span>👁️ {v.viewsFormatted || fmt(v.views)}</span>
                          <span className="crm-chip-subs">👥 +{fmt(v.subscribersGained || Math.round(v.views * 0.014))} subs</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Video Customization Studio */}
            {activeVideo && (
              <div className="crm-grid-2">
                {/* Thumbnail Customizer Card */}
                <div className="crm-card">
                  <div className="crm-card-title">🖼️ 2. Change Thumbnail</div>
                  <p className="crm-card-desc">
                    Upload any image from your computer, paste a URL, or choose a preset. Updates thumbnail on Dashboard, Content, Video Analytics, Sidebar and search.
                  </p>

                  <div className="crm-thumbnail-preview-frame">
                    <img
                      src={selectedVideoDraft.thumbnail}
                      alt="Thumbnail Preview"
                      className="crm-thumbnail-preview-img"
                    />
                    <div className="crm-preview-duration-badge">{activeVideo.duration || '12:45'}</div>
                  </div>

                  <div className="crm-field">
                    <label className="crm-field-label">Thumbnail Image URL</label>
                    <input
                      className="crm-input"
                      type="text"
                      placeholder="https://... or /thumbnails/1.webp"
                      value={selectedVideoDraft.thumbnail}
                      onChange={e => setSelectedVideoDraft(d => ({ ...d, thumbnail: e.target.value }))}
                    />
                  </div>

                  <div className="crm-upload-row">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      className="crm-btn crm-btn-edit crm-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      📁 Upload Image from PC
                    </button>
                    <span className="crm-upload-hint">Supports PNG, JPG, WebP, GIF</span>
                  </div>

                  <div className="crm-presets-block">
                    <label className="crm-field-label">Quick Preset Thumbnails</label>
                    <div className="crm-preset-thumbs-grid">
                      {PRESET_THUMBNAILS.map((pt, i) => (
                        <div
                          key={i}
                          className={`crm-preset-thumb-card ${selectedVideoDraft.thumbnail === pt.url ? 'active' : ''}`}
                          onClick={() => setSelectedVideoDraft(d => ({ ...d, thumbnail: pt.url }))}
                        >
                          <img src={pt.url} alt={pt.label} />
                          <span>{pt.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subscriber Gain & Video Performance Card */}
                <div className="crm-card">
                  <div className="crm-card-title">👥 3. Edit Per-Video Subscriber Gain</div>
                  <p className="crm-card-desc">
                    Define exact subscriber gain for this video. Reflects on Video Analytics Overview metric cards, audience subscriber breakdown, and channel growth charts.
                  </p>

                  <CRMInput
                    label="Subscribers Gained from this Video"
                    value={selectedVideoDraft.subscribersGained}
                    onChange={v => {
                      const gained = Number(v);
                      const lost = Math.round(gained * 0.12);
                      setSelectedVideoDraft(d => ({
                        ...d,
                        subscribersGained: gained,
                        subscribersLost: lost
                      }));
                    }}
                    min={0}
                    step={100}
                    unit="subs"
                  />

                  <div className="crm-quick-pill-row">
                    <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick presets:</span>
                    {[500, 1500, 5000, 15000, 50000, 100000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        className="crm-mini-pill"
                        onClick={() => setSelectedVideoDraft(d => ({
                          ...d,
                          subscribersGained: amt,
                          subscribersLost: Math.round(amt * 0.12)
                        }))}
                      >
                        +{amt >= 1000 ? `${amt / 1000}K` : amt}
                      </button>
                    ))}
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Video Views"
                      value={selectedVideoDraft.views}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, views: v }))}
                      min={0}
                      step={1000}
                    />
                    <CRMInput
                      label="Video RPM (₹)"
                      value={selectedVideoDraft.rpm}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, rpm: v }))}
                      min={0}
                      step={0.1}
                      unit="₹"
                    />
                  </div>

                  <div className="crm-grid-2">
                    <CRMInput
                      label="Likes Count"
                      value={selectedVideoDraft.likes}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, likes: v }))}
                      min={0}
                      step={50}
                    />
                    <CRMInput
                      label="Comments Count"
                      value={selectedVideoDraft.comments}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, comments: v }))}
                      min={0}
                      step={10}
                    />
                  </div>

                  {/* Impact Summary Pill */}
                  <div className="crm-preview-small" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Conversion Rate:</span>
                      <strong style={{ color: '#4ade80' }}>
                        {selectedVideoDraft.views > 0
                          ? `${((selectedVideoDraft.subscribersGained / selectedVideoDraft.views) * 100).toFixed(2)}%`
                          : '0.00%'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Calculated Revenue:</span>
                      <strong>{fmtINR((selectedVideoDraft.views / 1000) * selectedVideoDraft.rpm)}</strong>
                    </div>
                  </div>

                  <div className="crm-button-action-row" style={{ marginTop: 16 }}>
                    <button
                      className="crm-apply-btn"
                      onClick={applyVideoGrowthChanges}
                    >
                      💾 Apply & Reflect Everywhere
                    </button>
                    <a
                      href={`/channel/UCqpdVWIzEQUcbf4pAxlneOQ/analytics?v=${activeVideo.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="crm-btn crm-btn-edit"
                      style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 18px', borderRadius: '10px' }}
                    >
                      <span>📈 View in Video Analytics ↗</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── VIDEOS MANAGER ── */}
        {activeSection === 'videos' && (
          <div className="crm-section">
            <div className="crm-videos-toolbar">
              <input
                className="crm-search"
                placeholder="🔍  Search videos…"
                value={videoSearch}
                onChange={e => setVideoSearch(e.target.value)}
              />
              <span className="crm-badge">{filteredVideos.length} results</span>
            </div>

            <div className="crm-table-wrap">
              <table className="crm-table">
                <thead>
                  <tr>
                    <th>Video & Thumbnail</th>
                    <th>Subs Gained</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>RPM (₹)</th>
                    <th>Revenue</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVideos.map(v => {
                    const isEditing = editingId === v.id;
                    return (
                      <tr key={v.id} className={isEditing ? 'crm-row-editing' : ''}>
                        <td className="crm-vid-title-cell">
                          <img src={isEditing ? (editBuf.thumbnail || v.thumbnail) : v.thumbnail} alt="" className="crm-vid-thumb" />
                          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <span className="crm-vid-name">{v.title}</span>
                            {isEditing && (
                              <input
                                className="crm-inline-input"
                                style={{ width: '180px', marginTop: '4px', fontSize: '11px' }}
                                placeholder="Thumb URL"
                                value={editBuf.thumbnail || ''}
                                onChange={e => setEditBuf(b => ({ ...b, thumbnail: e.target.value }))}
                              />
                            )}
                          </div>
                        </td>
                        {isEditing ? (
                          <>
                            <td><input className="crm-inline-input" type="number" min={0} value={editBuf.subscribersGained}
                              onChange={e => setEditBuf(b => ({ ...b, subscribersGained: Number(e.target.value) }))} /></td>
                            <td><input className="crm-inline-input" type="number" min={0} value={editBuf.views}
                              onChange={e => setEditBuf(b => ({ ...b, views: Number(e.target.value) }))} /></td>
                            <td><input className="crm-inline-input" type="number" min={0} value={editBuf.likes}
                              onChange={e => setEditBuf(b => ({ ...b, likes: Number(e.target.value) }))} /></td>
                            <td><input className="crm-inline-input" type="number" min={0} value={editBuf.comments}
                              onChange={e => setEditBuf(b => ({ ...b, comments: Number(e.target.value) }))} /></td>
                            <td><input className="crm-inline-input" type="number" min={0} step={0.01} value={editBuf.rpm}
                              onChange={e => setEditBuf(b => ({ ...b, rpm: Number(e.target.value) }))} /></td>
                            <td className="crm-revenue-preview">
                              {fmtINR((editBuf.views / 1000) * editBuf.rpm)}
                            </td>
                            <td className="crm-action-cell">
                              <button className="crm-btn crm-btn-save" onClick={() => saveEdit(v.id)}>Save</button>
                              <button className="crm-btn crm-btn-cancel" onClick={cancelEdit}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ color: '#4ade80', fontWeight: 600 }}>
                              +{fmt(v.subscribersGained !== undefined ? v.subscribersGained : Math.round(v.views * 0.014))}
                            </td>
                            <td>{v.viewsFormatted || fmt(v.views)}</td>
                            <td>{(v.likes || 0).toLocaleString()}</td>
                            <td>{(v.comments || 0).toLocaleString()}</td>
                            <td>₹{(v.rpm || 33.64).toFixed(2)}</td>
                            <td className="crm-revenue-cell">{v.revenueFormatted || fmtINR(v.revenue || 0)}</td>
                            <td className="crm-action-cell">
                              <button className="crm-btn crm-btn-edit" onClick={() => startEdit(v)}>Edit</button>
                              <button
                                className="crm-btn crm-btn-cancel"
                                title="Open in dedicated Thumbnail & Subs editor"
                                onClick={() => {
                                  setSelectedVideoId(v.id);
                                  setActiveSection('growth');
                                }}
                              >
                                🖼️ Studio
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CHANNEL METRICS ── */}
        {activeSection === 'channel' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              {/* Subscribers */}
              <div className="crm-card">
                <div className="crm-card-title">👥 Subscribers</div>
                <CRMInput label="Total Subscribers" value={channelDraft.subscribers}
                  onChange={v => setChannelDraft(d => ({ ...d, subscribers: v }))} min={0} step={1000} />
                <CRMInput label="Gained (Last 28 days)" value={channelDraft.subscribersGainedLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, subscribersGainedLast28Days: v }))} min={-999999} step={100} />
              </div>

              {/* Views & Watch time */}
              <div className="crm-card">
                <div className="crm-card-title">📊 Views & Watch Time</div>
                <CRMInput label="Views (Last 28 days)" value={channelDraft.viewsLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, viewsLast28Days: v }))} min={0} step={1000} />
                <CRMInput label="Watch Time — Hours (Last 28 days)" value={channelDraft.watchTimeLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, watchTimeLast28Days: v }))} min={0} step={100} />
              </div>

              {/* Revenue */}
              <div className="crm-card">
                <div className="crm-card-title">💰 Revenue</div>
                <CRMInput label="Estimated Revenue (Last 28 days)" value={channelDraft.revenueLast28Days}
                  onChange={v => setChannelDraft(d => ({ ...d, revenueLast28Days: v }))} min={0} step={100} unit="₹" />
              </div>

              {/* Channel Identity */}
              <div className="crm-card">
                <div className="crm-card-title">🎭 Channel Identity</div>
                <CRMInput label="Channel Name" value={channelDraft.name} type="text"
                  onChange={v => setChannelDraft(d => ({ ...d, name: v }))} />
                <CRMInput label="Avatar URL" value={channelDraft.avatar} type="text"
                  onChange={v => setChannelDraft(d => ({ ...d, avatar: v }))} />
              </div>
            </div>

            {/* Preview row */}
            <div className="crm-card crm-preview-bar">
              <span className="crm-card-title" style={{ margin: 0 }}>Preview</span>
              <StatPreview label="Subscribers" value={fmt(channelDraft.subscribers)} />
              <StatPreview label="Gained" value={`+${fmt(channelDraft.subscribersGainedLast28Days)}`} color="#4ade80" />
              <StatPreview label="Views 28d" value={fmt(channelDraft.viewsLast28Days)} />
              <StatPreview label="Revenue 28d" value={fmtINR(channelDraft.revenueLast28Days)} color="#fbbf24" />
            </div>

            <button className="crm-apply-btn" onClick={applyChannel}>
              Apply Changes to YouTube Studio
            </button>
          </div>
        )}

        {/* ── BULK ACTIONS ── */}
        {activeSection === 'bulk' && (
          <div className="crm-section crm-grid-2">
            <div className="crm-card">
              <div className="crm-card-title">₹ Set Global RPM</div>
              <p className="crm-card-desc">Override RPM for every video. Revenue will be recalculated automatically (Revenue = Views / 1000 × RPM).</p>
              <CRMInput label="RPM (₹)" value={bulkRPM}
                onChange={v => setBulkRPM(v)} min={0} step={0.01} unit="₹" />
              <div className="crm-preview-small">
                Estimated total revenue at this RPM: <strong>{fmtINR((totalViews / 1000) * bulkRPM)}</strong>
              </div>
              <button className="crm-apply-btn" onClick={applyBulkRPM}>
                Apply to All Videos
              </button>
            </div>

            <div className="crm-card">
              <div className="crm-card-title">✖️ Multiply All Views</div>
              <p className="crm-card-desc">Scale every video's views by a factor. Example: 1.5 = +50%, 0.8 = -20%.</p>
              <CRMInput label="Multiplier" value={bulkFactor}
                onChange={v => setBulkFactor(v)} min={0.01} step={0.05} />
              <div className="crm-preview-small">
                Total views will become: <strong>{fmt(Math.round(totalViews * bulkFactor))}</strong>
                {' '}(currently {fmt(totalViews)})
              </div>
              <button className="crm-apply-btn" onClick={applyBulkMultiply}>
                Apply Multiplier
              </button>
            </div>

            <div className="crm-card">
              <div className="crm-card-title">🚀 Preset Scenarios</div>
              <p className="crm-card-desc">Instantly load pre-configured high-performance data profiles across your channel and videos.</p>
              <div className="crm-preset-buttons">
                <button className="crm-btn crm-btn-edit" style={{ background: '#1e1035', color: '#a78bfa' }} onClick={() => { crmApplyPreset('viral'); showToast('Loaded Viral Spike preset (45M views, ₹1.85L rev) ✓', 'success'); }}>
                  🚀 Viral Spike (45M Views)
                </button>
                <button className="crm-btn crm-btn-edit" style={{ background: '#172554', color: '#60a5fa' }} onClick={() => { crmApplyPreset('high_rpm'); showToast('Set High RPM preset (₹85.50 RPM) ✓', 'success'); }}>
                  💰 High RPM (₹85.50 RPM)
                </button>
                <button className="crm-btn crm-btn-cancel" onClick={() => { reloadFromSpreadsheet(); showToast('Reset to original spreadsheet data ✓', 'info'); }}>
                  🔄 Reset Baseline
                </button>
              </div>
            </div>

            <div className="crm-card crm-card-warning">
              <div className="crm-card-title">⚠️ Notes</div>
              <ul className="crm-warning-list">
                <li>Changes are saved in <strong>persistent browser state</strong>.</li>
                <li>Thumbnails and subscriber gains reflect instantly in Dashboard, Content, and Video Analytics.</li>
                <li>The YouTube Studio UI reflects changes instantly via shared state.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── LIVE PREVIEW ── */}
        {activeSection === 'preview' && (
          <div className="crm-section">
            <div className="crm-grid-3">
              {/* Channel */}
              <div className="crm-card">
                <div className="crm-card-title">📡 Channel</div>
                <StatPreview label="Name" value={channelInfo?.name || '—'} color="#e2e8f0" />
                <StatPreview label="Subscribers" value={channelInfo?.subscribersFormatted || '—'} />
                <StatPreview label="Subs Gained (28d)" value={channelInfo?.subscribersGainedLast28DaysFormatted || '—'} color="#4ade80" />
                <StatPreview label="Views (28d)" value={channelInfo?.viewsLast28DaysFormatted || '—'} />
                <StatPreview label="Watch Time (28d)" value={channelInfo?.watchTimeLast28DaysFormatted || '—'} />
                <StatPreview label="Revenue (28d)" value={channelInfo?.revenueLast28DaysFormatted || '—'} color="#fbbf24" />
              </div>

              {/* Aggregated video stats */}
              <div className="crm-card">
                <div className="crm-card-title">🎬 Aggregated Videos</div>
                <StatPreview label="Total Videos" value={videos.length} />
                <StatPreview label="Total Views" value={fmt(totalViews)} />
                <StatPreview label="Total Revenue" value={fmtINR(totalRevenue)} color="#fbbf24" />
                <StatPreview label="Avg RPM" value={`₹${avgRPM}`} color="#a78bfa" />
                <StatPreview label="Total Likes" value={fmt(videos.reduce((a, v) => a + (v.likes || 0), 0))} color="#f472b6" />
                <StatPreview label="Total Comments" value={fmt(videos.reduce((a, v) => a + (v.comments || 0), 0))} />
              </div>

              {/* Top 5 videos */}
              <div className="crm-card">
                <div className="crm-card-title">🏆 Top 5 by Revenue</div>
                {[...videos].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5).map(v => (
                  <div key={v.id} className="crm-top-item">
                    <span className="crm-top-name">{v.title}</span>
                    <span className="crm-top-val">{v.revenueFormatted || fmtINR(v.revenue || 0)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* All videos snapshot */}
            <div className="crm-card" style={{ marginTop: 16 }}>
              <div className="crm-card-title">📋 All Videos Snapshot</div>
              <div className="crm-table-wrap">
                <table className="crm-table crm-table-compact">
                  <thead>
                    <tr>
                      <th>Thumbnail</th>
                      <th>Title</th>
                      <th>Subs Gained</th>
                      <th>Views</th>
                      <th>Likes</th>
                      <th>RPM</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map(v => (
                      <tr key={v.id}>
                        <td><img src={v.thumbnail} alt="" className="crm-vid-thumb" /></td>
                        <td className="crm-vid-name" style={{ maxWidth: 260 }}>{v.title}</td>
                        <td style={{ color: '#4ade80' }}>+{fmt(v.subscribersGained !== undefined ? v.subscribersGained : Math.round(v.views * 0.014))}</td>
                        <td>{v.viewsFormatted}</td>
                        <td>{(v.likes || 0).toLocaleString()}</td>
                        <td>₹{(v.rpm || 33.64).toFixed(2)}</td>
                        <td className="crm-revenue-cell">{v.revenueFormatted}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
