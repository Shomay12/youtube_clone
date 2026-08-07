import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import './CRM.css';

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(2)}K`
  : String(Math.round(n));

const fmtUSD = (n) =>
  `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── sub-components ───────────────────────────────────────────────────────────
const StatPreview = ({ label, value, color = '#a78bfa' }) => (
  <div className="crm-stat-preview">
    <span className="crm-stat-label">{label}</span>
    <span className="crm-stat-value" style={{ color }}>{value}</span>
  </div>
);

const CRMInput = ({ label, value, onChange, type = 'number', min, max, step = 1, unit }) => (
  <div className="crm-field">
    <label className="crm-field-label">{label}{unit && <span className="crm-unit">{unit}</span>}</label>
    <input
      className="crm-input"
      type={type}
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

  const [activeSection, setActiveSection] = useState('channel');
  const [videoSearch, setVideoSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({});
  const [bulkRPM, setBulkRPM] = useState(33.64);
  const [bulkFactor, setBulkFactor] = useState(1.0);
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
    setEditBuf({ views: v.views, likes: v.likes, comments: v.comments, rpm: v.rpm || 33.64 });
  }
  function saveEdit(id) {
    updateVideoMetrics(id, editBuf);
    setEditingId(null);
    showToast('Video metrics updated ✓', 'success');
  }
  function cancelEdit() { setEditingId(null); }

  function applyChannel() {
    crmUpdateChannelMetrics(channelDraft);
    showToast('Channel metrics updated ✓', 'success');
  }

  function applyBulkRPM() {
    bulkSetVideoRPM(bulkRPM);
    showToast(`RPM set to $${bulkRPM} for all videos ✓`, 'success');
  }

  function applyBulkMultiply() {
    bulkMultiplyViews(bulkFactor);
    showToast(`All video views multiplied by ${bulkFactor}× ✓`, 'success');
  }

  const navItems = [
    { key: 'channel',  icon: '📡', label: 'Channel Metrics' },
    { key: 'videos',   icon: '🎬', label: 'Videos Manager' },
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
            <div className="crm-logo-sub">Data Control Panel</div>
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
              {activeSection === 'channel' && 'Edit channel-level stats — changes reflect instantly in YouTube Studio'}
              {activeSection === 'videos' && 'Edit per-video metrics — revenue auto-recalculates from Views × RPM'}
              {activeSection === 'bulk' && 'Apply batch changes across all videos at once'}
              {activeSection === 'preview' && 'Read-only live snapshot of current store values'}
            </p>
          </div>
          <div className="crm-header-badges">
            <span className="crm-badge crm-badge-green">● Live</span>
            <span className="crm-badge">{videos.length} videos</span>
          </div>
        </div>

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
                  onChange={v => setChannelDraft(d => ({ ...d, revenueLast28Days: v }))} min={0} step={100} unit="$" />
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
              <StatPreview label="Revenue 28d" value={fmtUSD(channelDraft.revenueLast28Days)} color="#fbbf24" />
            </div>

            <button className="crm-apply-btn" onClick={applyChannel}>
              Apply Changes to YouTube Studio
            </button>
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
                    <th>Video</th>
                    <th>Views</th>
                    <th>Likes</th>
                    <th>Comments</th>
                    <th>RPM ($)</th>
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
                          <img src={v.thumbnail} alt="" className="crm-vid-thumb" />
                          <span className="crm-vid-name">{v.title}</span>
                        </td>
                        {isEditing ? (
                          <>
                            <td><input className="crm-inline-input" type="number" min={0} value={editBuf.views}
                              onChange={e => setEditBuf(b => ({ ...b, views: Number(e.target.value) }))} /></td>
                            <td><input className="crm-inline-input" type="number" min={0} value={editBuf.likes}
                              onChange={e => setEditBuf(b => ({ ...b, likes: Number(e.target.value) }))} /></td>
                            <td><input className="crm-inline-input" type="number" min={0} value={editBuf.comments}
                              onChange={e => setEditBuf(b => ({ ...b, comments: Number(e.target.value) }))} /></td>
                            <td><input className="crm-inline-input" type="number" min={0} step={0.01} value={editBuf.rpm}
                              onChange={e => setEditBuf(b => ({ ...b, rpm: Number(e.target.value) }))} /></td>
                            <td className="crm-revenue-preview">
                              {fmtUSD((editBuf.views / 1000) * editBuf.rpm)}
                            </td>
                            <td className="crm-action-cell">
                              <button className="crm-btn crm-btn-save" onClick={() => saveEdit(v.id)}>Save</button>
                              <button className="crm-btn crm-btn-cancel" onClick={cancelEdit}>Cancel</button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{v.viewsFormatted || fmt(v.views)}</td>
                            <td>{(v.likes || 0).toLocaleString()}</td>
                            <td>{(v.comments || 0).toLocaleString()}</td>
                            <td>${(v.rpm || 33.64).toFixed(2)}</td>
                            <td className="crm-revenue-cell">{v.revenueFormatted || fmtUSD(v.revenue || 0)}</td>
                            <td className="crm-action-cell">
                              <button className="crm-btn crm-btn-edit" onClick={() => startEdit(v)}>Edit</button>
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

        {/* ── BULK ACTIONS ── */}
        {activeSection === 'bulk' && (
          <div className="crm-section crm-grid-2">
            <div className="crm-card">
              <div className="crm-card-title">💲 Set Global RPM</div>
              <p className="crm-card-desc">Override RPM for every video. Revenue will be recalculated automatically (Revenue = Views / 1000 × RPM).</p>
              <CRMInput label="RPM ($)" value={bulkRPM}
                onChange={v => setBulkRPM(v)} min={0} step={0.01} unit="$" />
              <div className="crm-preview-small">
                Estimated total revenue at this RPM: <strong>{fmtUSD((totalViews / 1000) * bulkRPM)}</strong>
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
                <button className="crm-btn crm-btn-edit" style={{ background: '#1e1035', color: '#a78bfa' }} onClick={() => { crmApplyPreset('viral'); showToast('Loaded Viral Spike preset (45M views, $185k rev) ✓', 'success'); }}>
                  🚀 Viral Spike (45M Views)
                </button>
                <button className="crm-btn crm-btn-edit" style={{ background: '#172554', color: '#60a5fa' }} onClick={() => { crmApplyPreset('high_rpm'); showToast('Set High RPM preset ($85.50 RPM) ✓', 'success'); }}>
                  💰 High RPM ($85.50 RPM)
                </button>
                <button className="crm-btn crm-btn-cancel" onClick={() => { reloadFromSpreadsheet(); showToast('Reset to original spreadsheet data ✓', 'info'); }}>
                  🔄 Reset Baseline
                </button>
              </div>
            </div>

            <div className="crm-card crm-card-warning">
              <div className="crm-card-title">⚠️ Notes</div>
              <ul className="crm-warning-list">
                <li>Changes are <strong>in-memory only</strong> — they reset on page refresh.</li>
                <li>Revenue is always auto-calculated as <code>Views / 1000 × RPM</code>.</li>
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
                <StatPreview label="Total Revenue" value={fmtUSD(totalRevenue)} color="#fbbf24" />
                <StatPreview label="Avg RPM" value={`$${avgRPM}`} color="#a78bfa" />
                <StatPreview label="Total Likes" value={fmt(videos.reduce((a, v) => a + (v.likes || 0), 0))} color="#f472b6" />
                <StatPreview label="Total Comments" value={fmt(videos.reduce((a, v) => a + (v.comments || 0), 0))} />
              </div>

              {/* Top 5 videos */}
              <div className="crm-card">
                <div className="crm-card-title">🏆 Top 5 by Revenue</div>
                {[...videos].sort((a, b) => (b.revenue || 0) - (a.revenue || 0)).slice(0, 5).map(v => (
                  <div key={v.id} className="crm-top-item">
                    <span className="crm-top-name">{v.title}</span>
                    <span className="crm-top-val">{v.revenueFormatted || fmtUSD(v.revenue || 0)}</span>
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
                    <tr><th>Title</th><th>Views</th><th>Likes</th><th>RPM</th><th>Revenue</th></tr>
                  </thead>
                  <tbody>
                    {videos.map(v => (
                      <tr key={v.id}>
                        <td className="crm-vid-name" style={{ maxWidth: 260 }}>{v.title}</td>
                        <td>{v.viewsFormatted}</td>
                        <td>{(v.likes || 0).toLocaleString()}</td>
                        <td>${(v.rpm || 33.64).toFixed(2)}</td>
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
