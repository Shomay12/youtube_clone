import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SpreadsheetDataService } from '../services/SpreadsheetDataService';
import {
  CHANNEL_BENCHMARKS,
  PROCESSED_VIDEOS,
  DAILY_SERIES,
  filterDailyMetricsByRange,
  aggregateMetrics,
  getTrafficSources,
  getAudienceBreakdown,
  generateRealtimeDataset,
  tickRealtimeData
} from '../engine/AnalyticsSimulationEngine';

export const formatINR = (val) => {
  if (val === null || val === undefined) return '₹0.00';
  if (typeof val === 'number') {
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (typeof val === 'string') {
    let s = val.trim();
    if (s.startsWith('₹')) return s;
    if (s.startsWith('$')) s = s.slice(1);
    const num = parseFloat(s.replace(/,/g, ''));
    if (!isNaN(num)) {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `₹${s}`;
  }
  return String(val);
};

export const fmtV = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(Math.round(num));
};

export const fmtW = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M hrs`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K hrs`;
  return `${Math.round(num)} hrs`;
};

export const fmtS = (s) => {
  const num = Number(s) || 0;
  const prefix = num > 0 ? '+' : '';
  if (Math.abs(num) >= 1_000_000) return `${prefix}${(num / 1_000_000).toFixed(1)}M`;
  if (Math.abs(num) >= 1_000) return `${prefix}${(num / 1_000).toFixed(1)}K`;
  return `${prefix}${num.toLocaleString('en-IN')}`;
};

const INITIAL_REALTIME = generateRealtimeDataset();
const INITIAL_LAST28_DAILY = filterDailyMetricsByRange(DAILY_SERIES, '2026-07-07', '2026-08-04');
const INITIAL_AGG = aggregateMetrics(INITIAL_LAST28_DAILY);

// Baseline lifetime totals from the original simulation data
const BASELINE_VIEWS = PROCESSED_VIDEOS.reduce((acc, v) => acc + (Number(v.views) || 0), 0) || 21450000;
const BASELINE_REVENUE = PROCESSED_VIDEOS.reduce((acc, v) => acc + ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64)), 0) || 722000;

