import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import './Analytics.css';

const StudioCard = ({ title, subtitle, infoIcon, children, className = '', headerExtra = null }) => (
  <section className={`studio-analytics-card ${className}`}>
    {(title || subtitle || headerExtra) && (
      <div className="studio-card-header">
        <div>
          {title && (
            <h3>
              {title} {infoIcon && <span className="material-symbols-outlined card-info-icon" title="More info">info</span>}
            </h3>
          )}
          {subtitle && <p className="studio-card-subtitle">{subtitle}</p>}
        </div>
        {headerExtra}
      </div>
    )}
    {children}
  </section>
);

const FormatDistributionRow = ({ label, value, formattedValue, maxVal = 100, barColor = '#a855f7' }) => {
  const numericVal = typeof value === 'number' ? value : parseFloat(value) || 0;
  const pct = maxVal > 0 ? Math.min(100, Math.max(0, (numericVal / maxVal) * 100)) : 0;
  return (
    <div className="format-dist-row">
      <span className="dist-label">{label}</span>
      <div className="dist-bar-track">
        <div className="dist-bar-fill" style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: barColor }} />
      </div>
      <span className="dist-value-text">{formattedValue || value}</span>
    </div>
  );
};

const Analytics = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const CHANNEL_PREFIX = '/channel/UCqpdVWIzEQUcbf4pAxlneOQ';

  const {
    videos,
    channelInfo,
    selectedDateRange,
    setDateRange,
    getAnalyticsForRange,
    realtimeDataset,
    tickRealtime
  } = useStore();

  const [activeTab, setActiveTab] = useState('Overview');

  // Derive video context BEFORE the useEffect that depends on isVideoMode
  const searchParams = new URLSearchParams(location.search);
  const videoIdFromQuery = searchParams.get('video') || searchParams.get('v');
  const targetVideoId = id || videoIdFromQuery;
  const video = targetVideoId ? videos.find(v => v.id === targetVideoId || String(v.id) === String(targetVideoId)) : null;
  const isVideoMode = Boolean(video);
  const currentVideo = video || videos[0] || {};

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('tab-reach') || path.includes('tab-content')) setActiveTab(isVideoMode ? 'Reach' : 'Content');
    else if (path.includes('tab-engagement')) setActiveTab('Engagement');
    else if (path.includes('tab-audience')) setActiveTab('Audience');
    else if (path.includes('tab-revenue')) setActiveTab('Revenue');
    else if (path.includes('tab-trends')) setActiveTab('Trends');
    else if (path.includes('tab-overview')) setActiveTab('Overview');
  }, [location.pathname, isVideoMode]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    const slug = `tab-${tabName.toLowerCase()}`;
    const search = location.search ? location.search : '';
    navigate(`${CHANNEL_PREFIX}/analytics/${slug}/period-last-28-days${search}`);
  };
  const [selectedMetric, setSelectedMetric] = useState('views');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [contentSubTab, setContentSubTab] = useState('All');
  const [revenueSubTab, setRevenueSubTab] = useState('All');
  const [audienceFormatFilter, setAudienceFormatFilter] = useState('Videos · Shorts');
  const [audiencePopularFilter, setAudiencePopularFilter] = useState('New');
  const [ageGenderFilter, setAgeGenderFilter] = useState('All');
  const [topGeographiesFilter, setTopGeographiesFilter] = useState('All');
  const [revenueMakeMoneyFilter, setRevenueMakeMoneyFilter] = useState('All');
  const [revenueContentFilter, setRevenueContentFilter] = useState('Videos');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('All');

  // Continuous Realtime Ticker Interval
  useEffect(() => {
    const timer = setInterval(() => {
      tickRealtime();
    }, 5000);
    return () => clearInterval(timer);
  }, [tickRealtime]);

  // Compute analytics dynamically based on selected date range & video from Excel data
  const computedData = useMemo(() => {
    return getAnalyticsForRange(selectedDateRange, isVideoMode ? currentVideo.id : null);
  }, [selectedDateRange, isVideoMode, currentVideo.id, getAnalyticsForRange]);

  const { daily, aggregated, trafficSources, audience, dateRangeLabel } = computedData;

  // Enhance daily data with typical range simulation for Recharts
  const dailyWithTypical = useMemo(() => {
    return (daily || []).map((item) => {
      const val = item[selectedMetric] || 0;
      const baseTypical = typeof val === 'number' ? val * 0.85 : 1000;
      const revVal = Number(item.revenue) || 0;
      return {
        ...item,
        typicalLower: Math.round(baseTypical * 0.7),
        typicalUpper: Math.round(baseTypical * 1.3),
        revenueTypicalUpper: Math.round(revVal * 1.15)
      };
    });
  }, [daily, selectedMetric]);

  // Calculate dynamic Y-axis domain for Revenue chart with 5-10% padding
  const revenueDomain = useMemo(() => {
    if (!daily || daily.length === 0) return [0, 'auto'];
    const revValues = daily.map(d => Number(d.revenue) || 0);
    if (revValues.length === 0) return [0, 'auto'];
    const minRev = Math.min(...revValues);
    const maxRev = Math.max(...revValues);
    const diff = maxRev - minRev;
    const padding = diff > 0 ? diff * 0.1 : maxRev * 0.1;
    const step = Math.pow(10, Math.floor(Math.log10(maxRev || 100))) / 10;
    const roundStep = step > 0 ? step : 50;
    const lower = Math.max(0, Math.floor((minRev - padding) / roundStep) * roundStep);
    const upper = Math.ceil((maxRev + padding) / roundStep) * roundStep;
    return [lower, upper];
  }, [daily]);

  // Custom tooltips for Recharts formatted in USD ($)
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const val = payload[0].value;
      const formatted = selectedMetric === 'revenue' 
        ? `$${val?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : (val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : val >= 1000 ? `${(val/1000).toFixed(1)}K` : val);
      return (
        <div className="yt-chart-tooltip">
          <div className="tooltip-date">{label}</div>
          <div className="tooltip-value">
            <span className="tooltip-dot" />
            <span>{selectedMetric.toUpperCase()}: <strong>{formatted}</strong></span>
          </div>
        </div>
      );
    }
    return null;
  };

  const DATE_PRESETS = [
    { key: 'last28', label: 'Last 28 days' },
    { key: 'last7', label: 'Last 7 days' },
    { key: 'last90', label: 'Last 90 days' },
    { key: '365', label: 'Last 365 days' },
    { key: 'lifetime', label: 'Lifetime' },
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' }
  ];

  // Top videos sorted by revenue calculated using (Views / 1000) * RPM
  const topEarningVideos = useMemo(() => {
    return [...videos].map(v => {
      const views = v.views || 0;
      const rpm = v.rpm || 33.64;
      const calculatedRevenue = (views / 1000) * rpm;
      return {
        ...v,
        calculatedRevenue,
        calculatedRevenueFormatted: `$${calculatedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      };
    }).sort((a, b) => b.calculatedRevenue - a.calculatedRevenue);
  }, [videos]);

  // Channels your audience watches dataset
  const audienceChannels = [
    { name: 'Invisible Gyan', subs: '477.0K subscribers', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { name: 'Rahul Upmanyu', subs: '318.0K subscribers', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { name: 'Shivani Raaz Shukla 2.0', subs: '117.0K subscribers', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80' },
    { name: 'THE RADIO TV', subs: '366.0K subscribers', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80' },
    { name: 'Saddam Kassim', subs: '1.0M subscribers', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80' }
  ];

  return (
    <div className="dashboard-container analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="dashboard-title">
            {isVideoMode ? 'Video analytics' : 'Channel analytics'}
          </h1>
          
          {/* Prompt Pills under Title */}
          <div className="analytics-prompt-pills">
            <button className="prompt-pill">
              <span className="sparkle-icon">✦</span> How did viewers find my content?
            </button>
            <button className="prompt-pill">
              <span className="sparkle-icon">✦</span> How many new viewers did I reach?
            </button>
            <button className="prompt-pill">
              <span className="sparkle-icon">✦</span> Summarize my latest video performance
            </button>
            <button className="prompt-more-btn" title="More options">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </div>

        <div className="analytics-header-right">
          <button className="advanced-mode-btn">
            Advanced mode
          </button>

          <div className="yt-date-selector-wrapper">
            <div 
              className="yt-date-selector" 
              onClick={() => setShowDatePicker(!showDatePicker)}
              title="Select analytics date range"
            >
              <span className="date-sub-text">{isVideoMode ? 'Jul 22, 2026 – Now' : dateRangeLabel}</span>
              <span className="date-main-text">
                <span>{isVideoMode ? 'Since published' : (DATE_PRESETS.find(p => p.key === selectedDateRange)?.label || 'Last 28 days')}</span>
                <span className="material-symbols-outlined date-arrow">keyboard_arrow_down</span>
              </span>
            </div>

            {showDatePicker && (
              <div className="date-picker-dropdown">
                <div className="dropdown-header">Select Date Range</div>
                {DATE_PRESETS.map(preset => (
                  <div
                    key={preset.key}
                    className={`date-option ${selectedDateRange === preset.key ? 'active' : ''}`}
                    onClick={() => {
                      setDateRange(preset.key);
                      setShowDatePicker(false);
                    }}
                  >
                    <span>{preset.label}</span>
                    {selectedDateRange === preset.key && <span className="material-symbols-outlined check-ic">check</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="content-tabs">
        {(isVideoMode ? ['Overview', 'Reach', 'Engagement', 'Audience', 'Revenue'] : ['Overview', 'Content', 'Audience', 'Revenue', 'Trends']).map(tab => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'Overview' && (
        <div className="overview-tab-content">
          <div className="analytics-headline-box">
            <h2 className="analytics-headline-title">
              {isVideoMode 
                ? 'Views are up 51%! More people than usual are watching this video from YouTube search results.'
                : 'Keep it up! Your channel got about the same number of views as usual.'}
            </h2>
            <p className="analytics-headline-sub">
              {isVideoMode
                ? `This video has gotten ${aggregated.viewsFormatted || '45.1K'} views since it was published`
                : `Your channel got ${aggregated.viewsFormatted} views in this selected period`}
            </p>
          </div>

          <div className="analytics-main-grid">
            {/* Left Column: Hero Chart & Top Content */}
            <div className="overview-left-column">
              <div className="analytics-card hero-chart-card">
                {/* 4 Metric selector tabs */}
                <div className="metrics-selector-row">
                  <div
                    className={`metric-selector-item ${selectedMetric === 'views' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('views')}
                  >
                    <div className="metric-selector-label">Views</div>
                    <div className="metric-selector-val">
                      <span>{aggregated.viewsFormatted || '45.1K'}</span>
                      <span className="material-symbols-outlined" style={{ color: '#2ba640', fontSize: '20px', marginLeft: '6px' }} title="Check badge">check_circle</span>
                    </div>
                    <div className="metric-sub-label">{isVideoMode ? '15.3K more than usual' : 'About the same as usual'}</div>
                  </div>

                  <div
                    className={`metric-selector-item ${selectedMetric === 'watchTimeHrs' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('watchTimeHrs')}
                  >
                    <div className="metric-selector-label">Watch time (hours)</div>
                    <div className="metric-selector-val">
                      <span>{aggregated.watchTimeHrsFormatted || '1.3K'}</span>
                      <span className="material-symbols-outlined" style={{ color: '#2ba640', fontSize: '20px', marginLeft: '6px' }} title="Check badge">check_circle</span>
                    </div>
                    <div className="metric-sub-label">{isVideoMode ? 'About the same as usual' : 'In this period'}</div>
                  </div>

                  <div
                    className={`metric-selector-item ${selectedMetric === 'subscribersNet' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('subscribersNet')}
                  >
                    <div className="metric-selector-label">Subscribers</div>
                    <div className="metric-selector-val">
                      <span>{aggregated.subscribersNetFormatted || '+214'}</span>
                    </div>
                    <div className="metric-sub-label">In this period</div>
                  </div>

                  <div
                    className={`metric-selector-item ${selectedMetric === 'revenue' ? 'active' : ''}`}
                    onClick={() => setSelectedMetric('revenue')}
                  >
                    <div className="metric-selector-label">Estimated revenue <span className="material-symbols-outlined card-info-icon">info</span></div>
                    <div className="metric-selector-val">
                      <span>{aggregated.revenueFormatted || '₹5,849.33'}</span>
                    </div>
                    <div className="metric-sub-label">Derived from (Views / 1000) × RPM</div>
                  </div>
                </div>

                {/* Chart Area */}
                <div className="chart-container-wrapper">
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={dailyWithTypical} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis dataKey="date" stroke="#717171" tickLine={false} axisLine={false} />
                      <YAxis orientation="right" stroke="#717171" tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="typicalUpper" stroke="none" fill="rgba(255, 255, 255, 0.05)" />
                      <Area type="monotone" dataKey={selectedMetric} stroke="#00e5ff" strokeWidth={2.5} fill="url(#colorBlue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="card-footer-action">
                  <button className="see-more-btn">See more</button>
                </div>
              </div>

              {/* If Video Mode, show What's going on & How viewers found this video cards */}
              {isVideoMode ? (
                <>
                  <StudioCard title="What's going on?">
                    <div style={{ padding: '4px 0', fontSize: '13px', color: '#f1f1f1', lineHeight: '1.6' }}>
                      <p style={{ marginBottom: '16px', color: '#aaaaaa' }}>
                        This video is appearing more often on YouTube search results compared to other videos on your channel.
                        The topic or format of this video might be driving more interest from search results. Think about how you can use this in the future.
                      </p>
                      <div style={{ fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span className="material-symbols-outlined" style={{ color: '#2ba640', fontSize: '20px' }}>check_circle</span>
                        <strong>More impressions from YouTube search</strong>
                      </div>
                      <p style={{ color: '#aaaaaa', fontSize: '12px', paddingLeft: '28px' }}>
                        This video appeared 361,089 times in search results — that's more than the 6,600–68,300 that's typical in this time frame.
                      </p>
                    </div>
                  </StudioCard>

                  <StudioCard title="How viewers found this video" subtitle="Traffic sources">
                    <div style={{ padding: '4px 0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #303030', color: '#aaaaaa', fontSize: '12px' }}>
                        <span>Traffic source</span>
                        <span>% of views</span>
                        <span>Views</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span>YouTube search</span>
                          <span style={{ color: '#aaaaaa' }}>81.1%</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            36.6K <span className="material-symbols-outlined" style={{ color: '#2ba640', fontSize: '20px' }}>arrow_circle_up</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span>YouTube recommendations</span>
                          <span style={{ color: '#aaaaaa' }}>7.6%</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            3.4K <span className="material-symbols-outlined" style={{ color: '#aaaaaa', fontSize: '20px' }}>arrow_circle_down</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingLeft: '16px' }}>
                          <span style={{ color: '#aaaaaa' }}>↳ YouTube Home</span>
                          <span style={{ color: '#aaaaaa' }}>6.8%</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            3.1K <span className="material-symbols-outlined" style={{ color: '#aaaaaa', fontSize: '20px' }}>arrow_circle_down</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', paddingLeft: '16px' }}>
                          <span style={{ color: '#aaaaaa' }}>↳ Up next</span>
                          <span style={{ color: '#aaaaaa' }}>0.8%</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            360 <span className="material-symbols-outlined" style={{ color: '#aaaaaa', fontSize: '20px' }}>arrow_circle_down</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span>Other YouTube features</span>
                          <span style={{ color: '#aaaaaa' }}>6.9%</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            3.1K <span className="material-symbols-outlined" style={{ color: '#717171', fontSize: '20px' }}>remove</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span>Direct or unknown</span>
                          <span style={{ color: '#aaaaaa' }}>1.1%</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            496 <span className="material-symbols-outlined" style={{ color: '#717171', fontSize: '20px' }}>remove</span>
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                          <span>Other</span>
                          <span style={{ color: '#aaaaaa' }}>2.3%</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            1K <span className="material-symbols-outlined" style={{ color: '#717171', fontSize: '20px' }}>remove</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </StudioCard>
                </>
              ) : (
                /* Your top content in this period Card */
                <StudioCard title="Your top content in this period">
                  <div className="top-content-table-container">
                    <div className="top-content-header-row">
                      <span className="col-content">Content</span>
                      <span className="col-duration">Average view duration</span>
                      <span className="col-views">Views</span>
                    </div>

                    <div className="top-content-list">
                      {videos.slice(0, 7).map((vid, idx) => (
                        <div className="top-content-row" key={vid.id || idx}>
                          <span className="row-number">{idx + 1}</span>
                          <img src={vid.thumbnail} alt="" className="row-thumb" />
                          <div className="row-info">
                            <div className="row-title" title={vid.title}>{vid.title}</div>
                            {idx === 0 ? (
                              <button className="brainstorm-pill">
                                <span className="sparkle-icon">✦</span> Brainstorm video ideas
                              </button>
                            ) : (
                              <span className="row-date">{vid.publishDate || vid.date || 'Jul 9, 2026'}</span>
                            )}
                          </div>
                          <span className="row-duration">{vid.avgViewDuration || vid.duration || '10:18'} ({vid.ctr ? `${vid.ctr}%` : '29.3%'})</span>
                          <span className="row-views">{vid.viewsFormatted || vid.views?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </StudioCard>
              )}
            </div>

            {/* Right Column: Realtime, Podcast & Latest Content Rail */}
            <aside className="overview-right-rail">
              {/* Realtime Card */}
              <div className="studio-analytics-card realtime-rail-card">
                <div className="realtime-header-title">Realtime</div>
                <div className="realtime-status-row">
                  <span className="live-dot" /> Updating live
                </div>
                <div className="realtime-big-number">{isVideoMode ? '183' : (channelInfo.subscribers?.toLocaleString() || aggregated.subscribersNet?.toLocaleString())}</div>
                <div className="realtime-sub-text">{isVideoMode ? 'Views · Last 48 hours' : 'Subscribers'}</div>
                
                {!isVideoMode && <button className="see-live-count-btn">See live count</button>}

                {!isVideoMode && <hr className="studio-divider" />}

                {!isVideoMode && <div className="realtime-big-number">{realtimeDataset.total48HourViews?.toLocaleString()}</div>}
                {!isVideoMode && <div className="realtime-sub-text">Views · Last 48 hours</div>}

                <div className="realtime-bar-chart-box">
                  <ResponsiveContainer width="100%" height={60}>
                    <BarChart data={realtimeDataset.last48Hours}>
                      <Bar dataKey="views" fill="#35b7e6" radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="chart-time-labels">
                    <span>-48h</span>
                    <span>Now</span>
                  </div>
                </div>

                {isVideoMode ? (
                  <div className="realtime-top-content-section" style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#aaaaaa', marginBottom: '8px' }}>
                      <span>Top traffic sources</span>
                      <span>Views</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                      <span>YouTube search</span>
                      <span>47.5%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                      <span>Browse features</span>
                      <span>18.6%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                      <span>Channel pages</span>
                      <span>14.2%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                      <span>Other YouTube features</span>
                      <span>9.3%</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0' }}>
                      <span>External</span>
                      <span>3.6%</span>
                    </div>
                  </div>
                ) : (
                  <div className="realtime-top-content-section">
                    <div className="top-content-rail-header">
                      <span>Top content</span>
                      <span>Views</span>
                    </div>
                    {videos.slice(0, 3).map(v => (
                      <div className="rail-content-row" key={v.id}>
                        <img src={v.thumbnail} alt="" />
                        <span className="rail-title">{v.title}</span>
                        <span className="rail-val">{(v.views * 0.08).toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button className="see-more-btn margin-top-12">See more</button>
              </div>

              {/* Podcast Card */}
              <div className="studio-analytics-card podcast-rail-card">
                <h3>Podcast</h3>
                <div className="podcast-info-row">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Podcast" className="podcast-thumb" />
                  <div>
                    <div className="podcast-title">Success Story</div>
                    <div className="podcast-sub">Updated 6 months ago</div>
                  </div>
                </div>
                <div className="stat-flex-row">
                  <span>Views</span>
                  <strong>{videos[0]?.views ? Math.round(videos[0].views * 0.05).toLocaleString() : '62'}</strong>
                </div>
                <div className="stat-flex-row">
                  <span>Watch time (hours)</span>
                  <strong>{videos[0]?.watchTimeHrs ? (videos[0].watchTimeHrs * 0.05).toFixed(1) : '1.5'}</strong>
                </div>
                <button className="see-podcast-btn">See podcast analytics</button>
              </div>

              {/* Latest Content Card */}
              <div className="studio-analytics-card latest-content-card">
                <h3>Latest content</h3>
                <div className="latest-video-banner">
                  <img src={currentVideo.thumbnail || "/thumbnails/1.webp"} alt="Latest video" />
                  <div className="latest-video-overlay-title">
                    {currentVideo.title || "Latest Content"}
                  </div>
                </div>
                <div className="latest-time-text">First 13 days 3 hours</div>

                <div className="stat-flex-row">
                  <span>Views</span>
                  <span className="stat-val-with-icon">
                    {currentVideo.viewsFormatted || '44.9K'} <span className="green-arrow-small">↑</span>
                  </span>
                </div>
                <div className="stat-flex-row">
                  <span>Impressions click-through rate</span>
                  <span className="stat-val-with-icon">
                    {currentVideo.ctr ? `${currentVideo.ctr}%` : '9.0%'} <span className="green-arrow-small">↑</span>
                  </span>
                </div>
                <div className="stat-flex-row">
                  <span>Average view duration</span>
                  <span className="stat-val-with-icon">
                    {currentVideo.avgViewDuration || '1:45'} <span className="gray-arrow-small">↓</span>
                  </span>
                </div>

                <button className="see-video-analytics-btn">See video analytics</button>
              </div>
            </aside>
          </div>
        </div>
      )}

      {/* REACH TAB (Video Analytics Mode) */}
      {activeTab === 'Reach' && (
        <div className="reach-tab-page">
          <div className="analytics-card hero-chart-card">
            <div className="metrics-selector-row">
              <div className={`metric-selector-item ${selectedMetric === 'impressions' ? 'active' : ''}`} onClick={() => setSelectedMetric('impressions')}>
                <div className="metric-selector-label">Impressions</div>
                <div className="metric-selector-val"><span>4.4L</span></div>
              </div>
              <div className={`metric-selector-item ${selectedMetric === 'ctr' ? 'active' : ''}`} onClick={() => setSelectedMetric('ctr')}>
                <div className="metric-selector-label">Impressions click-through rate</div>
                <div className="metric-selector-val"><span>9.0%</span></div>
              </div>
              <div className={`metric-selector-item ${selectedMetric === 'views' ? 'active' : ''}`} onClick={() => setSelectedMetric('views')}>
                <div className="metric-selector-label">Views</div>
                <div className="metric-selector-val">
                  <span>{aggregated.viewsFormatted || '45.1K'}</span>
                  <span className="material-symbols-outlined" style={{ color: '#2ba640', fontSize: '20px', marginLeft: '6px' }}>check_circle</span>
                </div>
                <div className="metric-sub-label">15.3K more than usual</div>
              </div>
              <div className={`metric-selector-item ${selectedMetric === 'uniqueViewers' ? 'active' : ''}`} onClick={() => setSelectedMetric('uniqueViewers')}>
                <div className="metric-selector-label">Unique viewers <span className="material-symbols-outlined card-info-icon">info</span></div>
                <div className="metric-selector-val"><span>35.5K</span></div>
              </div>
            </div>
            <div className="chart-container-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyWithTypical} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#717171" tickLine={false} axisLine={false} />
                  <YAxis orientation="right" stroke="#717171" tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey={selectedMetric === 'impressions' ? 'typicalUpper' : 'views'} stroke="#818cf8" strokeWidth={2} fill="rgba(129, 140, 248, 0.15)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card-footer-action">
              <button className="see-more-btn">See more</button>
            </div>
          </div>

          <div className="studio-two-column margin-top-20">
            <div className="audience-col">
              <StudioCard title="How viewers find this video" subtitle="Views · Since published">
                <div className="how-viewers-find-container">
                  <div className="donut-chart-wrapper">
                    <PieChart width={140} height={140}>
                      <Pie data={[{ name: 'Search', value: 81.2 }, { name: 'Browse', value: 8.0 }, { name: 'Other', value: 6.9 }, { name: 'Direct', value: 1.1 }, { name: 'External', value: 0.9 }, { name: 'Others', value: 2.0 }]} cx={65} cy={65} innerRadius={42} outerRadius={62} dataKey="value">
                        <Cell fill="#818cf8" /><Cell fill="#a855f7" /><Cell fill="#38bdf8" /><Cell fill="#6366f1" /><Cell fill="#c084fc" /><Cell fill="#475569" />
                      </Pie>
                    </PieChart>
                    <div className="donut-center-label">Traffic<br />Sources</div>
                  </div>
                  <div className="traffic-sources-bars">
                    <FormatDistributionRow label="YouTube search" value="81.2%" maxVal={100} barColor="#818cf8" />
                    <FormatDistributionRow label="Browse features" value="8.0%" maxVal={100} barColor="#a855f7" />
                    <FormatDistributionRow label="Other YouTube features" value="6.9%" maxVal={100} barColor="#38bdf8" />
                    <FormatDistributionRow label="Direct or unknown" value="1.1%" maxVal={100} barColor="#6366f1" />
                    <FormatDistributionRow label="External" value="0.9%" maxVal={100} barColor="#c084fc" />
                    <FormatDistributionRow label="Others" value="2.0%" maxVal={100} barColor="#475569" />
                  </div>
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              <StudioCard title="External sites or apps" subtitle="Views · Since published">
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>Proportion of your total traffic: <strong>0.9%</strong></div>
                <FormatDistributionRow label="WhatsApp" value="50.0%" maxVal={100} barColor="#818cf8" />
                <FormatDistributionRow label="whatsapp.com" value="19.4%" maxVal={100} barColor="#818cf8" />
                <FormatDistributionRow label="Google Search" value="13.0%" maxVal={100} barColor="#818cf8" />
                <FormatDistributionRow label="WhatsApp Business" value="6.4%" maxVal={100} barColor="#818cf8" />
                <FormatDistributionRow label="instagram.com" value="1.5%" maxVal={100} barColor="#818cf8" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              <StudioCard title="Content suggesting this video" subtitle="Views · Since published">
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>Proportion of your total traffic: <strong>0.8%</strong></div>
                <FormatDistributionRow label="Motu Patlu AI Video Kaise Banaye | Motu Patlu Tr..." value="4.4%" maxVal={10} barColor="#818cf8" />
                <FormatDistributionRow label="Instagram Viral Motu Patlu Wali AI Video Kaise B..." value="4.2%" maxVal={10} barColor="#818cf8" />
                <FormatDistributionRow label="Instagram Viral Motu Patlu Wali AI Video Kaise B..." value="4.2%" maxVal={10} barColor="#818cf8" />
                <FormatDistributionRow label="Instagram Viral Motu Patlu Wali AI Video Kaise B..." value="2.5%" maxVal={10} barColor="#818cf8" />
                <FormatDistributionRow label="Instagram Viral Motu Patlu Wali AI Video Kaise B..." value="1.9%" maxVal={10} barColor="#818cf8" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              <StudioCard title="Playlists featuring this video" subtitle="Views · Since published">
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>Proportion of your total traffic: <strong>0.1%</strong></div>
                <p style={{ color: '#aaa', fontSize: '13px', padding: '12px 0' }}>Not enough traffic data to show this report</p>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>
            </div>

            <div className="audience-col">
              <StudioCard title="Impressions and how they led to watch time" subtitle="Data available Jul 22 – Aug 5, 2026 (15 days)">
                <div className="youtube-funnel-container">
                  <div className="funnel-level level-1">
                    <div className="funnel-label">Impressions</div>
                    <div className="funnel-value">4.4L</div>
                  </div>
                  <div className="funnel-mid-note">
                    15.6% from YouTube recommending your content <span className="material-symbols-outlined card-info-icon">info</span>
                  </div>
                  <div className="funnel-level level-2">
                    <div className="funnel-text">9.0% click-through rate</div>
                  </div>
                  <div className="funnel-level level-3">
                    <div className="funnel-label">Views from impressions</div>
                    <div className="funnel-value">39.2K</div>
                  </div>
                  <div className="funnel-level level-4">
                    <div className="funnel-text">1:48 average view duration</div>
                  </div>
                  <div className="funnel-level level-5">
                    <div className="funnel-label">Watch time from impressions (hours)</div>
                    <div className="funnel-value">1.2K</div>
                  </div>
                </div>
              </StudioCard>

              <StudioCard title="Bell notifications sent" subtitle="Since published">
                <div className="bell-notification-items">
                  <div className="bell-item">
                    <span className="material-symbols-outlined bell-icon">notifications</span>
                    <div className="bell-info">
                      <div className="bell-title">Mobile push notifications</div>
                      <div className="bell-subtext">Excluding inbox delivery <span className="material-symbols-outlined card-info-icon">info</span></div>
                    </div>
                    <div className="bell-val">3.8K</div>
                  </div>
                  <div className="bell-item">
                    <span className="material-symbols-outlined bell-icon">notifications_active</span>
                    <div className="bell-info">
                      <div className="bell-title">Notification click-through rate</div>
                      <div className="bell-subtext">Typical on YouTube: 0.5% – 2.5%</div>
                    </div>
                    <div className="bell-val">0.8%</div>
                  </div>
                  <div className="bell-item">
                    <span className="material-symbols-outlined bell-icon">bar_chart</span>
                    <div className="bell-info"><div className="bell-title">Views from bell notifications</div></div>
                    <div className="bell-val">31</div>
                  </div>
                </div>
              </StudioCard>

              <StudioCard title="YouTube search terms" subtitle="Views · Since published">
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>Proportion of your total traffic: <strong>81.2%</strong></div>
                <FormatDistributionRow label="motu patlu ai video kaise banaye" value="17.3%" maxVal={20} barColor="#818cf8" />
                <FormatDistributionRow label="how to make motu patlu ai video" value="4.8%" maxVal={20} barColor="#818cf8" />
                <FormatDistributionRow label="ai motu patlu video kaise banaye" value="2.5%" maxVal={20} barColor="#818cf8" />
                <FormatDistributionRow label="how to create motu patlu ai video" value="1.9%" maxVal={20} barColor="#818cf8" />
                <FormatDistributionRow label="motu patlu ai video editing" value="1.9%" maxVal={20} barColor="#818cf8" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>
            </div>
          </div>
        </div>
      )}

      {/* ENGAGEMENT TAB (Video Analytics Mode) */}
      {activeTab === 'Engagement' && (
        <div className="engagement-tab-page">
          <div className="analytics-card hero-chart-card">
            <div className="metrics-selector-row">
              <div className={`metric-selector-item ${selectedMetric === 'watchTimeHrs' ? 'active' : ''}`} onClick={() => setSelectedMetric('watchTimeHrs')}>
                <div className="metric-selector-label">Watch time (hours)</div>
                <div className="metric-selector-val">
                  <span>1.3K</span>
                  <span className="material-symbols-outlined" style={{ color: '#2ba640', fontSize: '20px', marginLeft: '6px' }}>check_circle</span>
                </div>
                <div className="metric-sub-label">About the same as usual</div>
              </div>
              <div className={`metric-selector-item ${selectedMetric === 'avgViewDuration' ? 'active' : ''}`} onClick={() => setSelectedMetric('avgViewDuration')}>
                <div className="metric-selector-label">Average view duration</div>
                <div className="metric-selector-val">
                  <span>1:45</span>
                  <span className="material-symbols-outlined" style={{ color: '#aaa', fontSize: '20px', marginLeft: '6px' }}>arrow_circle_down</span>
                </div>
                <div className="metric-sub-label">0:53 less than usual</div>
              </div>
            </div>
            <div className="chart-container-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyWithTypical} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#717171" tickLine={false} axisLine={false} />
                  <YAxis orientation="right" stroke="#717171" tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="watchTimeHrs" stroke="#ec4899" strokeWidth={2} fill="rgba(236, 72, 153, 0.15)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="card-footer-action">
              <button className="see-more-btn">See more</button>
            </div>
          </div>

          <div className="studio-two-column margin-top-20">
            <div className="audience-col">
              <StudioCard title="Hype" subtitle="First 7 days">
                <div style={{ display: 'flex', gap: '32px', padding: '12px 0' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>4.4K</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Hype points</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>74</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Hypes</div>
                  </div>
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              <StudioCard title="Audience retention" subtitle="Since uploaded (lifetime)">
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                  <span style={{ color: '#aaa' }}>Average view duration</span>
                  <strong>1:45</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0' }}>
                  <span style={{ color: '#aaa' }}>Average percentage viewed</span>
                  <strong>29.3%</strong>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#aaa', marginBottom: '8px' }}>Key moments for audience retention</div>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <button style={{ backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '4px 12px', fontSize: '12px', fontWeight: '500' }}>Intro</button>
                    <button style={{ backgroundColor: '#272727', color: '#fff', border: '1px solid #383838', borderRadius: '4px', padding: '4px 12px', fontSize: '12px' }}>2 Spikes</button>
                    <button style={{ backgroundColor: '#272727', color: '#fff', border: '1px solid #383838', borderRadius: '4px', padding: '4px 12px', fontSize: '12px' }}>Dip</button>
                  </div>
                  <div style={{ width: '100%', height: '180px', backgroundColor: '#1f1f1f', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={currentVideo.thumbnail || '/thumbnails/1.webp'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </div>
              </StudioCard>
            </div>

            <div className="audience-col">
              <StudioCard title="Likes (vs. dislikes)" subtitle="Since published">
                <FormatDistributionRow label="Instagram Viral Motu Patlu Wali Ai Video Kaise B..." value="96.5%" maxVal={100} barColor="#ec4899" />
                <FormatDistributionRow label="Channel average" value="97.7%" maxVal={100} barColor="#717171" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              <StudioCard title="End screen element click rate" subtitle="Since uploaded (lifetime)">
                <FormatDistributionRow label="Instagram Viral Motu Patlu Wali Ai Video Kaise B..." value="1.0%" maxVal={5} barColor="#ec4899" />
                <FormatDistributionRow label="Channel average" value="1.7%" maxVal={5} barColor="#717171" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              <StudioCard title="Top Remixed" subtitle="Shorts created using parts of this video · Since published">
                <div style={{ display: 'flex', gap: '32px', padding: '12px 0' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>8</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Remix views</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600' }}>1</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>Remixes</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
                  <img src={currentVideo.thumbnail || '/thumbnails/1.webp'} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500' }}>#saudiarabia ##</div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>Alim · 6 views · 1 week ago</div>
                  </div>
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>
            </div>
          </div>
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === 'Content' && (
        <div className="content-tab-page">
          {/* Sub Navigation Pills */}
          <div className="content-sub-tabs">
            {['All', 'Videos', 'Shorts', 'Live', 'Posts', 'Playlists', 'Podcasts'].map(sub => (
              <button
                key={sub}
                className={`sub-tab-pill ${contentSubTab === sub ? 'active' : ''}`}
                onClick={() => setContentSubTab(sub)}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Top 3 Metric Breakdown Cards */}
          <div className="studio-three-grid">
            <StudioCard title="New viewers" subtitle="Last 28 days" infoIcon={true}>
              <FormatDistributionRow label="Videos" value={Math.round(aggregated.views * 0.45)} formattedValue={aggregated.views > 1000000 ? `${(aggregated.views * 0.45 / 1000000).toFixed(1)}M` : `${Math.round(aggregated.views * 0.45 / 1000)}K`} maxVal={aggregated.views} barColor="#8b5cf6" />
              <FormatDistributionRow label="Shorts" value={Math.round(aggregated.views * 0.05)} formattedValue={`${Math.round(aggregated.views * 0.05 / 1000)}K`} maxVal={aggregated.views} barColor="#8b5cf6" />
              <FormatDistributionRow label="Live stream" value={3} formattedValue="3" maxVal={aggregated.views} barColor="#8b5cf6" />
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>

            <StudioCard title="Regular viewers" subtitle="Last 28 days" infoIcon={true}>
              <FormatDistributionRow label="Videos" value={Math.round(aggregated.views * 0.015)} formattedValue={`${Math.round(aggregated.views * 0.015 / 1000)}K`} maxVal={aggregated.views * 0.02} barColor="#8b5cf6" />
              <FormatDistributionRow label="Shorts" value={755} formattedValue="755" maxVal={aggregated.views * 0.02} barColor="#8b5cf6" />
              <FormatDistributionRow label="Live stream" value={3} formattedValue="3" maxVal={aggregated.views * 0.02} barColor="#8b5cf6" />
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>

            <StudioCard title="Subscribers" subtitle="Last 28 days">
              <FormatDistributionRow label="Videos" value={aggregated.subscribersGained} formattedValue={`+${aggregated.subscribersGained.toLocaleString()}`} maxVal={aggregated.subscribersGained * 1.1} barColor="#8b5cf6" />
              <FormatDistributionRow label="Shorts" value={36} formattedValue="+36" maxVal={aggregated.subscribersGained * 1.1} barColor="#8b5cf6" />
              <FormatDistributionRow label="Live stream" value={0} formattedValue="0" maxVal={aggregated.subscribersGained * 1.1} barColor="#8b5cf6" />
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>
          </div>

          {/* Middle Row: 2 Cards */}
          <div className="studio-two-column margin-top-20">
            <StudioCard title="Views" subtitle="Last 28 days">
              <FormatDistributionRow label="Videos" value={Math.round(aggregated.views * 0.82)} formattedValue={`${(aggregated.views * 0.82 / 100000).toFixed(1)}L (82.0%)`} maxVal={aggregated.views} barColor="#8b5cf6" />
              <FormatDistributionRow label="Shorts" value={Math.round(aggregated.views * 0.18)} formattedValue={`${(aggregated.views * 0.18 / 1000).toFixed(1)}K (18.0%)`} maxVal={aggregated.views} barColor="#c084fc" />
              <FormatDistributionRow label="Live stream" value={32} formattedValue="32 (0%)" maxVal={aggregated.views} barColor="#c084fc" />
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>

            <StudioCard title="Published content" subtitle="Last 28 days" infoIcon={true}>
              <FormatDistributionRow label="Videos" value={videos.length} formattedValue={String(videos.length)} maxVal={videos.length + 2} barColor="#8b5cf6" />
              <FormatDistributionRow label="Shorts" value={1} formattedValue="1" maxVal={videos.length + 2} barColor="#c084fc" />
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>
          </div>

          {/* Lower Grid: Typical views, Viewers across formats, Funnel, Traffic Sources, Remixed */}
          <div className="studio-two-column margin-top-20">
            {/* Typical Views */}
            <StudioCard title="Typical views" subtitle="First 28 days">
              <div className="typical-views-list">
                <div className="typical-row">
                  <span>Videos</span>
                  <strong>13K–50.1K</strong>
                </div>
                <div className="typical-row">
                  <span>Live stream</span>
                  <strong>640–1.1K</strong>
                </div>
                <div className="typical-row">
                  <span>Shorts</span>
                  <strong>--</strong>
                </div>
              </div>
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>

            {/* Viewers across formats */}
            <StudioCard title="Viewers across formats" subtitle="Returning viewers · Last 28 days">
              <div className="card-filter-pills">
                {['Videos · Shorts', 'Videos · Live', 'Shorts · Live'].map(f => (
                  <button
                    key={f}
                    className={`filter-chip ${audienceFormatFilter === f ? 'active' : ''}`}
                    onClick={() => setAudienceFormatFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="format-segmented-bar">
                <div className="segment seg-1" style={{ width: '75%' }} />
                <div className="segment seg-2" style={{ width: '12%' }} />
                <div className="segment seg-3" style={{ width: '13%' }} />
              </div>
              <div className="format-legend-list">
                <div className="legend-item"><span className="dot dot-purple" /> Videos only <strong>75%</strong></div>
                <div className="legend-item"><span className="dot dot-white" /> Watching both <strong>12%</strong></div>
                <div className="legend-item"><span className="dot dot-lavender" /> Shorts only <strong>13%</strong></div>
              </div>
            </StudioCard>

            {/* Funnel: Impressions and how they led to watch time */}
            <StudioCard title="Impressions and how they led to watch time" subtitle="Data available Jul 7 – Aug 3, 2026 (28 days)">
              <div className="youtube-funnel-container">
                <div className="funnel-level level-1">
                  <div className="funnel-label">Impressions</div>
                  <div className="funnel-value">{aggregated.impressionsFormatted}</div>
                </div>
                <div className="funnel-mid-note">
                  38.1% from YouTube recommending your content <span className="material-symbols-outlined card-info-icon">info</span>
                </div>
                <div className="funnel-level level-2">
                  <div className="funnel-text">{aggregated.ctr}% click-through rate</div>
                </div>
                <div className="funnel-level level-3">
                  <div className="funnel-label">Views from impressions</div>
                  <div className="funnel-value">{aggregated.viewsFormatted}</div>
                </div>
                <div className="funnel-level level-4">
                  <div className="funnel-text">2:13 average view duration</div>
                </div>
                <div className="funnel-level level-5">
                  <div className="funnel-label">Watch time from impressions (hours)</div>
                  <div className="funnel-value">{aggregated.watchTimeHrsFormatted}</div>
                </div>
              </div>
            </StudioCard>

            {/* How viewers find you */}
            <StudioCard title="How viewers find you" subtitle="Views · Last 28 days">
              <div className="how-viewers-find-container">
                <div className="donut-chart-wrapper">
                  <PieChart width={140} height={140}>
                    <Pie
                      data={trafficSources.length > 0 ? trafficSources.map(t => ({ name: t.source, value: t.percentage })) : [
                        { name: 'Browse Features', value: 43 },
                        { name: 'Suggested Videos', value: 24 },
                        { name: 'YouTube Search', value: 18 },
                        { name: 'Direct', value: 8 },
                        { name: 'External', value: 7 }
                      ]}
                      cx={65}
                      cy={65}
                      innerRadius={42}
                      outerRadius={62}
                      dataKey="value"
                    >
                      <Cell fill="#38bdf8" />
                      <Cell fill="#818cf8" />
                      <Cell fill="#a855f7" />
                      <Cell fill="#6366f1" />
                      <Cell fill="#475569" />
                    </Pie>
                  </PieChart>
                  <div className="donut-center-label">
                    Traffic<br />Sources
                  </div>
                </div>

                <div className="traffic-sources-bars">
                  {(trafficSources.length > 0 ? trafficSources : [
                    { source: 'Browse Features', percentage: 43 },
                    { source: 'Suggested Videos', percentage: 24 },
                    { source: 'YouTube Search', percentage: 18 },
                    { source: 'Direct', percentage: 8 },
                    { source: 'External', percentage: 7 }
                  ]).map((t, idx) => {
                    const colors = ['#38bdf8', '#818cf8', '#a855f7', '#6366f1', '#475569'];
                    return (
                      <FormatDistributionRow 
                        key={t.source} 
                        label={t.source} 
                        value={`${t.percentage}%`} 
                        maxVal={50} 
                        barColor={colors[idx % colors.length]} 
                      />
                    );
                  })}
                </div>
              </div>
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>

            {/* Top Remixed */}
            <StudioCard title="Top Remixed" subtitle="Your content used to create Shorts · Last 28 days">
              <div className="remixed-stats-row">
                <div className="remix-stat">
                  <span className="num">55</span>
                  <span className="lbl">Remix views</span>
                </div>
                <div className="remix-stat">
                  <span className="num">1</span>
                  <span className="lbl">Remixes</span>
                </div>
              </div>
              <div className="remixed-item-row">
                <img src={videos[0]?.thumbnail || "/thumbnails/1.webp"} alt="" className="remix-thumb" />
                <div>
                  <div className="remix-title">{videos[0]?.title || "Why I Fired ChatGPT for a Week"}</div>
                  <div className="remix-sub">8 remix views · 1 remixes</div>
                </div>
              </div>
              <button className="see-more-btn margin-top-16">See more</button>
            </StudioCard>
          </div>
        </div>
      )}

      {/* AUDIENCE TAB */}
      {activeTab === 'Audience' && (
        <div className="audience-tab-page">
          {/* Hero Dual Metric Card */}
          <div className="analytics-card audience-hero-card">
            <div className="audience-hero-header">
              <div className="hero-metric-item border-right">
                <span className="hero-label">Monthly audience <span className="material-symbols-outlined card-info-icon">info</span></span>
                <span className="hero-val">{aggregated.viewsFormatted}</span>
              </div>
              <div className="hero-metric-item">
                <span className="hero-label">Subscribers</span>
                <span className="hero-val-row">
                  {aggregated.subscribersNetFormatted} <span className="gray-arrow-small">↓</span>
                  <span className="hero-subtext">In this period</span>
                </span>
              </div>
            </div>

            <div className="chart-container-wrapper">
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={dailyWithTypical} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#717171" tickLine={false} axisLine={false} />
                  <YAxis orientation="right" stroke="#717171" tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="typicalUpper" stroke="none" fill="rgba(255, 255, 255, 0.05)" />
                  <Area type="monotone" dataKey="views" stroke="#a855f7" strokeWidth={2.5} fill="url(#colorPurple)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card-footer-action">
              <button className="see-more-btn">See more</button>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="studio-two-column margin-top-20">
            {/* Left Column */}
            <div className="audience-col">
              {/* Audience by watch behavior */}
              <StudioCard title="Audience by watch behavior" subtitle="Monthly audience · Aug 3, 2026" infoIcon={true}>
                <div className="format-segmented-bar margin-bottom-16">
                  <div className="segment seg-purple" style={{ width: '81%' }} />
                  <div className="segment seg-lavender" style={{ width: '16%' }} />
                  <div className="segment seg-white" style={{ width: '3%' }} />
                </div>
                <div className="audience-behavior-legend">
                  <div className="legend-row">
                    <span><span className="dot dot-purple" /> New viewers <span className="material-symbols-outlined card-info-icon">info</span></span>
                    <strong>81.0%</strong>
                  </div>
                  <div className="legend-row">
                    <span><span className="dot dot-lavender" /> Casual viewers <span className="material-symbols-outlined card-info-icon">info</span></span>
                    <strong>16.0%</strong>
                  </div>
                  <div className="legend-row">
                    <span><span className="dot dot-white" /> Regular viewers <span className="material-symbols-outlined card-info-icon">info</span></span>
                    <strong>3.1%</strong>
                  </div>
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              {/* Age and gender */}
              <StudioCard title="Age and gender" subtitle="Views · Last 28 days">
                <div className="card-filter-pills">
                  {['All', 'Videos', 'Shorts'].map(f => (
                    <button
                      key={f}
                      className={`filter-chip ${ageGenderFilter === f ? 'active' : ''}`}
                      onClick={() => setAgeGenderFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <FormatDistributionRow label="Female" value={14.9} formattedValue="14.9%" maxVal={100} barColor="#a855f7" />
                <FormatDistributionRow label="Male" value={85.0} formattedValue="85.0%" maxVal={100} barColor="#a855f7" />
                <FormatDistributionRow label="User-specified" value={0.1} formattedValue="0.1%" maxVal={100} barColor="#a855f7" />

                <hr className="studio-divider" />

                <FormatDistributionRow label="13–17 years" value={4.6} formattedValue="4.6%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="18–24 years" value={27.6} formattedValue="27.6%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="25–34 years" value={43.3} formattedValue="43.3%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="35–44 years" value={19.1} formattedValue="19.1%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="45–54 years" value={4.4} formattedValue="4.4%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="55–64 years" value={0.6} formattedValue="0.6%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="65+ years" value={0.3} formattedValue="0.3%" maxVal={50} barColor="#a855f7" />

                <div className="studio-card-note margin-top-12">
                  <span className="material-symbols-outlined card-info-icon">info</span> Viewer age is based on the age declared during account creation and includes an age estimation model to determine if a user is over or under the age of 18. <a href="#learn" onClick={e => e.preventDefault()}>Learn more</a>
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              {/* Videos growing your audience */}
              <StudioCard title="Videos growing your audience" subtitle="Last 90 days">
                <div className="growing-videos-table">
                  <div className="growing-header">
                    <span>Content</span>
                    <span>New viewers who returned</span>
                  </div>
                  {videos.slice(0, 6).map((v, i) => (
                    <div className="growing-row" key={v.id}>
                      <img src={v.thumbnail} alt="" className="growing-thumb" />
                      <span className="growing-title">{v.title}</span>
                      <span className="growing-badge">
                        {i === 0 ? <span className="green-grow-badge">Very high <span className="material-symbols-outlined">check_circle</span></span> :
                         i < 4 ? <span className="green-grow-badge">Moderate <span className="material-symbols-outlined">check_circle</span></span> :
                         <span className="gray-grow-badge">Low <span className="material-symbols-outlined">help</span></span>}
                      </span>
                    </div>
                  ))}
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              {/* When your viewers are on YouTube */}
              <StudioCard title="When your viewers are on YouTube" subtitle="Your local time (GMT +0530) · Last 28 days">
                <div className="heatmap-matrix-wrapper">
                  <div className="heatmap-hours-header">
                    <span>12:00AM</span>
                    <span>6:00AM</span>
                    <span>12:00PM</span>
                    <span>6:00PM</span>
                  </div>
                  {audience.viewerHeatmap.map(dh => (
                    <div className="heatmap-row" key={dh.day}>
                      <span className="heatmap-day">{dh.day}</span>
                      <div className="heatmap-cells">
                        {dh.hours.map(h => (
                          <span
                            key={h.hour}
                            className={`heatmap-cell intensity-${h.intensity}`}
                            title={`${dh.day} ${h.hour}:00`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="studio-card-note margin-top-12">
                  <span className="material-symbols-outlined card-info-icon">info</span> Publish time is not known to directly affect the long-term performance of a video. <a href="#learn" onClick={e => e.preventDefault()}>Learn more</a>
                </div>
              </StudioCard>

              {/* Subscriber bell notifications */}
              <StudioCard title="Subscriber bell notifications" subtitle="Percent of total subscribers · Current" infoIcon={true}>
                <div className="bell-notification-items">
                  <div className="bell-item">
                    <span className="material-symbols-outlined bell-icon">notifications</span>
                    <div className="bell-info">
                      <div className="bell-title">Subscribers who turned on "All notifications" for your channel</div>
                      <div className="bell-subtext">Typical on YouTube: 10% – 30%</div>
                    </div>
                    <div className="bell-val">7.0% <span className="bell-val-sub">(28.3K)</span></div>
                  </div>

                  <div className="bell-item">
                    <span className="material-symbols-outlined bell-icon">notifications_active</span>
                    <div className="bell-info">
                      <div className="bell-title">Subscribers who turned on "All notifications" for your channel and enabled YouTube notifications</div>
                      <div className="bell-subtext">Typical on YouTube: 5% – 20%</div>
                    </div>
                    <div className="bell-val">3.9% <span className="bell-val-sub">(16.0K)</span></div>
                  </div>
                </div>
                <div className="studio-card-note margin-top-12">
                  <span className="material-symbols-outlined card-info-icon">info</span> Notifications can't reach subscribers who disabled notifications on the YouTube app or signed out. <a href="#learn" onClick={e => e.preventDefault()}>Learn more</a>
                </div>
              </StudioCard>
            </div>

            {/* Right Column */}
            <div className="audience-col">
              {/* Popular with different audiences */}
              <StudioCard title="Popular with different audiences" subtitle="Views · Last 28 days">
                <div className="card-filter-pills">
                  {['New', 'Casual', 'Regular'].map(p => (
                    <button
                      key={p}
                      className={`filter-chip ${audiencePopularFilter === p ? 'active' : ''}`}
                      onClick={() => setAudiencePopularFilter(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="popular-videos-list">
                  {videos.slice(0, 5).map((v) => {
                    const maxV = videos[0]?.views || 1;
                    const pctWidth = Math.min(100, Math.max(10, Math.round((v.views / maxV) * 100)));
                    return (
                      <div className="popular-video-row" key={v.id}>
                        <img src={v.thumbnail} alt="" className="popular-thumb" />
                        <span className="popular-title">{v.title}</span>
                        <div className="popular-bar-track">
                          <div className="popular-bar-fill" style={{ width: `${pctWidth}%` }} />
                        </div>
                        <span className="popular-count">{v.viewsFormatted}</span>
                      </div>
                    );
                  })}
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              {/* Top geographies */}
              <StudioCard title="Top geographies" subtitle="Views · Last 28 days">
                <div className="card-filter-pills">
                  {['All', 'Videos', 'Shorts'].map(f => (
                    <button
                      key={f}
                      className={`filter-chip ${topGeographiesFilter === f ? 'active' : ''}`}
                      onClick={() => setTopGeographiesFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <FormatDistributionRow label="United States" value={47.3} formattedValue="47.3%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="Canada" value={18.4} formattedValue="18.4%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="Germany" value={14.6} formattedValue="14.6%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="Italy" value={10.9} formattedValue="10.9%" maxVal={50} barColor="#a855f7" />
                <FormatDistributionRow label="France" value={8.8} formattedValue="8.8%" maxVal={50} barColor="#a855f7" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              {/* Top subtitle/CC languages */}
              <StudioCard title="Top subtitle/CC languages" subtitle="Views · Last 28 days">
                <FormatDistributionRow label="No subtitles/CC" value={90.7} formattedValue="90.7%" maxVal={100} barColor="#a855f7" />
                <FormatDistributionRow label="English" value={4.8} formattedValue="4.8%" maxVal={100} barColor="#a855f7" />
                <FormatDistributionRow label="English (United States)" value={2.5} formattedValue="2.5%" maxVal={100} barColor="#a855f7" />
                <FormatDistributionRow label="German" value={1.2} formattedValue="1.2%" maxVal={100} barColor="#a855f7" />
                <FormatDistributionRow label="French" value={0.8} formattedValue="0.8%" maxVal={100} barColor="#a855f7" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              {/* Channels your audience watches */}
              <StudioCard title="Channels your audience watches" subtitle="Last 28 days">
                <div className="channels-watched-list">
                  {audienceChannels.map(ch => (
                    <div className="channel-row-item" key={ch.name}>
                      <img src={ch.avatar} alt="" className="channel-avatar" />
                      <div className="channel-info">
                        <div className="channel-name">{ch.name}</div>
                        <div className="channel-subs">{ch.subs}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pagination-footer">
                  <button className="page-nav-btn"><span className="material-symbols-outlined">chevron_left</span></button>
                  <span>1 / 3</span>
                  <button className="page-nav-btn"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              </StudioCard>

              {/* What your audience watches */}
              <StudioCard title="What your audience watches" subtitle="Last 7 days">
                <div className="empty-audience-note">
                  Not enough eligible audience data to show this report. <a href="#learn" onClick={e => e.preventDefault()}>Learn more</a>
                </div>
              </StudioCard>

              {/* Formats your viewers watch on YouTube */}
              <StudioCard title="Formats your viewers watch on YouTube" subtitle="Last 28 days">
                <div className="formats-spectrum-list">
                  <div className="format-spectrum-row">
                    <span className="lbl">Videos</span>
                    <div className="spectrum-bar">
                      <div className="spectrum-fill fill-full" />
                    </div>
                  </div>
                  <div className="format-spectrum-row">
                    <span className="lbl">Shorts</span>
                    <div className="spectrum-bar">
                      <div className="spectrum-fill fill-full" />
                    </div>
                  </div>
                  <div className="format-spectrum-row">
                    <span className="lbl">Live</span>
                    <div className="spectrum-bar">
                      <div className="spectrum-fill fill-full" />
                    </div>
                  </div>
                  <div className="spectrum-labels-row">
                    <span>Nobody watches</span>
                    <span>Everybody watches</span>
                  </div>
                </div>
              </StudioCard>

              {/* Device type */}
              <StudioCard title="Device type" subtitle="Watch time (hours) · Last 28 days">
                <div className="card-filter-pills">
                  {['All', 'Videos', 'Shorts'].map(d => (
                    <button
                      key={d}
                      className={`filter-chip ${deviceTypeFilter === d ? 'active' : ''}`}
                      onClick={() => setDeviceTypeFilter(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
                <div className="format-segmented-bar margin-bottom-16">
                  <div className="segment seg-purple" style={{ width: '86.4%' }} />
                  <div className="segment seg-lavender" style={{ width: '9.2%' }} />
                  <div className="segment seg-white" style={{ width: '4.4%' }} />
                </div>
                <div className="audience-behavior-legend">
                  <div className="legend-row">
                    <span><span className="dot dot-purple" /> Mobile phone</span>
                    <strong>86.4%</strong>
                  </div>
                  <div className="legend-row">
                    <span><span className="dot dot-lavender" /> Computer</span>
                    <strong>9.2%</strong>
                  </div>
                  <div className="legend-row">
                    <span><span className="dot dot-white" /> Others</span>
                    <strong>4.4%</strong>
                  </div>
                </div>
              </StudioCard>
            </div>
          </div>
        </div>
      )}

      {/* REVENUE TAB */}
      {activeTab === 'Revenue' && (
        <div className="revenue-tab-page">
          {/* Sub Navigation Pills */}
          <div className="content-sub-tabs">
            {['All', 'Watch Page ads', 'Shorts Feed ads', 'Supers & gifts', 'Affiliate program'].map(sub => (
              <button
                key={sub}
                className={`sub-tab-pill ${revenueSubTab === sub ? 'active' : ''}`}
                onClick={() => setRevenueSubTab(sub)}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Hero Estimated Revenue Card */}
          <div className="analytics-card revenue-hero-card">
            <div className="revenue-hero-header">
              <div className="revenue-label">Estimated revenue <span className="material-symbols-outlined card-info-icon">info</span></div>
              <div className="revenue-big-val">
                {aggregated.revenueFormatted} <span className="green-circle-badge"><span className="material-symbols-outlined">arrow_upward</span></span>
              </div>
              <div className="revenue-subtext">Calculated from (Views / 1000) × RPM</div>
            </div>

            <div className="chart-container-wrapper">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={dailyWithTypical} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTeal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#717171" tickLine={false} axisLine={false} />
                  <YAxis orientation="right" stroke="#717171" tickLine={false} axisLine={false} domain={revenueDomain} tickFormatter={v => `$${v.toLocaleString()}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenueTypicalUpper" stroke="none" fill="rgba(255, 255, 255, 0.05)" />
                  <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2.5} fill="url(#colorTeal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card-footer-action">
              <button className="see-more-btn">See more</button>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="studio-two-column margin-top-20">
            {/* Left Column */}
            <div className="revenue-col">
              {/* How much you're earning */}
              <StudioCard title="How much you're earning" subtitle="Estimated · Last 6 months" infoIcon={true}>
                <div className="earning-months-list">
                  <div className="earning-row">
                    <span className="lbl">August (ongoing)</span>
                    <span className="dot-sep">•</span>
                    <span className="val">${(aggregated.revenue * 0.02).toFixed(2)}</span>
                  </div>
                  <FormatDistributionRow label="July" value={aggregated.revenue * 0.35} formattedValue={`$${(aggregated.revenue * 0.35).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} maxVal={aggregated.revenue * 0.4} barColor="#14b8a6" />
                  <FormatDistributionRow label="June" value={aggregated.revenue * 0.22} formattedValue={`$${(aggregated.revenue * 0.22).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} maxVal={aggregated.revenue * 0.4} barColor="#14b8a6" />
                  <FormatDistributionRow label="May" value={aggregated.revenue * 0.34} formattedValue={`$${(aggregated.revenue * 0.34).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} maxVal={aggregated.revenue * 0.4} barColor="#14b8a6" />
                  <FormatDistributionRow label="April" value={aggregated.revenue * 0.27} formattedValue={`$${(aggregated.revenue * 0.27).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} maxVal={aggregated.revenue * 0.4} barColor="#14b8a6" />
                  <FormatDistributionRow label="March" value={aggregated.revenue * 0.14} formattedValue={`$${(aggregated.revenue * 0.14).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} maxVal={aggregated.revenue * 0.4} barColor="#14b8a6" />
                </div>
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>

              {/* How you make money */}
              <StudioCard title="How you make money" subtitle="Estimated · Last 28 days" infoIcon={true}>
                <div className="card-filter-pills">
                  {['All', 'Videos', 'Shorts', 'Live'].map(m => (
                    <button
                      key={m}
                      className={`filter-chip ${revenueMakeMoneyFilter === m ? 'active' : ''}`}
                      onClick={() => setRevenueMakeMoneyFilter(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <FormatDistributionRow label="Watch Page ads" value={aggregated.revenue * 0.98} formattedValue={`$${(aggregated.revenue * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} maxVal={aggregated.revenue} barColor="#14b8a6" />
                <FormatDistributionRow label="Shorts Feed ads" value={aggregated.revenue * 0.02} formattedValue={`$${(aggregated.revenue * 0.02).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} maxVal={aggregated.revenue} barColor="#14b8a6" />
                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>
            </div>

            {/* Right Column */}
            <div className="revenue-col">
              {/* Content performance */}
              <StudioCard title="Content performance" subtitle="Last 28 days" infoIcon={true}>
                <div className="card-filter-pills">
                  {['Videos', 'Shorts', 'Live'].map(c => (
                    <button
                      key={c}
                      className={`filter-chip ${revenueContentFilter === c ? 'active' : ''}`}
                      onClick={() => setRevenueContentFilter(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="revenue-performance-summary">
                  <div className="summary-item">
                    <span className="big-num">{aggregated.revenueFormatted}</span>
                    <span className="sub-lbl">Estimated revenue</span>
                  </div>
                  <div className="summary-split">
                    <div>
                      <span className="med-num">{aggregated.viewsFormatted}</span>
                      <span className="sub-lbl">Views</span>
                    </div>
                    <div>
                      <span className="med-num">${aggregated.rpm ? aggregated.rpm.toFixed(2) : '33.64'}</span>
                      <span className="sub-lbl">Revenue per 1K views (RPM)</span>
                    </div>
                  </div>
                </div>

                <div className="revenue-videos-list">
                  {topEarningVideos.slice(0, 5).map((v) => {
                    const maxRev = topEarningVideos[0]?.calculatedRevenue || 1;
                    const pctWidth = Math.min(100, Math.max(5, Math.round((v.calculatedRevenue / maxRev) * 100)));
                    return (
                      <div className="rev-video-row" key={v.id}>
                        <img src={v.thumbnail} alt="" className="rev-thumb" />
                        <span className="rev-title">{v.title}</span>
                        <div className="rev-bar-track">
                          <div className="rev-bar-fill" style={{ width: `${pctWidth}%` }} />
                        </div>
                        <span className="rev-amount">{v.calculatedRevenueFormatted}</span>
                      </div>
                    );
                  })}
                </div>

                <button className="see-more-btn margin-top-16">See more</button>
              </StudioCard>
            </div>
          </div>
        </div>
      )}

      {/* TRENDS TAB */}
      {activeTab === 'Trends' && (
        <div className="studio-tab-layout">
          <StudioCard title="Channel Growth Velocity & Velocity Trend" subtitle="Daily views compared with 14-day moving baseline">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={daily}>
                <CartesianGrid stroke="#303030" vertical={false} />
                <XAxis dataKey="date" />
                <YAxis orientation="right" />
                <Tooltip />
                <Area type="monotone" dataKey="views" stroke="#ff9800" fill="rgba(255, 152, 0, 0.12)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </StudioCard>
        </div>
      )}
    </div>
  );
};

export default Analytics;
