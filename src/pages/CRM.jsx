import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { parseAvdToSeconds, formatSecondsToAvd } from '../services/InsforgeService';
import { formatDateRangeText, formatSingleDate } from '../engine/AnalyticsSimulationEngine';
import './CRM.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const parseSmartNumber = (val, fallback = 0) => {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val || typeof val !== 'string') return fallback;
  const cleaned = val.trim().replace(/,/g, '');
  if (/^[-+]?[0-9]*\.?[0-9]+[kK]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 1_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[mM]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 1_000_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[bB]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 1_000_000_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[lL]$/i.test(cleaned)) {
    return parseFloat(cleaned) * 100_000;
  }
  if (/^[-+]?[0-9]*\.?[0-9]+[cC][rR]?$/i.test(cleaned)) {
    return parseFloat(cleaned) * 10_000_000;
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
};

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

const CRMInput = ({ label, value, onChange, type = 'number', min, max, step = 1, unit, placeholder, onKeyDown }) => {
  const [localVal, setLocalVal] = useState(value !== undefined && value !== null ? String(value) : '');
  const isFocused = useRef(false);

  useEffect(() => {
    if (!isFocused.current) {
      setLocalVal(value !== undefined && value !== null ? String(value) : '');
    }
  }, [value]);

  const handleChange = (e) => {
    const text = e.target.value;
    setLocalVal(text);
    if (type === 'number') {
      if (text.trim() === '' || text === '-') {
        onChange(0);
      } else {
        const num = parseSmartNumber(text, null);
        if (num !== null) {
          onChange(num);
        }
      }
    } else {
      onChange(text);
    }
  };

  const handleBlur = () => {
    isFocused.current = false;
    if (type === 'number') {
      const num = parseSmartNumber(localVal, value ?? 0);
      onChange(num);
      setLocalVal(String(num));
    }
  };

  return (
    <div className="crm-field">
      <label className="crm-field-label">{label}{unit && <span className="crm-unit">{unit}</span>}</label>
      <input
        className="crm-input"
        type={type === 'number' ? 'text' : type}
        placeholder={placeholder}
        value={localVal}
        min={min}
        max={max}
        step={step}
        onFocus={() => { isFocused.current = true; }}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={onKeyDown}
      />
    </div>
  );
};