const EMPTY_STATE = {
  channelInfo: {
    ...CHANNEL_BENCHMARKS,
    subscribersFormatted: '412.9K',
    lifetimeViewsFormatted: '21.5M',
    totalUploads: PROCESSED_VIDEOS.length,
    viewsLast28DaysFormatted: INITIAL_AGG.viewsFormatted,
    watchTimeLast28DaysFormatted: INITIAL_AGG.watchTimeHrsFormatted,
    subscribersGainedLast28DaysFormatted: INITIAL_AGG.subscribersNetFormatted,
    revenueLast28DaysFormatted: INITIAL_AGG.revenueFormatted,
    totalRevenueFormatted: '₹7,21,577.00',
    currency: 'INR'
  },
  videos: PROCESSED_VIDEOS,
  shorts: [],
  liveStreams: [],
  playlists: [
    { id: 'pl_01', title: 'AI & Autonomous Agents Masterclass', videoCount: 4, visibility: 'Public', lastUpdated: '3 days ago' },
    { id: 'pl_02', title: 'Full Stack SaaS Engineering', videoCount: 3, visibility: 'Public', lastUpdated: '1 week ago' },
    { id: 'pl_03', title: 'System Design & Distributed Systems', videoCount: 3, visibility: 'Public', lastUpdated: '2 weeks ago' }
  ],
  podcasts: [],
  comments: [
    { id: 'c_1', videoId: 'vid_01', author: 'Alex Tech', authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80', text: 'This AI agent video is incredible! The tool calling architecture makes total sense now.', likes: 342, heart: true, time: '2 hours ago', status: 'Published' },
    { id: 'c_2', videoId: 'vid_02', author: 'DevGirl_99', authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', text: 'Giving an agent control of your bank account was wild 🤯 great explanation!', likes: 189, heart: false, time: '5 hours ago', status: 'Published' },
    { id: 'c_3', videoId: 'vid_10', author: 'CodeMaster', authorAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80', text: 'Best system design video on YouTube. Period.', likes: 512, heart: true, time: '1 day ago', status: 'Published' }
  ],
  subtitles: PROCESSED_VIDEOS.map(v => ({
    id: `sub_${v.id}`,
    videoId: v.id,
    videoTitle: v.title,
    languages: ['English (Automatic)'],
    modified: v.publishDate,
    titleDescriptionState: 'Published',
    subtitlesState: 'Published'
  })),
  copyrightClaims: [],
  audioTracks: [
    { id: 'track_1', title: 'Synthwave Dreams', artist: 'Axiom Audio', duration: '3:45', genre: 'Electronic', mood: 'Dramatic', starred: true },
    { id: 'track_2', title: 'Lofi Study Beats', artist: 'Chillhop Lab', duration: '2:30', genre: 'Lofi', mood: 'Calm', starred: false }
  ],
  notifications: [
    { id: 'n_1', title: 'System Design video reached 2.8M views!', message: 'Your video is trending #1 in Tech.', time: '1 hour ago', read: false }
  ],
  spreadsheetWarnings: [],
  settings: {
    currency: 'INR - Indian Rupee',
    theme: 'Dark',
    country: 'United States',
    keywords: 'AI, Autonomous Agents, Software Engineering, React, Node.js, System Design',
    defaultVisibility: 'Public',
    defaultCategory: 'Science & Technology'
  },
  analytics: {
    daily: INITIAL_LAST28_DAILY,
    trafficSources: getTrafficSources(INITIAL_AGG.views),
    audience: getAudienceBreakdown(INITIAL_AGG.views),
    realtime: INITIAL_REALTIME,
    subscribers: [],
    charts: {
      overview: INITIAL_LAST28_DAILY,
      revenue: INITIAL_LAST28_DAILY,
      realtime: INITIAL_REALTIME.last48Hours,
      engagement: INITIAL_LAST28_DAILY,
      trafficSources: getTrafficSources(INITIAL_AGG.views),
      audience: getAudienceBreakdown(INITIAL_AGG.views),
      videoMetrics: null
    }
  },
  engine: {
    totalViews: INITIAL_AGG.views,
    totalRevenue: INITIAL_AGG.revenue,
    totalWatchTimeHrs: INITIAL_AGG.watchTimeHrs,
    averageRpm: INITIAL_AGG.rpm,
    averageCpm: INITIAL_AGG.cpm,
    averageCtr: INITIAL_AGG.ctr,
    averageViewDuration: '04:15',
    subscriberGrowth: INITIAL_AGG.subscribersNet,
    monthlyRevenue: [],
    topVideos: {
      mostViewed: [...PROCESSED_VIDEOS].sort((a, b) => b.views - a.views),
      highestRpm: [...PROCESSED_VIDEOS].sort((a, b) => b.rpm - a.rpm),
      highestRevenue: [...PROCESSED_VIDEOS].sort((a, b) => b.revenue - a.revenue),
      fastestGrowing: [...PROCESSED_VIDEOS].sort((a, b) => b.ctr - a.ctr)
    }
  }
};

function applySpreadsheetData(data) {
  return {
    channelInfo: { ...EMPTY_STATE.channelInfo, ...(data.channelInfo || {}) },
    videos: data.videos && data.videos.length > 0 ? data.videos : EMPTY_STATE.videos,
    shorts: data.shorts || [],
    liveStreams: data.liveStreams || [],
    playlists: data.playlists && data.playlists.length > 0 ? data.playlists : EMPTY_STATE.playlists,
    podcasts: data.podcasts || [],
    comments: data.comments && data.comments.length > 0 ? data.comments : EMPTY_STATE.comments,
    subtitles: data.subtitles || EMPTY_STATE.subtitles,
    copyrightClaims: data.copyrightClaims || [],
    audioTracks: data.audioTracks || EMPTY_STATE.audioTracks,
    notifications: data.notifications || EMPTY_STATE.notifications,
    settings: data.settings || EMPTY_STATE.settings,
    analytics: data.analytics || EMPTY_STATE.analytics,
    engine: data.engine || EMPTY_STATE.engine,
    spreadsheetWarnings: data.warnings || []
  };
}

export const useStore = create(
  persist(
    (set, get) => ({
      mode: 'simulation',
      isSpreadsheetLoading: false,
      spreadsheetError: null,
      lastSpreadsheetSync: null,
      spreadsheetConfig: {
        source: 'excel',
        autoRefreshInterval: 60,
        liveSync: true
      },

      // Date filtering state
      selectedDateRange: 'last28',
      customStartDate: '2026-07-07',
      customEndDate: '2026-08-04',
      realtimeDataset: INITIAL_REALTIME,

      ...EMPTY_STATE,
      toast: null,

      showToast: () => {},
      clearToast: () => set({ toast: null }),

      // Date range changer
      setDateRange: (rangeKey, customStart = null, customEnd = null) => {
        set(() => {
          const updates = { selectedDateRange: rangeKey };
          if (customStart) updates.customStartDate = customStart;
          if (customEnd) updates.customEndDate = customEnd;
          return updates;
        });
      },

      // Live realtime ticker tick function
      tickRealtime: () => {
        set(state => ({
          realtimeDataset: tickRealtimeData(state.realtimeDataset)
        }));
      },

      // Helper to retrieve computed analytics for any date range and video
      getAnalyticsForRange: (rangeKey = null, videoId = null) => {
        const state = get();
        const activeKey = rangeKey || state.selectedDateRange;
        
        let startStr = '2026-07-07';
        let endStr = '2026-08-04';
        const today = new Date('2026-08-04T00:00:00Z');

        const formatDate = (d) => d.toISOString().split('T')[0];

        if (activeKey === 'today') {
          startStr = '2026-08-04';
          endStr = '2026-08-04';
        } else if (activeKey === 'first24') {
          startStr = '2026-08-03';
          endStr = '2026-08-04';
        } else if (activeKey === 'yesterday') {
          const y = new Date(today);
          y.setDate(y.getDate() - 1);
          startStr = formatDate(y);
          endStr = formatDate(y);
        } else if (activeKey === 'last7') {
          const s = new Date(today);
          s.setDate(s.getDate() - 6);
          startStr = formatDate(s);
          endStr = formatDate(today);
        } else if (activeKey === 'last28') {
          const s = new Date(today);
          s.setDate(s.getDate() - 27);
          startStr = formatDate(s);
          endStr = formatDate(today);
        } else if (activeKey === 'last90') {
          const s = new Date(today);
          s.setDate(s.getDate() - 89);
          startStr = formatDate(s);
          endStr = formatDate(today);
        } else if (activeKey === '365') {
          const s = new Date(today);
          s.setDate(s.getDate() - 364);
          startStr = formatDate(s);
          endStr = formatDate(today);
        } else if (activeKey === 'lifetime' || activeKey === 'since_published') {
          startStr = '2025-08-01';
          endStr = '2026-08-04';
        } else if (activeKey === '2026') {
          startStr = '2026-01-01';
          endStr = '2026-08-04';
        } else if (activeKey === '2025') {
          startStr = '2025-01-01';
          endStr = '2025-12-31';
        } else if (activeKey === 'august') {
          startStr = '2026-08-01';
          endStr = '2026-08-04';
        } else if (activeKey === 'july') {
          startStr = '2026-07-01';
          endStr = '2026-07-31';
        } else if (activeKey === 'june') {
          startStr = '2026-06-01';
          endStr = '2026-06-30';
        } else if (activeKey === 'custom') {
          startStr = state.customStartDate || '2026-07-07';
          endStr = state.customEndDate || '2026-08-04';
        }

        const filteredDaily = filterDailyMetricsByRange(DAILY_SERIES, startStr, endStr);
        const agg = aggregateMetrics(filteredDaily, videoId);

        // Per-video analytics: use the video's actual stored metrics directly
        if (videoId) {
          const targetVideo = state.videos.find(v => v.id === videoId || String(v.id) === String(videoId)) || state.videos[0];
          const videoViews = targetVideo ? (Number(targetVideo.views) || 0) : 0;
          const videoRpm = targetVideo?.rpm ? Number(targetVideo.rpm) : 33.64;
          const videoRevenue = targetVideo
            ? (targetVideo.revenue != null ? Number(targetVideo.revenue) : parseFloat(((videoViews / 1000) * videoRpm).toFixed(2)))
            : 0;
          const videoAvgDurationSecs = targetVideo?.avgViewDurationSecs || 105;
          const videoWatchTime = parseFloat((videoViews * videoAvgDurationSecs / 3600).toFixed(1));

          const videoSubsGained = targetVideo?.subscribersGained !== undefined 
            ? Number(targetVideo.subscribersGained) 
            : Math.round(videoViews * 0.014);
          const videoSubsLost = targetVideo?.subscribersLost !== undefined
            ? Number(targetVideo.subscribersLost)
            : Math.round(videoSubsGained * 0.12);
          const videoSubsNet = targetVideo?.netSubscribers !== undefined
            ? Number(targetVideo.netSubscribers)
            : (videoSubsGained - videoSubsLost);

          const videoCtr = targetVideo?.ctr ? Number(targetVideo.ctr) : 8.9;
          const videoImpressions = Math.round(videoViews * (100 / (videoCtr || 8.9)));

          const totalViewsInDaily = filteredDaily.reduce((acc, d) => acc + (d.views || 0), 0) || 1;

          const scaledDaily = filteredDaily.map(d => {
            const dayWeight = (d.views || 0) / totalViewsInDaily;
            const dViews = Math.round(videoViews * dayWeight);
            const dRev = parseFloat(((dViews / 1000) * videoRpm).toFixed(2));
            const dWatch = parseFloat((dViews * videoAvgDurationSecs / 3600).toFixed(1));
            const dSubsNet = Math.round(videoSubsNet * dayWeight);
            const dSubsGained = Math.round(videoSubsGained * dayWeight);
            const dSubsLost = Math.round(videoSubsLost * dayWeight);

            return {
              ...d,
              views: dViews,
              revenue: dRev,
              watchTimeHrs: dWatch,
              subscribersNet: dSubsNet,
              subscribersGained: dSubsGained,
              subscribersLost: dSubsLost,
              impressions: Math.round(videoImpressions * dayWeight),
              ctr: videoCtr,
            };
          });

          return {
            dateRangeLabel: `${startStr} – ${endStr}`,
            daily: scaledDaily,
            aggregated: {
              ...agg,
              views: videoViews,
              viewsFormatted: fmtV(videoViews),
              watchTimeHrs: videoWatchTime,
              watchTimeHrsFormatted: fmtW(videoWatchTime),
              revenue: videoRevenue,
              revenueFormatted: formatINR(videoRevenue),
              subscribersNet: videoSubsNet,
              subscribersGained: videoSubsGained,
              subscribersLost: videoSubsLost,
              subscribersNetFormatted: fmtS(videoSubsNet),
              impressions: videoImpressions,
              impressionsFormatted: fmtV(videoImpressions),
              rpm: videoRpm,
              cpm: targetVideo?.cpm ? Number(targetVideo.cpm) : 58.00,
              ctr: videoCtr
            },
            trafficSources: getTrafficSources(videoViews),
            audience: getAudienceBreakdown(videoViews)
          };
        }

        // ── Channel analytics: always derive from actual video store data ──
        // Scale factor = ratio of current video totals to the original baseline.
        // This means ANY CRM change (per-video, bulk multiply, RPM) immediately
        // cascades into metric cards and the daily chart.
        const storeVideos = state.videos || [];
        const currentTotalViews = storeVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
        // Scale factor: how much the current video total differs from baseline
        const viewsScale = (BASELINE_VIEWS > 0 && currentTotalViews > 0)
          ? currentTotalViews / BASELINE_VIEWS
          : 1;
        const currentTotalRevenue = storeVideos.reduce((acc, v) => acc + ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64)), 0);
        const revenueScaleFactor = (BASELINE_REVENUE > 0 && currentTotalRevenue > 0)
          ? currentTotalRevenue / BASELINE_REVENUE
          : viewsScale;

        // Apply scale to the simulation's date-range aggregates
        const scaledViews   = Math.round(agg.views   * viewsScale);
        const scaledRevenue = parseFloat((agg.revenue * revenueScaleFactor).toFixed(2));
        const scaledWatch   = parseFloat((agg.watchTimeHrs * viewsScale).toFixed(1));
        const scaledSubsGained = storeVideos.reduce((acc, v) => acc + (Number(v.subscribersGained) || 0), 0) || Math.round(agg.subscribersNet * viewsScale);
        const scaledSubsLost   = storeVideos.reduce((acc, v) => acc + (Number(v.subscribersLost) || 0), 0);
        const scaledSubsNet    = scaledSubsGained - scaledSubsLost;

        // channelInfo explicit values (set via Channel Metrics CRM tab) take priority if set
        const ci = state.channelInfo || {};
        const isExplicitChannel = Boolean(ci.hasExplicitChannelMetrics);
        const finalViews   = (isExplicitChannel && ci.viewsLast28Days > 0) ? Math.round(ci.viewsLast28Days * (agg.views / (INITIAL_AGG.views || 1))) : scaledViews;
        const finalRevenue = (isExplicitChannel && ci.revenueLast28Days > 0) ? parseFloat((ci.revenueLast28Days * (agg.revenue / (INITIAL_AGG.revenue || 1))).toFixed(2)) : scaledRevenue;
        const finalWatch   = (isExplicitChannel && ci.watchTimeLast28Days > 0) ? parseFloat((ci.watchTimeLast28Days * (agg.watchTimeHrs / (INITIAL_AGG.watchTimeHrs || 1))).toFixed(1)) : scaledWatch;
        const finalSubsNet = (isExplicitChannel && ci.subscribersGainedLast28Days !== undefined)
          ? ci.subscribersGainedLast28Days : scaledSubsNet;
        const finalImpressions = Math.round(finalViews * 11.2);

        // Scale daily chart proportionally so chart shape is preserved
        const simDailyTotal = filteredDaily.reduce((acc, d) => acc + (d.views || 0), 0) || 1;
        const scaledDaily = filteredDaily.map(d => {
          const w = (d.views || 0) / simDailyTotal;
          return {
            ...d,
            views:          Math.round(finalViews   * w),
            revenue:        parseFloat((finalRevenue * w).toFixed(2)),
            watchTimeHrs:   parseFloat((finalWatch   * w).toFixed(1)),
            subscribersNet: Math.round(finalSubsNet  * w),
            impressions:    Math.round(finalImpressions * w),
            ctr:            agg.ctr || 8.9,
          };
        });

        return {
          dateRangeLabel: `${startStr} – ${endStr}`,
          daily: scaledDaily,
          aggregated: {
            ...agg,
            views:                   finalViews,
            viewsFormatted:          fmtV(finalViews),
            watchTimeHrs:            finalWatch,
            watchTimeHrsFormatted:   fmtW(finalWatch),
            revenue:                 finalRevenue,
            revenueFormatted:        formatINR(finalRevenue),
            subscribersNet:          finalSubsNet,
            subscribersNetFormatted: fmtS(finalSubsNet),
            subscribersGained:       scaledSubsGained,
            subscribersLost:         scaledSubsLost,
            impressions:             finalImpressions,
            impressionsFormatted:    fmtV(finalImpressions),
            ctr:                     agg.ctr || 8.9,
            rpm:                     finalViews > 0 ? parseFloat(((finalRevenue / finalViews) * 1000).toFixed(2)) : (agg.rpm || 33.64),
            cpm:                     agg.cpm || 58.00,
          },
          trafficSources: getTrafficSources(finalViews),
          audience:       getAudienceBreakdown(finalViews),
        };
      },

      loadFromSpreadsheet: async (silent = false, fromLiveSync = false) => {
        if (get().isSpreadsheetLoading && !fromLiveSync) return;
        set({ isSpreadsheetLoading: true, spreadsheetError: null });

        try {
          const [data, status] = await Promise.all([
            SpreadsheetDataService.getData(),
            SpreadsheetDataService.getStatus()
          ]);

          const parsedData = applySpreadsheetData(data);
          const currentStore = get();
          const hasCrm = currentStore.hasCrmOverrides;

          set({
            ...parsedData,
            // Preserve active CRM data overrides if present
            channelInfo: hasCrm ? currentStore.channelInfo : parsedData.channelInfo,
            videos: hasCrm ? currentStore.videos : parsedData.videos,
            hasCrmOverrides: hasCrm,
            mode: 'spreadsheet',
            isSpreadsheetLoading: false,
            lastSpreadsheetSync: status.lastLoadedAt || new Date().toISOString(),
            spreadsheetConfig: {
              source: status.source,
              excelPath: status.excelPath,
              googleSheetsId: status.googleSheetsId,
              autoRefreshInterval: status.autoRefreshInterval,
              liveSync: status.liveSync
            },
            spreadsheetError: null
          });

          if (!silent) {
            get().showToast('Spreadsheet data loaded', 'success');
          }
        } catch (err) {
          console.error('Spreadsheet load error:', err);
          set({
            isSpreadsheetLoading: false,
            spreadsheetError: err.message
          });
          if (!silent) {
            get().showToast(`Spreadsheet load failed: ${err.message}`, 'warning');
          }
        }
      },

      refreshSpreadsheet: async () => {
        set({ isSpreadsheetLoading: true });
        try {
          await SpreadsheetDataService.refresh();
          await get().loadFromSpreadsheet(true);
          get().showToast('Spreadsheet refreshed successfully', 'success');
        } catch (err) {
          set({ isSpreadsheetLoading: false, spreadsheetError: err.message });
          get().showToast(`Refresh failed: ${err.message}`, 'warning');
        }
      },

      updateSpreadsheetConfig: async (config) => {
        try {
          await SpreadsheetDataService.updateConfig(config);
          await get().loadFromSpreadsheet(true);
          get().showToast('Spreadsheet configuration updated', 'success');
        } catch (err) {
          get().showToast(`Config update failed: ${err.message}`, 'warning');
        }
      },

      addVideo: (newVid) => set((state) => {
        const videoObj = {
          id: `v${Date.now()}`,
          views: 0,
          viewsFormatted: '0',
          comments: 0,
          likes: 0,
          date: new Date().toISOString().split('T')[0],
          restrictions: 'None',
          monetization: true,
          type: 'video',
          visibility: 'Private',
          ...newVid
        };
        return {
          videos: [videoObj, ...state.videos],
          channelInfo: {
            ...state.channelInfo,
            totalUploads: state.videos.length + 1
          }
        };
      }),

      updateVideo: (id, updates) => set((state) => ({
        videos: state.videos.map(v => v.id === id ? { ...v, ...updates } : v)
      })),

      deleteVideo: (id) => set((state) => ({
        videos: state.videos.filter(v => v.id !== id),
        comments: state.comments.filter(c => c.videoId !== id),
        subtitles: state.subtitles.filter(s => s.videoId !== id),
        copyrightClaims: state.copyrightClaims.filter(c => c.videoId !== id)
      })),

      bulkDeleteVideos: (ids) => set((state) => ({
        videos: state.videos.filter(v => !ids.includes(v.id))
      })),

      bulkUpdateVisibility: (ids, visibility) => set((state) => ({
        videos: state.videos.map(v => ids.includes(v.id) ? { ...v, visibility } : v)
      })),

      addPlaylist: (title) => set((state) => ({
        playlists: [
          { id: `pl${Date.now()}`, title, videoCount: 0, visibility: 'Public', lastUpdated: 'Just now' },
          ...state.playlists
        ]
      })),

      deletePlaylist: (id) => set((state) => ({
        playlists: state.playlists.filter(p => p.id !== id)
      })),

      addCommentReply: (commentId, replyText) => set((state) => ({
        comments: state.comments.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              replies: [
                ...(c.replies || []),
                {
                  id: `r_${Date.now()}`,
                  author: state.channelInfo.name,
                  authorAvatar: state.channelInfo.avatar,
                  time: 'Just now',
                  text: replyText
                }
              ]
            };
          }
          return c;
        })
      })),

      toggleCommentHeart: (commentId) => set((state) => ({
        comments: state.comments.map(c => c.id === commentId ? { ...c, heart: !c.heart } : c)
      })),

      toggleCommentLike: (commentId) => set((state) => ({
        comments: state.comments.map(c => c.id === commentId ? { ...c, likes: c.likes + (c.userLiked ? -1 : 1), userLiked: !c.userLiked } : c)
      })),

      deleteComment: (commentId) => set((state) => ({
        comments: state.comments.filter(c => c.id !== commentId)
      })),

      hideUserFromChannel: (authorName) => set((state) => ({
        comments: state.comments.filter(c => c.author !== authorName),
        settings: {
          ...state.settings,
          blockedWords: (state.settings.blockedWords || '') + `, ${authorName}`
        }
      })),

      updateSubtitles: (id, updates) => set((state) => ({
        subtitles: state.subtitles.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      resolveCopyrightClaim: (claimId) => set((state) => ({
        copyrightClaims: state.copyrightClaims.map(c => c.id === claimId ? { ...c, status: 'Resolved', impact: 'Claim Released' } : c)
      })),

      toggleStarAudioTrack: (trackId) => set((state) => ({
        audioTracks: state.audioTracks.map(t => t.id === trackId ? { ...t, starred: !t.starred } : t)
      })),

      updateChannelInfo: (updates) => set((state) => ({
        channelInfo: { ...state.channelInfo, ...updates }
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      markAllNotificationsRead: () => set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true }))
      })),

      // ─── CRM Actions ───────────────────────────────────────────────────
      // Update a single video's numeric metrics, subscriber gain & thumbnail
      updateVideoMetrics: (id, updates) => set((state) => {
        const updatedVideos = state.videos.map(v => {
          if (String(v.id) !== String(id)) return v;
          const merged = { ...v, ...updates };
          const rpm = Number(updates.rpm !== undefined ? updates.rpm : (v.rpm ?? 33.64));
          const views = Number(updates.views !== undefined ? updates.views : (v.views ?? 0));
          const revenue = (views / 1000) * rpm;
          const likes = Number(updates.likes !== undefined ? updates.likes : (v.likes ?? Math.round(views * 0.046)));
          const comments = Number(updates.comments !== undefined ? updates.comments : (v.comments ?? Math.round(views * 0.0034)));
          const subsGained = Number(updates.subscribersGained !== undefined ? updates.subscribersGained : (v.subscribersGained ?? Math.round(views * 0.014)));
          const subsLost = Number(updates.subscribersLost !== undefined ? updates.subscribersLost : (v.subscribersLost ?? Math.round(subsGained * 0.12)));
          const netSubs = subsGained - subsLost;
          const thumbnail = updates.thumbnail !== undefined ? updates.thumbnail : v.thumbnail;

          return {
            ...merged,
            thumbnail,
            rpm,
            views,
            revenue,
            likes,
            comments,
            subscribersGained: subsGained,
            subscribersLost: subsLost,
            netSubscribers: netSubs,
            viewsFormatted: fmtV(views),
            revenueFormatted: formatINR(revenue)
          };
        });

        const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
        const totalRevenue = updatedVideos.reduce((acc, v) => acc + ((Number(v.views) || 0) / 1000 * (Number(v.rpm) || 33.64)), 0);
        const scale = (BASELINE_VIEWS > 0 && totalViews > 0) ? totalViews / BASELINE_VIEWS : 1;
        const totalWatch = (INITIAL_AGG.watchTimeHrs || 1383.8) * scale;
        const totalSubsGained = updatedVideos.reduce((acc, v) => acc + (Number(v.subscribersGained) || 0), 0);
        const totalSubsLost = updatedVideos.reduce((acc, v) => acc + (Number(v.subscribersLost) || 0), 0);
        const netSubs = totalSubsGained - totalSubsLost;

        return {
          hasCrmOverrides: true,
          videos: updatedVideos,
          channelInfo: {
            ...state.channelInfo,
            viewsLast28Days: Math.round(INITIAL_AGG.views * scale),
            viewsLast28DaysFormatted: fmtV(INITIAL_AGG.views * scale),
            revenueLast28Days: parseFloat(((INITIAL_AGG.revenue || 567842) * (totalRevenue / (BASELINE_REVENUE || 1))).toFixed(2)),
            revenueLast28DaysFormatted: formatINR((INITIAL_AGG.revenue || 567842) * (totalRevenue / (BASELINE_REVENUE || 1))),
            watchTimeLast28Days: parseFloat(totalWatch.toFixed(1)),
            watchTimeLast28DaysFormatted: fmtW(totalWatch),
            subscribersGainedLast28Days: netSubs,
            subscribersGainedLast28DaysFormatted: fmtS(netSubs)
          }
        };
      }),

      // Update channel-level CRM metrics (subscribers, views, revenue, RPM …)
      crmUpdateChannelMetrics: (updates) => set((state) => {
        const subs = updates.subscribers !== undefined ? Number(updates.subscribers) : state.channelInfo.subscribers;
        const subsGained = updates.subscribersGainedLast28Days !== undefined ? Number(updates.subscribersGainedLast28Days) : (state.channelInfo.subscribersGainedLast28Days || 0);
        const views28 = updates.viewsLast28Days !== undefined ? Number(updates.viewsLast28Days) : (state.channelInfo.viewsLast28Days || 0);
        const watchTime28 = updates.watchTimeLast28Days !== undefined ? Number(updates.watchTimeLast28Days) : (state.channelInfo.watchTimeLast28Days || 0);
        const revenue28 = updates.revenueLast28Days !== undefined ? Number(updates.revenueLast28Days) : (state.channelInfo.revenueLast28Days || 0);

        return {
          hasCrmOverrides: true,
          channelInfo: {
            ...state.channelInfo,
            ...updates,
            hasExplicitChannelMetrics: true,
            subscribers: subs,
            subscribersFormatted: subs ? subs.toLocaleString('en-IN') : '0',
            subscribersGainedLast28Days: subsGained,
            subscribersGainedLast28DaysFormatted: fmtS(subsGained),
            viewsLast28Days: views28,
            viewsLast28DaysFormatted: fmtV(views28),
            watchTimeLast28Days: watchTime28,
            watchTimeLast28DaysFormatted: fmtW(watchTime28),
            revenueLast28Days: revenue28,
            revenueLast28DaysFormatted: formatINR(revenue28)
          }
        };
      }),

      // Set a single RPM across all videos and recalculate revenues
      bulkSetVideoRPM: (rpm) => set((state) => {
        const r = Number(rpm);
        const updatedVideos = state.videos.map(v => {
          const views = Number(v.views) || 0;
          const revenue = (views / 1000) * r;
          return {
            ...v,
            rpm: r,
            revenue,
            revenueFormatted: formatINR(revenue)
          };
        });
        const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
        const totalRevenue = updatedVideos.reduce((acc, v) => acc + ((Number(v.views) || 0) / 1000 * r), 0);
        return {
          hasCrmOverrides: true,
          videos: updatedVideos,
          channelInfo: {
            ...state.channelInfo,
            revenueLast28Days: parseFloat(((INITIAL_AGG.revenue || 567842) * (totalRevenue / (BASELINE_REVENUE || 1))).toFixed(2)),
            revenueLast28DaysFormatted: formatINR((INITIAL_AGG.revenue || 567842) * (totalRevenue / (BASELINE_REVENUE || 1)))
          }
        };
      }),

      // Multiply all video views by a factor (e.g. 1.2 = +20%)
      bulkMultiplyViews: (factor) => set((state) => {
        const f = Number(factor) || 1;
        const updatedVideos = state.videos.map(v => {
          const views = Math.round((Number(v.views) || 0) * f);
          const rpm = Number(v.rpm) || 33.64;
          const revenue = (views / 1000) * rpm;
          return {
            ...v,
            views,
            viewsFormatted: fmtV(views),
            revenue,
            revenueFormatted: formatINR(revenue)
          };
        });
        const totalViews = updatedVideos.reduce((acc, v) => acc + (Number(v.views) || 0), 0);
        const scale = (BASELINE_VIEWS > 0 && totalViews > 0) ? totalViews / BASELINE_VIEWS : 1;
        const totalWatch = (INITIAL_AGG.watchTimeHrs || 1383.8) * scale;
        return {
          hasCrmOverrides: true,
          videos: updatedVideos,
          channelInfo: {
            ...state.channelInfo,
            viewsLast28Days: Math.round(INITIAL_AGG.views * scale),
            viewsLast28DaysFormatted: fmtV(INITIAL_AGG.views * scale),
            watchTimeLast28Days: parseFloat(totalWatch.toFixed(1)),
            watchTimeLast28DaysFormatted: fmtW(totalWatch)
          }
        };
      }),

      // Apply preset scenarios or import JSON
      crmApplyPreset: (presetKey) => set((state) => {
        const fmt = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
        const fmtINR = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (presetKey === 'viral') {
          const subs = 25000000;
          const subsGained = 1200000;
          const views = 45000000;
          const watchTime = 180000;
          const revenue = 185000.00;
          return {
            hasCrmOverrides: true,
            channelInfo: {
              ...state.channelInfo,
              subscribers: subs,
              subscribersFormatted: fmt(subs),
              subscribersGainedLast28Days: subsGained,
              subscribersGainedLast28DaysFormatted: `+${fmt(subsGained)}`,
              viewsLast28Days: views,
              viewsLast28DaysFormatted: fmt(views),
              watchTimeLast28Days: watchTime,
              watchTimeLast28DaysFormatted: fmt(watchTime),
              revenueLast28Days: revenue,
              revenueLast28DaysFormatted: fmtINR(revenue),
            },
            videos: state.videos.map(v => {
              const newViews = v.views * 5;
              const newRpm = 45.00;
              const newRev = (newViews / 1000) * newRpm;
              return {
                ...v,
                views: newViews,
                viewsFormatted: fmt(newViews),
                rpm: newRpm,
                revenue: newRev,
                revenueFormatted: fmtINR(newRev)
              };
            })
          };
        }

        if (presetKey === 'high_rpm') {
          return {
            hasCrmOverrides: true,
            videos: state.videos.map(v => {
              const newRpm = 85.50;
              const newRev = (v.views / 1000) * newRpm;
              return {
                ...v,
                rpm: newRpm,
                revenue: newRev,
                revenueFormatted: fmtINR(newRev)
              };
            })
          };
        }

        return {};
      }),

      crmImportState: (newState) => set((state) => ({
        ...state,
        ...newState,
        hasCrmOverrides: true
      })),

      reloadFromSpreadsheet: () => {
        set({ hasCrmOverrides: false });
        return get().refreshSpreadsheet();
      }
    }),
    {
      name: 'yt-studio-analytics-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.channelInfo) {
            if (state.channelInfo.revenueLast28DaysFormatted) {
              state.channelInfo.revenueLast28DaysFormatted = formatINR(state.channelInfo.revenueLast28DaysFormatted);
            }
            if (state.channelInfo.totalRevenueFormatted) {
              state.channelInfo.totalRevenueFormatted = formatINR(state.channelInfo.totalRevenueFormatted);
            }
            state.channelInfo.currency = 'INR';
          }
          if (state.videos && Array.isArray(state.videos)) {
            state.videos = state.videos.map(v => ({
              ...v,
              revenueFormatted: formatINR(v.revenueFormatted || v.revenue)
            }));
          }
          if (state.settings) {
            state.settings.currency = 'INR - Indian Rupee';
          }
        }
      },
      partialize: (state) => ({
        settings: state.settings,
        spreadsheetConfig: state.spreadsheetConfig,
        selectedDateRange: state.selectedDateRange,
        hasCrmOverrides: state.hasCrmOverrides,
        channelInfo: state.channelInfo,
        videos: state.videos
      })
    }
  )
);
