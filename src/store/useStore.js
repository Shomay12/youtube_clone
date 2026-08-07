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

const INITIAL_REALTIME = generateRealtimeDataset();
const INITIAL_LAST28_DAILY = filterDailyMetricsByRange(DAILY_SERIES, '2026-07-07', '2026-08-04');
const INITIAL_AGG = aggregateMetrics(INITIAL_LAST28_DAILY);

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
    totalRevenueFormatted: '$721,577.00',
    currency: 'USD'
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
    currency: 'USD ($)',
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
        } else if (activeKey === 'lifetime') {
          startStr = '2025-08-01';
          endStr = '2026-08-04';
        } else if (activeKey === 'custom') {
          startStr = state.customStartDate || '2026-07-07';
          endStr = state.customEndDate || '2026-08-04';
        }

        const filteredDaily = filterDailyMetricsByRange(DAILY_SERIES, startStr, endStr);
        const agg = aggregateMetrics(filteredDaily, videoId);

        // Adjust for individual video proportional share if videoId is specified
        if (videoId) {
          const targetVideo = state.videos.find(v => v.id === videoId) || state.videos[0];
          const videoShare = targetVideo ? (targetVideo.views / 21450000) : 0.1;
          const videoViews = Math.round(agg.views * videoShare * 3.5);
          const videoRevenue = parseFloat(((videoViews / 1000) * (targetVideo?.rpm || 33.64)).toFixed(2));
          const videoWatchTime = parseFloat((videoViews * (targetVideo?.avgViewDurationSecs || 240) / 3600).toFixed(1));

          return {
            dateRangeLabel: `${startStr} – ${endStr}`,
            daily: filteredDaily,
            aggregated: {
              ...agg,
              views: videoViews,
              viewsFormatted: videoViews >= 1000000 ? `${(videoViews / 1000000).toFixed(1)}M` : `${(videoViews / 1000).toFixed(0)}K`,
              watchTimeHrs: videoWatchTime,
              watchTimeHrsFormatted: `${videoWatchTime.toLocaleString()} hrs`,
              revenue: videoRevenue,
              revenueFormatted: `$${videoRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              rpm: targetVideo?.rpm || 33.64,
              cpm: targetVideo?.cpm || 58.00,
              ctr: targetVideo?.ctr || 8.5
            },
            trafficSources: getTrafficSources(videoViews),
            audience: getAudienceBreakdown(videoViews)
          };
        }

        if (state.hasCrmOverrides && state.channelInfo) {
          const crmViews = state.channelInfo.viewsLast28Days || agg.views;
          const crmWatch = state.channelInfo.watchTimeLast28Days || agg.watchTimeHrs;
          const crmRev = state.channelInfo.revenueLast28Days || agg.revenue;
          const crmSubs = state.channelInfo.subscribersGainedLast28Days || agg.subscribersNet;

          const mergedAgg = {
            ...agg,
            views: crmViews,
            viewsFormatted: state.channelInfo.viewsLast28DaysFormatted || agg.viewsFormatted,
            watchTimeHrs: crmWatch,
            watchTimeHrsFormatted: state.channelInfo.watchTimeLast28DaysFormatted || agg.watchTimeHrsFormatted,
            revenue: crmRev,
            revenueFormatted: state.channelInfo.revenueLast28DaysFormatted || agg.revenueFormatted,
            subscribersNet: crmSubs,
            subscribersNetFormatted: state.channelInfo.subscribersGainedLast28DaysFormatted || agg.subscribersNetFormatted,
          };

          return {
            dateRangeLabel: `${startStr} – ${endStr}`,
            daily: filteredDaily,
            aggregated: mergedAgg,
            trafficSources: getTrafficSources(crmViews),
            audience: getAudienceBreakdown(crmViews)
          };
        }

        return {
          dateRangeLabel: `${startStr} – ${endStr}`,
          daily: filteredDaily,
          aggregated: agg,
          trafficSources: getTrafficSources(agg.views),
          audience: getAudienceBreakdown(agg.views)
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
      // Update a single video's numeric metrics; auto-recalculates revenue from views × rpm
      updateVideoMetrics: (id, updates) => set((state) => ({
        hasCrmOverrides: true,
        videos: state.videos.map(v => {
          if (String(v.id) !== String(id)) return v;
          const merged = { ...v, ...updates };
          const rpm = Number(updates.rpm ?? v.rpm ?? 33.64);
          const views = Number(updates.views ?? v.views ?? 0);
          const revenue = (views / 1000) * rpm;
          return {
            ...merged,
            rpm,
            views,
            revenue,
            viewsFormatted: views >= 1_000_000
              ? `${(views / 1_000_000).toFixed(1)}M`
              : views >= 1_000 ? `${(views / 1_000).toFixed(1)}K` : String(views),
            revenueFormatted: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          };
        })
      })),

      // Update channel-level CRM metrics (subscribers, views, revenue, RPM …)
      crmUpdateChannelMetrics: (updates) => set((state) => {
        const subs = updates.subscribers !== undefined ? Number(updates.subscribers) : state.channelInfo.subscribers;
        const subsGained = updates.subscribersGainedLast28Days !== undefined ? Number(updates.subscribersGainedLast28Days) : (state.channelInfo.subscribersGainedLast28Days || 0);
        const views28 = updates.viewsLast28Days !== undefined ? Number(updates.viewsLast28Days) : (state.channelInfo.viewsLast28Days || 0);
        const watchTime28 = updates.watchTimeLast28Days !== undefined ? Number(updates.watchTimeLast28Days) : (state.channelInfo.watchTimeLast28Days || 0);
        const revenue28 = updates.revenueLast28Days !== undefined ? Number(updates.revenueLast28Days) : (state.channelInfo.revenueLast28Days || 0);

        const fmtSubs = (n) => n.toLocaleString('en-IN');
        const fmtViews = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 100_000 ? `${(n / 100_000).toFixed(1)}L` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
        const fmtWatch = (n) => n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`;
        const fmtRev = (n) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return {
          hasCrmOverrides: true,
          channelInfo: {
            ...state.channelInfo,
            ...updates,
            subscribers: subs,
            subscribersFormatted: fmtSubs(subs),
            subscribersGainedLast28Days: subsGained,
            subscribersGainedLast28DaysFormatted: `${subsGained > 0 ? '+' : ''}${subsGained}`,
            viewsLast28Days: views28,
            viewsLast28DaysFormatted: fmtViews(views28),
            watchTimeLast28Days: watchTime28,
            watchTimeLast28DaysFormatted: fmtWatch(watchTime28),
            revenueLast28Days: revenue28,
            revenueLast28DaysFormatted: fmtRev(revenue28)
          }
        };
      }),

      // Set a single RPM across all videos and recalculate revenues
      bulkSetVideoRPM: (rpm) => set((state) => ({
        hasCrmOverrides: true,
        videos: state.videos.map(v => {
          const r = Number(rpm);
          const revenue = (v.views / 1000) * r;
          return {
            ...v,
            rpm: r,
            revenue,
            revenueFormatted: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          };
        })
      })),

      // Multiply all video views by a factor (e.g. 1.2 = +20%)
      bulkMultiplyViews: (factor) => set((state) => ({
        hasCrmOverrides: true,
        videos: state.videos.map(v => {
          const views = Math.round(v.views * factor);
          const revenue = (views / 1000) * (v.rpm || 33.64);
          return {
            ...v,
            views,
            viewsFormatted: views >= 1_000_000 ? `${(views / 1_000_000).toFixed(1)}M` : views >= 1_000 ? `${(views / 1_000).toFixed(1)}K` : String(views),
            revenue,
            revenueFormatted: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          };
        })
      })),

      // Apply preset scenarios or import JSON
      crmApplyPreset: (presetKey) => set((state) => {
        const fmt = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);
        const fmtUSD = (n) => `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
              revenueLast28DaysFormatted: fmtUSD(revenue),
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
                revenueFormatted: fmtUSD(newRev)
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
                revenueFormatted: fmtUSD(newRev)
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