// ── Main CRM Component ────────────────────────────────────────────────────────
export default function CRM() {
  const {
    channelInfo, videos,
    simulationAnchorDate, selectedDateRange, customStartDate, customEndDate,
    setSimulationAnchorDate, setDateRange,
    crmUpdateChannelMetrics, updateVideoMetrics,
    bulkSetVideoRPM, bulkMultiplyViews,
    crmApplyPreset, reloadFromSpreadsheet,
    loadFromDatabase, isDatabaseLoading, isDatabaseConnected, lastDatabaseSync,
    showToast
  } = useStore();

  const [activeSection, setActiveSection] = useState('growth');
  const [videoSearch, setVideoSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({});
  const [bulkRPM, setBulkRPM] = useState(33.64);
  const [bulkFactor, setBulkFactor] = useState(1.0);

  // Date Range Draft State
  const [dateDraft, setDateDraft] = useState({
    anchorDate: simulationAnchorDate || '2026-08-12',
    startDate: customStartDate || '2026-07-16',
    endDate: customEndDate || '2026-08-12',
    preset: selectedDateRange || 'last28'
  });

  useEffect(() => {
    setDateDraft({
      anchorDate: simulationAnchorDate || '2026-08-12',
      startDate: customStartDate || '2026-07-16',
      endDate: customEndDate || '2026-08-12',
      preset: selectedDateRange || 'last28'
    });
  }, [simulationAnchorDate, customStartDate, customEndDate, selectedDateRange]);

  // Selected video for dedicated Video Growth & Thumbnails section
  const [selectedVideoId, setSelectedVideoId] = useState(videos[0]?.id || 'vid_01');
  const [selectedVideoDraft, setSelectedVideoDraft] = useState({
    thumbnail: videos[0]?.thumbnail || '/thumbnails/1.webp',
    duration: videos[0]?.duration || '10:18',
    durationSecs: videos[0]?.durationSecs || 618,
    subscribersGained: videos[0]?.subscribersGained || 29800,
    subscribersLost: videos[0]?.subscribersLost || 3576,
    views: videos[0]?.views || 2130000,
    likes: videos[0]?.likes || 98000,
    comments: videos[0]?.comments || 7240,
    rpm: videos[0]?.rpm || 33.64,
    avgViewDuration: videos[0]?.avgViewDuration || '1:45',
    avgViewDurationSecs: videos[0]?.avgViewDurationSecs || 105,
    title: videos[0]?.title || ''
  });

  const fileInputRef = useRef(null);

  const [channelDraft, setChannelDraft] = useState({
    subscribers: channelInfo?.subscribers ?? 412850,
    subscribersGainedLast28Days: channelInfo?.subscribersGainedLast28Days ?? 214,
    viewsLast28Days: channelInfo?.viewsLast28Days ?? 1250000,
    watchTimeLast28Days: channelInfo?.watchTimeLast28Days ?? 1383.8,
    revenueLast28Days: channelInfo?.revenueLast28Days ?? 42050.00,
    name: channelInfo?.name || 'Kids Toon',
    avatar: channelInfo?.avatar || '',
  });

  useEffect(() => {
    if (channelInfo) {
      setChannelDraft({
        subscribers: channelInfo.subscribers ?? 412850,
        subscribersGainedLast28Days: channelInfo.subscribersGainedLast28Days ?? 214,
        viewsLast28Days: channelInfo.viewsLast28Days ?? 1250000,
        watchTimeLast28Days: channelInfo.watchTimeLast28Days ?? 1383.8,
        revenueLast28Days: channelInfo.revenueLast28Days ?? 42050.00,
        name: channelInfo.name || 'Kids Toon',
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
      const avdSecs = activeVideo.avgViewDurationSecs || parseAvdToSeconds(activeVideo.avgViewDuration, 105);
      const avdStr = activeVideo.avgViewDuration || formatSecondsToAvd(avdSecs);
      const durSecs = activeVideo.durationSecs || parseAvdToSeconds(activeVideo.duration, 618);
      const durStr = activeVideo.duration || formatSecondsToAvd(durSecs);
      setSelectedVideoDraft({
        thumbnail: activeVideo.thumbnail || '/thumbnails/1.webp',
        duration: durStr,
        durationSecs: durSecs,
        subscribersGained: activeVideo.subscribersGained !== undefined ? activeVideo.subscribersGained : Math.round((activeVideo.views || 10000) * 0.014),
        subscribersLost: activeVideo.subscribersLost !== undefined ? activeVideo.subscribersLost : Math.round(((activeVideo.subscribersGained || 1000) * 0.12)),
        views: activeVideo.views || 0,
        likes: activeVideo.likes || 0,
        comments: activeVideo.comments || 0,
        rpm: activeVideo.rpm || 33.64,
        avgViewDuration: avdStr,
        avgViewDurationSecs: avdSecs,
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
    const avdSecs = v.avgViewDurationSecs || parseAvdToSeconds(v.avgViewDuration, 105);
    const avdStr = v.avgViewDuration || formatSecondsToAvd(avdSecs);
    const durSecs = v.durationSecs || parseAvdToSeconds(v.duration, 618);
    const durStr = v.duration || formatSecondsToAvd(durSecs);
    setEditBuf({
      views: v.views,
      likes: v.likes,
      comments: v.comments,
      rpm: v.rpm || 33.64,
      duration: durStr,
      durationSecs: durSecs,
      avgViewDuration: avdStr,
      avgViewDurationSecs: avdSecs,
      subscribersGained: v.subscribersGained !== undefined ? v.subscribersGained : Math.round(v.views * 0.014),
      thumbnail: v.thumbnail
    });
  }

  function saveEdit(id) {
    const avdSecs = editBuf.avgViewDurationSecs !== undefined
      ? Number(editBuf.avgViewDurationSecs)
      : parseAvdToSeconds(editBuf.avgViewDuration, 105);
    const avdStr = editBuf.avgViewDuration || formatSecondsToAvd(avdSecs);
    const durSecs = editBuf.durationSecs !== undefined
      ? Number(editBuf.durationSecs)
      : parseAvdToSeconds(editBuf.duration, 618);
    const durStr = editBuf.duration || formatSecondsToAvd(durSecs);

    const payload = {
      ...editBuf,
      duration: durStr,
      durationSecs: durSecs,
      avgViewDuration: avdStr,
      avgViewDurationSecs: avdSecs
    };
    updateVideoMetrics(id, payload);
    setEditingId(null);
    showToast('Video metrics, duration & thumbnail updated ✓', 'success');
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
    const avdSecs = selectedVideoDraft.avgViewDurationSecs || parseAvdToSeconds(selectedVideoDraft.avgViewDuration, 105);
    const avdStr = selectedVideoDraft.avgViewDuration || formatSecondsToAvd(avdSecs);
    const durSecs = selectedVideoDraft.durationSecs || parseAvdToSeconds(selectedVideoDraft.duration, 618);
    const durStr = selectedVideoDraft.duration || formatSecondsToAvd(durSecs);
    const payload = {
      ...selectedVideoDraft,
      duration: durStr,
      durationSecs: durSecs,
      avgViewDuration: avdStr,
      avgViewDurationSecs: avdSecs
    };
    updateVideoMetrics(activeVideo.id, payload);
    showToast(`Video "${activeVideo.title?.slice(0, 24)}…" updated ✓ Reflecting across all Studio pages.`, 'success');
  }

  function applyDates() {
    setSimulationAnchorDate(dateDraft.anchorDate, dateDraft.startDate, dateDraft.endDate);
    setDateRange(dateDraft.preset, dateDraft.startDate, dateDraft.endDate);
    const label = formatDateRangeText(dateDraft.startDate, dateDraft.endDate);
    showToast(`Date range set to "${label}" across all graphs ✓`, 'success');
  }

  // Global Keyboard Shortcuts (Cmd+S / Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (activeSection === 'growth') applyVideoGrowthChanges();
        else if (activeSection === 'channel') applyChannel();
        else if (activeSection === 'dates') applyDates();
        else if (activeSection === 'bulk') applyBulkMultiply();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, selectedVideoDraft, channelDraft, dateDraft, bulkFactor, bulkRPM, activeVideo]);

  function autoCalculateEngagement() {
    const v = Number(selectedVideoDraft.views) || 0;
    const gained = Math.round(v * 0.014);
    const lost = Math.round(gained * 0.12);
    const likes = Math.round(v * 0.046);
    const comments = Math.round(v * 0.0034);
    setSelectedVideoDraft(d => ({
      ...d,
      subscribersGained: gained,
      subscribersLost: lost,
      likes,
      comments
    }));
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
    { key: 'dates',    icon: '📅', label: 'Dates & Range' },
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
              {activeSection === 'dates' && 'Control simulation anchor dates, 28-day window (e.g. Jul 16 – Aug 12, 2026), and synchronize date axes across all graphs'}
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
                    <div className="crm-preview-duration-badge">{selectedVideoDraft.duration || activeVideo.duration || '10:18'}</div>
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

                {/* Subscriber Gain, Video Duration & AVD Timing Card */}
                <div className="crm-card">
                  <div className="crm-card-title">⏱️ 3. Edit Video Duration, AVD & Subscribers</div>
                  <p className="crm-card-desc">
                    Define total video length, average view duration (AVD), subscriber gain, and engagement. Reflects instantly across Video Analytics, Watch Time, and Studio Content pages.
                  </p>

                  {/* Video Duration & AVD Duration Controls */}
                  <div className="crm-grid-2">
                    <CRMInput
                      label="Video Total Duration"
                      type="text"
                      placeholder="e.g. 10:18 or 14:22"
                      value={selectedVideoDraft.duration || '10:18'}
                      onChange={v => {
                        const secs = parseAvdToSeconds(v, 618);
                        setSelectedVideoDraft(d => ({
                          ...d,
                          duration: String(v),
                          durationSecs: secs
                        }));
                      }}
                    />
                    <CRMInput
                      label="Average View Duration (AVD)"
                      type="text"
                      placeholder="e.g. 3:45 or 225s"
                      value={selectedVideoDraft.avgViewDuration || '1:45'}
                      onChange={v => {
                        const secs = parseAvdToSeconds(v, 105);
                        setSelectedVideoDraft(d => ({
                          ...d,
                          avgViewDuration: String(v),
                          avgViewDurationSecs: secs
                        }));
                      }}
                    />
                  </div>

                  <div className="crm-quick-pill-row" style={{ marginTop: 4 }}>
                    <span className="crm-field-label" style={{ marginBottom: 0 }}>Duration presets:</span>
                    {['3:20', '5:45', '8:12', '10:18', '14:22', '18:40', '25:00', '42:15'].map(dStr => (
                      <button
                        key={dStr}
                        type="button"
                        className={`crm-mini-pill ${selectedVideoDraft.duration === dStr ? 'active-pill' : ''}`}
                        onClick={() => {
                          const secs = parseAvdToSeconds(dStr, 618);
                          setSelectedVideoDraft(d => ({
                            ...d,
                            duration: dStr,
                            durationSecs: secs
                          }));
                        }}
                      >
                        ⏱️ {dStr}
                      </button>
                    ))}
                  </div>

                  <div className="crm-quick-pill-row" style={{ marginTop: 4 }}>
                    <span className="crm-field-label" style={{ marginBottom: 0 }}>AVD presets:</span>
                    {['0:45', '1:30', '2:45', '4:15', '6:30', '8:00', '12:00'].map(tStr => (
                      <button
                        key={tStr}
                        type="button"
                        className={`crm-mini-pill ${selectedVideoDraft.avgViewDuration === tStr ? 'active-pill' : ''}`}
                        onClick={() => {
                          const secs = parseAvdToSeconds(tStr, 105);
                          setSelectedVideoDraft(d => ({
                            ...d,
                            avgViewDuration: tStr,
                            avgViewDurationSecs: secs
                          }));
                        }}
                      >
                        📊 {tStr}
                      </button>
                    ))}
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Subscribers Gained"
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
                    <CRMInput
                      label="Video Views"
                      value={selectedVideoDraft.views}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, views: v }))}
                      min={0}
                      step={1000}
                    />
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Video RPM (₹)"
                      value={selectedVideoDraft.rpm}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, rpm: v }))}
                      min={0}
                      step={0.1}
                      unit="₹"
                    />
                    <CRMInput
                      label="Likes Count"
                      value={selectedVideoDraft.likes}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, likes: v }))}
                      min={0}
                      step={50}
                    />
                  </div>

                  <div className="crm-grid-2" style={{ marginTop: 8 }}>
                    <CRMInput
                      label="Comments Count"
                      value={selectedVideoDraft.comments}
                      onChange={v => setSelectedVideoDraft(d => ({ ...d, comments: v }))}
                      min={0}
                      step={10}
                    />
                    <div className="crm-field">
                      <label className="crm-field-label">Calculated Watch Time</label>
                      <div className="crm-input" style={{ background: '#121224', color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                        ⏱️ {(((Number(selectedVideoDraft.views) || 0) * (selectedVideoDraft.avgViewDurationSecs || 105)) / 3600).toFixed(1)} hrs
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="crm-mini-pill"
                      style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', padding: '6px 12px', fontSize: '11px' }}
                      onClick={autoCalculateEngagement}
                    >
                      ⚡ Auto-calculate natural engagement (4.6% likes, 0.34% comments, 1.4% subs)
                    </button>
                  </div>

                  {/* Impact Summary Pill */}
                  <div className="crm-preview-small" style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Video Duration:</span>
                      <strong style={{ color: '#e2e8f0' }}>{selectedVideoDraft.duration || '10:18'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Average View Duration (AVD):</span>
                      <strong style={{ color: '#a78bfa' }}>{selectedVideoDraft.avgViewDuration || '1:45'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Average Percentage Viewed (Retention):</span>
                      <strong style={{ color: '#ec4899' }}>
                        {(selectedVideoDraft.durationSecs > 0 && selectedVideoDraft.avgViewDurationSecs > 0)
                          ? `${Math.min(100, Math.round(((selectedVideoDraft.avgViewDurationSecs || 105) / selectedVideoDraft.durationSecs) * 1000) / 10)}%`
                          : '17.0%'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span>Calculated Watch Time:</span>
                      <strong style={{ color: '#38bdf8' }}>
                        {(((Number(selectedVideoDraft.views) || 0) * (selectedVideoDraft.avgViewDurationSecs || 105)) / 3600).toFixed(1)} hrs
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
                    <th>Duration</th>
                    <th>Subs Gained</th>
                    <th>Views</th>
                    <th>Avg Duration (AVD)</th>
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
                    const handleInlineKeyDown = (e) => {
                      if (e.key === 'Enter') saveEdit(v.id);
                      else if (e.key === 'Escape') cancelEdit();
                    };
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
                                onKeyDown={handleInlineKeyDown}
                              />
                            )}
                          </div>
                        </td>
                        {isEditing ? (
                          <>
                            <td><input className="crm-inline-input" type="text" style={{ width: '65px' }} value={editBuf.duration || '10:18'}
                              onKeyDown={handleInlineKeyDown}
                              placeholder="10:18"
                              onChange={e => {
                                const val = e.target.value;
                                setEditBuf(b => ({ ...b, duration: val, durationSecs: parseAvdToSeconds(val, 618) }));
                              }} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.subscribersGained}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, subscribersGained: parseSmartNumber(e.target.value, b.subscribersGained) }))} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.views}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, views: parseSmartNumber(e.target.value, b.views) }))} /></td>
                            <td><input className="crm-inline-input" type="text" style={{ width: '70px' }} value={editBuf.avgViewDuration || '1:45'}
                              onKeyDown={handleInlineKeyDown}
                              placeholder="3:45"
                              onChange={e => {
                                const val = e.target.value;
                                setEditBuf(b => ({ ...b, avgViewDuration: val, avgViewDurationSecs: parseAvdToSeconds(val, 105) }));
                              }} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.likes}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, likes: parseSmartNumber(e.target.value, b.likes) }))} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.comments}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, comments: parseSmartNumber(e.target.value, b.comments) }))} /></td>
                            <td><input className="crm-inline-input" type="text" value={editBuf.rpm}
                              onKeyDown={handleInlineKeyDown}
                              onChange={e => setEditBuf(b => ({ ...b, rpm: parseSmartNumber(e.target.value, b.rpm) }))} /></td>
                            <td className="crm-revenue-preview">
                              {fmtINR(((Number(editBuf.views) || 0) / 1000) * (Number(editBuf.rpm) || 0))}
                            </td>
                            <td className="crm-action-cell">
                              <button className="crm-btn crm-btn-save" onClick={() => saveEdit(v.id)}>Save</button>
                              <button className="crm-btn crm-btn-cancel" onClick={cancelEdit}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ color: '#e2e8f0', fontWeight: 500 }}>
                              {v.duration || formatSecondsToAvd(v.durationSecs || 618)}
                            </td>
                            <td style={{ color: '#4ade80', fontWeight: 600 }}>
                              +{fmt(v.subscribersGained !== undefined ? v.subscribersGained : Math.round(v.views * 0.014))}
                            </td>
                            <td>{v.viewsFormatted || fmt(v.views)}</td>
                            <td>
                              <span style={{ color: '#38bdf8', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                ⏱️ {v.avgViewDuration || formatSecondsToAvd(v.avgViewDurationSecs || 105)}
                              </span>
                            </td>
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

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
              <button className="crm-apply-btn" onClick={applyChannel}>
                Apply Changes to YouTube Studio
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-edit"
                onClick={() => {
                  setChannelDraft(d => ({
                    ...d,
                    viewsLast28Days: totalViews,
                    revenueLast28Days: parseFloat(totalRevenue.toFixed(2)),
                    watchTimeLast28Days: Math.round(totalViews * (2.8 / 60))
                  }));
                }}
              >
                📊 Auto-align with sum of all videos
              </button>
            </div>
          </div>
        )}

        {/* ── DATES & RANGE CONTROL ── */}
        {activeSection === 'dates' && (
          <div className="crm-section">
            <div className="crm-grid-2">
              {/* Anchor Date Card */}
              <div className="crm-card">
                <div className="crm-card-title">📅 1. Simulation Anchor Date (Today)</div>
                <p className="crm-card-desc">
                  Controls the current end date for all time-series simulations and analytics calculations across YouTube Studio.
                </p>

                <div className="crm-field">
                  <label className="crm-field-label">Anchor Date (YYYY-MM-DD)</label>
                  <input
                    className="crm-input"
                    type="date"
                    value={dateDraft.anchorDate}
                    onChange={e => {
                      const newAnchor = e.target.value;
                      if (newAnchor) {
                        const d = new Date(`${newAnchor}T00:00:00Z`);
                        d.setUTCDate(d.getUTCDate() - 27);
                        const autoStart = d.toISOString().split('T')[0];
                        setDateDraft(prev => ({
                          ...prev,
                          anchorDate: newAnchor,
                          endDate: newAnchor,
                          startDate: autoStart
                        }));
                      }
                    }}
                  />
                </div>

                <div className="crm-quick-pill-row" style={{ marginTop: 8 }}>
                  <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick anchor presets:</span>
                  {[
                    { label: 'Aug 12, 2026 (Default)', date: '2026-08-12' },
                    { label: 'Aug 14, 2026', date: '2026-08-14' },
                    { label: 'Aug 4, 2026', date: '2026-08-04' },
                    { label: 'Jul 31, 2026', date: '2026-07-31' },
                    { label: 'Device Date', date: new Date().toISOString().split('T')[0] }
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      className={`crm-mini-pill ${dateDraft.anchorDate === p.date ? 'active-pill' : ''}`}
                      onClick={() => {
                        const d = new Date(`${p.date}T00:00:00Z`);
                        d.setUTCDate(d.getUTCDate() - 27);
                        const autoStart = d.toISOString().split('T')[0];
                        setDateDraft(prev => ({
                          ...prev,
                          anchorDate: p.date,
                          endDate: p.date,
                          startDate: autoStart
                        }));
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range Preset Selector */}
              <div className="crm-card">
                <div className="crm-card-title">⚙️ 2. Active Analytics Preset</div>
                <p className="crm-card-desc">
                  Select which period YouTube Studio opens by default.
                </p>

                <div className="crm-field">
                  <label className="crm-field-label">Active Preset Range</label>
                  <select
                    className="crm-input"
                    style={{ background: '#121224', color: '#fff', cursor: 'pointer' }}
                    value={dateDraft.preset}
                    onChange={e => setDateDraft(prev => ({ ...prev, preset: e.target.value }))}
                  >
                    <option value="last28">Last 28 days (Default)</option>
                    <option value="last7">Last 7 days</option>
                    <option value="last90">Last 90 days</option>
                    <option value="365">Last 365 days</option>
                    <option value="lifetime">Lifetime</option>
                    <option value="august">August 2026</option>
                    <option value="july">July 2026</option>
                    <option value="june">June 2026</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </div>

                <div className="crm-quick-pill-row" style={{ marginTop: 8 }}>
                  <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick presets:</span>
                  {[
                    { label: 'Last 28 days', key: 'last28' },
                    { label: 'Last 7 days', key: 'last7' },
                    { label: 'Last 90 days', key: 'last90' },
                    { label: 'August', key: 'august' },
                    { label: 'Custom', key: 'custom' }
                  ].map(p => (
                    <button
                      key={p.key}
                      type="button"
                      className={`crm-mini-pill ${dateDraft.preset === p.key ? 'active-pill' : ''}`}
                      onClick={() => setDateDraft(prev => ({ ...prev, preset: p.key }))}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Date Range Window Card */}
              <div className="crm-card">
                <div className="crm-card-title">📆 3. Custom Date Range Window</div>
                <p className="crm-card-desc">
                  Directly customize start and end dates. Used for "Last 28 days" and "Custom" ranges.
                </p>

                <div className="crm-grid-2">
                  <div className="crm-field">
                    <label className="crm-field-label">Start Date</label>
                    <input
                      className="crm-input"
                      type="date"
                      value={dateDraft.startDate}
                      onChange={e => setDateDraft(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="crm-field">
                    <label className="crm-field-label">End Date</label>
                    <input
                      className="crm-input"
                      type="date"
                      value={dateDraft.endDate}
                      onChange={e => setDateDraft(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="crm-quick-pill-row" style={{ marginTop: 8 }}>
                  <span className="crm-field-label" style={{ marginBottom: 0 }}>28-day templates:</span>
                  {[
                    { label: 'Jul 16 – Aug 12, 2026 (Default)', start: '2026-07-16', end: '2026-08-12' },
                    { label: 'Jul 18 – Aug 14, 2026', start: '2026-07-18', end: '2026-08-14' },
                    { label: 'Jul 7 – Aug 4, 2026', start: '2026-07-07', end: '2026-08-04' },
                    { label: 'Jun 18 – Jul 15, 2026', start: '2026-06-18', end: '2026-07-15' },
                  ].map(t => (
                    <button
                      key={t.label}
                      type="button"
                      className={`crm-mini-pill ${dateDraft.startDate === t.start && dateDraft.endDate === t.end ? 'active-pill' : ''}`}
                      onClick={() => setDateDraft(prev => ({
                        ...prev,
                        startDate: t.start,
                        endDate: t.end,
                        anchorDate: t.end
                      }))}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="crm-card crm-preview-bar-vertical">
                <div className="crm-card-title">🔍 Live Date Preview</div>
                <div className="crm-date-preview-box">
                  <div className="date-preview-main-badge">
                    {formatDateRangeText(dateDraft.startDate, dateDraft.endDate)}
                  </div>
                  <div className="date-preview-details">
                    <div><strong>Active Preset:</strong> {dateDraft.preset}</div>
                    <div><strong>Start Date:</strong> {dateDraft.startDate}</div>
                    <div><strong>End Date:</strong> {dateDraft.endDate}</div>
                    <div><strong>Duration:</strong> {Math.max(1, Math.round((new Date(dateDraft.endDate) - new Date(dateDraft.startDate)) / (1000 * 60 * 60 * 24)) + 1)} days</div>
                    <div style={{ color: '#4ade80', fontSize: '12px', marginTop: '6px' }}>
                      ✓ Synchronizes automatically to: Overview AreaChart, Reach/Content Chart, Engagement Chart, Audience Chart, Revenue Chart, Trends Chart & Tooltips.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="crm-apply-btn" onClick={applyDates}>
                Apply Date Range to YouTube Studio & Graphs
              </button>
              <button
                type="button"
                className="crm-btn crm-btn-cancel"
                onClick={() => {
                  setDateDraft({
                    anchorDate: '2026-08-12',
                    startDate: '2026-07-16',
                    endDate: '2026-08-12',
                    preset: 'last28'
                  });
                }}
              >
                🔄 Reset to Jul 16 – Aug 12, 2026
              </button>
            </div>
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
              <div className="crm-quick-pill-row" style={{ marginTop: 6 }}>
                <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick RPM:</span>
                {[30, 35, 50, 75, 100, 150].map(r => (
                  <button
                    key={r}
                    type="button"
                    className="crm-mini-pill"
                    onClick={() => setBulkRPM(r)}
                  >
                    ₹{r}
                  </button>
                ))}
              </div>
              <div className="crm-preview-small" style={{ marginTop: 10 }}>
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
              <div className="crm-quick-pill-row" style={{ marginTop: 6 }}>
                <span className="crm-field-label" style={{ marginBottom: 0 }}>Quick multipliers:</span>
                {[0.8, 1.25, 1.5, 2.0, 5.0, 10.0].map(m => (
                  <button
                    key={m}
                    type="button"
                    className="crm-mini-pill"
                    onClick={() => setBulkFactor(m)}
                  >
                    {m}×
                  </button>
                ))}
              </div>
              <div className="crm-preview-small" style={{ marginTop: 10 }}>
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
                      <th>Avg Duration (AVD)</th>
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
                        <td><span style={{ color: '#38bdf8' }}>⏱️ {v.avgViewDuration || formatSecondsToAvd(v.avgViewDurationSecs || 105)}</span></td>
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
