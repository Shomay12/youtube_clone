/**
 * AnalyticsSimulationEngine.js
 * 
 * Mathematically rigorous simulation engine for YouTube Studio Analytics.
 * Enforces exact formulas:
 *   - Revenue = (Views / 1000) * RPM
 *   - Watch Time (hrs) = Views * (Avg View Duration in sec / 3600)
 *   - Net Subscribers = Subscribers Gained - Subscribers Lost
 *   - Views = Impressions * (CTR / 100)
 *   - Country-weighted RPMs yielding channel average RPM ~$33.64 and CPM ~$58.00
 */

export const CHANNEL_BENCHMARKS = {
  name: 'Kids Toon',
  handle: '@kidstoon',
  subscribers: 412850,
  lifetimeViews: 21450000,
  averageRpm: 33.64,
  averageCpm: 58.00,
  joinedDate: '2021-03-15',
  country: 'United States',
  avatar: '/channel-avatar.png',
  banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
};

export const VIDEO_ID_TO_DATE = {
  'VID001': '2026-08-11',
  'VID002': '2026-08-07',
  'VID003': '2026-07-21',
  'VID004': '2026-07-12',
  'VID005': '2026-06-02',
  'VID006': '2026-04-28',
  'VID007': '2026-04-10',
  'VID008': '2026-03-22',
  'VID009': '2026-03-15',
  'VID010': '2026-02-18'
};

export const TITLE_TO_SCHEDULE_DATE = {
  'Long AI Video Kaise Banaye (14 Min Video) | AI Video Kaise Banaye | AI Video Maker': '2026-08-11',
  'Create Kids Cartoon Nursery Rhymes with AI | AI Video Kaise Banaye | AI Video Maker': '2026-08-07',
  'This Man Truly Loves You But Why Is There Still Another Woman in His Life?': '2026-07-21',
  'AI Blogging Course in 2026 using facebook, Instagram Youtube...': '2026-07-12',
  'बिना चेहरा दिखाए YouTube Video कैसे बनाए ? New Channel Ideas | YouTube search': '2026-06-02',
  'Make AI Videos Using Notebook LM': '2026-04-28',
  'Raj Shamani Business Idea': '2026-04-10',
  'How to Make AI Influencers For FREE | Lip Sync Dancing AI Influencer...': '2026-03-22',
  'This AI Saved Me 20 Hours': '2026-03-15',
  'My Biggest AI Project Yet': '2026-02-18'
};

export const VIDEO_PUBLISH_SCHEDULE = [
  '2026-08-11',
  '2026-08-07',
  '2026-07-21',
  '2026-07-12',
  '2026-06-02',
  '2026-04-28',
  '2026-04-10',
  '2026-03-22',
  '2026-03-15',
  '2026-02-18'
];

export const RAW_VIDEOS = [
  {
    id: 'VID001',
    title: 'This Man Truly Loves You But Why Is There Still Another Woman in His Life?',
    description: 'This Man Truly Loves You But Why Is There Still Another Woman in His Life?',
    duration: '15:20',
    durationSecs: 920,
    avgViewDuration: '11:27',
    avgViewDurationSecs: 687,
    views: 274365,
    ctr: 8.9,
    rpm: 435.066426,
    cpm: 791.03,
    publishDate: '2026-07-21',
    thumbnail: '/thumbnails/latest_video.png',
    category: 'Entertainment',
    watchTimeHrs: 52346,
    revenue: 119367,
    revenueFormatted: '₹1,19,367.00',
    watchTimeHrsFormatted: '52.3K hrs',
    subscribersGained: 4946,
    subscribersLost: 0,
    netSubscribers: 4946,
    viewsFormatted: '274.4K'
  },
  {
    id: 'VID002',
    title: 'Long AI Video Kaise Banaye (14 Min Video) | AI Video Kaise Banaye | AI Video Maker',
    description: 'Full 14 minute long AI video creation masterclass.',
    duration: '14:22',
    durationSecs: 862,
    avgViewDuration: '3:45',
    avgViewDurationSecs: 225,
    views: 892000,
    ctr: 7.2,
    rpm: 33.80,
    cpm: 58.14,
    publishDate: '2026-08-11',
    thumbnail: '/thumbnails/2.webp',
    category: 'Entertainment'
  },
  {
    id: 'VID003',
    title: 'Create Kids Cartoon Nursery Rhymes with AI | AI Video Kaise Banaye | AI Video Maker',
    description: 'Nursery rhymes cartoon video creation using AI tools.',
    duration: '12:14',
    durationSecs: 734,
    avgViewDuration: '2:57',
    avgViewDurationSecs: 177,
    views: 650000,
    ctr: 6.4,
    rpm: 33.80,
    cpm: 58.14,
    publishDate: '2026-08-07',
    thumbnail: '/thumbnails/3.webp',
    category: 'Entertainment'
  },
  {
    id: 'VID004',
    title: 'AI Blogging Course in 2026 using facebook, Instagram Youtube...',
    description: 'Full course on AI blogging, social media traffic & monetization.',
    duration: '10:18',
    durationSecs: 618,
    avgViewDuration: '3:12',
    avgViewDurationSecs: 192,
    views: 529000,
    ctr: 6.2,
    rpm: 33.80,
    cpm: 58.14,
    publishDate: '2026-07-12',
    thumbnail: '/thumbnails/4.webp',
    category: 'Education'
  },
  {
    id: 'VID005',
    title: 'बिना चेहरा दिखाए YouTube Video कैसे बनाए ? New Channel Ideas | YouTube search',
    description: 'Faceless YouTube channel ideas and automation guide.',
    duration: '10:18',
    durationSecs: 618,
    avgViewDuration: '1:51',
    avgViewDurationSecs: 111,
    views: 410000,
    ctr: 7.8,
    rpm: 33.70,
    cpm: 57.96,
    publishDate: '2026-07-31',
    thumbnail: '/thumbnails/5.webp',
    category: 'Education'
  },
  {
    id: 'VID006',
    title: 'Make AI Videos Using Notebook LM',
    description: 'Learn to build videos with NotebookLM.',
    duration: '12:14',
    durationSecs: 734,
    avgViewDuration: '0:31',
    avgViewDurationSecs: 31,
    views: 438000,
    ctr: 4.9,
    rpm: 34.50,
    cpm: 59.34,
    publishDate: '2026-07-27',
    thumbnail: '/thumbnails/4.webp',
    category: 'Science & Technology'
  },
  {
    id: 'VID007',
    title: 'Raj Shamani Business Idea',
    description: 'Analyzing top business ideas and SaaS strategies.',
    duration: '08:42',
    durationSecs: 522,
    avgViewDuration: '0:46',
    avgViewDurationSecs: 46,
    views: 2110000,
    ctr: 9.3,
    rpm: 33.20,
    cpm: 57.10,
    publishDate: '2026-07-23',
    thumbnail: '/thumbnails/5.webp',
    category: 'Business'
  },
  {
    id: 'VID008',
    title: 'How to Make AI Influencers For FREE | Lip Sync Dancing AI Influencer...',
    description: 'Create AI influencers with lip-sync and dancing animations for free.',
    duration: '07:56',
    durationSecs: 476,
    avgViewDuration: '2:03',
    avgViewDurationSecs: 123,
    views: 973000,
    ctr: 7.1,
    rpm: 33.40,
    cpm: 57.45,
    publishDate: '2026-07-19',
    thumbnail: '/thumbnails/7.webp',
    category: 'Entertainment'
  },
  {
    id: 'VID009',
    title: 'This AI Saved Me 20 Hours',
    description: 'Automation tools saving developer and creator time.',
    duration: '09:31',
    durationSecs: 571,
    avgViewDuration: '3:45',
    avgViewDurationSecs: 225,
    views: 1678000,
    ctr: 8.4,
    rpm: 34.00,
    cpm: 58.48,
    publishDate: '2026-07-15',
    thumbnail: '/thumbnails/2.webp',
    category: 'Science & Technology'
  },
  {
    id: 'VID010',
    title: 'My Biggest AI Project Yet',
    description: 'Unveiling autonomous AI agent architecture built over 3 months.',
    duration: '07:56',
    durationSecs: 476,
    avgViewDuration: '3:20',
    avgViewDurationSecs: 200,
    views: 812000,
    ctr: 6.8,
    rpm: 33.60,
    cpm: 57.79,
    publishDate: '2026-07-11',
    thumbnail: '/thumbnails/3.webp',
    category: 'Science & Technology'
  }
];

// Calculate derived stats for raw videos ensuring internal consistency
export const PROCESSED_VIDEOS = RAW_VIDEOS.map(v => {
  const impressions = v.impressions || Math.round(v.views / (v.ctr / 100));
  const watchTimeHrs = v.watchTimeHrs !== undefined ? Number(v.watchTimeHrs) : parseFloat((v.views * (v.avgViewDurationSecs / 3600)).toFixed(1));
  const revenue = v.revenue !== undefined ? Number(v.revenue) : parseFloat(((v.views / 1000) * v.rpm).toFixed(2));
  const likes = v.likes || Math.round(v.views * 0.046);
  const comments = v.comments || Math.round(v.views * 0.0034);
  const shares = v.shares || Math.round(v.views * 0.0082);
  const subscribersGained = v.subscribersGained !== undefined ? Number(v.subscribersGained) : Math.round(v.views * 0.014);
  const subscribersLost = v.subscribersLost !== undefined ? Number(v.subscribersLost) : 0;
  const netSubscribers = v.netSubscribers !== undefined ? Number(v.netSubscribers) : subscribersGained;

  return {
    ...v,
    impressions,
    watchTimeHrs,
    revenue,
    revenueFormatted: v.revenueFormatted || `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    viewsFormatted: v.viewsFormatted || (v.views >= 1000000 ? `${(v.views / 1000000).toFixed(1)}M` : `${(v.views / 1000).toFixed(1)}K`),
    likes,
    comments,
    shares,
    subscribersGained,
    subscribersLost,
    netSubscribers
  };
});

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const FULL_MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatSingleDate(dateInput) {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput.includes('T') ? dateInput : `${dateInput}T00:00:00Z`) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);
  const month = MONTH_NAMES[d.getUTCMonth()];
  const day = d.getUTCDate();
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatDateRangeText(startDateInput, endDateInput) {
  if (!startDateInput || !endDateInput) return '';
  const s = typeof startDateInput === 'string' ? new Date(startDateInput.includes('T') ? startDateInput : `${startDateInput}T00:00:00Z`) : startDateInput;
  const e = typeof endDateInput === 'string' ? new Date(endDateInput.includes('T') ? endDateInput : `${endDateInput}T00:00:00Z`) : endDateInput;
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return `${startDateInput} – ${endDateInput}`;

  const sMonth = MONTH_NAMES[s.getUTCMonth()];
  const sDay = s.getUTCDate();
  const sYear = s.getUTCFullYear();

  const eMonth = MONTH_NAMES[e.getUTCMonth()];
  const eDay = e.getUTCDate();
  const eYear = e.getUTCFullYear();

  if (s.toISOString().split('T')[0] === e.toISOString().split('T')[0]) {
    return `${eMonth} ${eDay}, ${eYear}`;
  }

  if (sYear === eYear) {
    if (sMonth === eMonth) {
      return `${sMonth} ${sDay} – ${eDay}, ${sYear}`;
    }
    return `${sMonth} ${sDay} – ${eMonth} ${eDay}, ${sYear}`;
  }
  return `${sMonth} ${sDay}, ${sYear} – ${eMonth} ${eDay}, ${sYear}`;
}

/**
 * Deterministic PRNG based on Mulberry32 for consistent day-to-day distribution
 */
export function getDeterministicRandom(str, salt = 0) {
  let h = 0x811c9dc5 ^ salt;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let t = h ^ (h >>> 15);
  t = Math.imul(t, 0x85ebca6b);
  t ^= t >>> 13;
  t = Math.imul(t, 0xc2b2ae35);
  t ^= t >>> 16;
  return (t >>> 0) / 4294967296;
}

/**
 * Interpolate curve through user-sculpted node control points with hardness scaling
 */
export function interpolateCurve(nodes, progress, hardness = 1.0) {
  if (!nodes || nodes.length === 0) return 1.0;
  if (nodes.length === 1) return Number(nodes[0]) || 1.0;
  const n = nodes.length - 1;
  const pos = Math.max(0, Math.min(n, progress * n));
  const idx = Math.min(n - 1, Math.floor(pos));
  const frac = pos - idx;
  const t = (1 - Math.cos(frac * Math.PI)) / 2;
  const raw = Number(nodes[idx]) * (1 - t) + Number(nodes[idx + 1]) * t;
  const h = Number(hardness) || 1.0;
  return Math.pow(Math.max(0.02, raw), h);
}

/**
 * Generate 365 daily time series data points leading up to today.
 */
export function generateDailyTimeSeries(daysCount = 365, anchorDate = '2026-08-16', videosList = null, graphConfig = {}) {
  const cleanAnchor = anchorDate ? anchorDate.split('T')[0] : '2026-08-16';
  const today = new Date(`${cleanAnchor}T00:00:00Z`);
  const dailyData = [];

  const videoList = (videosList && videosList.length > 0) ? videosList : PROCESSED_VIDEOS;
  const cfg = graphConfig?.channel || graphConfig || {};
  const spikiness = cfg.spikiness !== undefined ? Number(cfg.spikiness) : (cfg.channelSpikiness !== undefined ? Number(cfg.channelSpikiness) : 1.0);
  const algoFreq = cfg.algoFrequency !== undefined ? Number(cfg.algoFrequency) : (cfg.algorithmFrequency !== undefined ? Number(cfg.algorithmFrequency) : 1.0);
  const uploadSurge = cfg.uploadSurge !== undefined ? Number(cfg.uploadSurge) : 1.0;
  const hardness = cfg.hardness !== undefined ? Number(cfg.hardness) : 1.4;
  const userNodes = (cfg.nodes && Array.isArray(cfg.nodes) && cfg.nodes.length >= 2)
    ? cfg.nodes
    : [1.0, 3.5, 0.9, 4.8, 1.1, 3.6, 1.2];

  // Build a map of upload dates and their relative weights
  const uploadDates = new Map();
  videoList.forEach(v => {
    const pDate = v.publishDate || v.date;
    if (pDate) {
      uploadDates.set(pDate, (uploadDates.get(pDate) || 0) + 1.0);
    }
  });

  let cumulativeSubs = 280000;

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getUTCDay(); // 0 = Sun, 6 = Sat

    // Weekend multiplier (subtle +6% lift on weekends)
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendMultiplier = isWeekend ? 1.06 : 1.0;

    // Progress along time series: 0.0 at oldest date, 1.0 at today
    const progress = 1.0 - (i / (daysCount - 1 || 1));
    const userCurveVal = interpolateCurve(userNodes, progress, hardness);

    // Calculate upload spikes and realistic exponential decay trailing off
    let uploadMultiplier = 0.0;
    uploadDates.forEach((weight, uDate) => {
      const uTime = new Date(`${uDate}T00:00:00Z`).getTime();
      const cTime = d.getTime();
      const diffDays = Math.round((cTime - uTime) / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        uploadMultiplier += 3.6 * weight * uploadSurge;
      } else if (diffDays === 1) {
        uploadMultiplier += 5.1 * weight * uploadSurge;
      } else if (diffDays === 2) {
        uploadMultiplier += 2.6 * weight * uploadSurge;
      } else if (diffDays === 3) {
        uploadMultiplier += 1.7 * weight * uploadSurge;
      } else if (diffDays === 4) {
        uploadMultiplier += 1.2 * weight * uploadSurge;
      } else if (diffDays === 5) {
        uploadMultiplier += 0.9 * weight * uploadSurge;
      } else if (diffDays === 6) {
        uploadMultiplier += 0.7 * weight * uploadSurge;
      } else if (diffDays === 7) {
        uploadMultiplier += 0.5 * weight * uploadSurge;
      } else if (diffDays > 7 && diffDays <= 14) {
        uploadMultiplier += 0.35 * weight * Math.exp(-(diffDays - 7) * 0.4) * uploadSurge;
      }
    });

    // Natural sudden random spikes & jitter per date using uniform deterministic hash
    const pseudoRand1 = getDeterministicRandom(dateStr, 101);
    const pseudoRand2 = getDeterministicRandom(dateStr, 202);
    const pseudoRand3 = getDeterministicRandom(dateStr, 303);

    // Sudden dramatic random spikes (viral search & algorithm pushes)
    let spikeBoost = 0.0;
    const t1 = Math.max(0.60, 0.84 - (algoFreq - 1.0) * 0.08);
    const t2 = Math.max(0.40, 0.64 - (algoFreq - 1.0) * 0.08);
    const t3 = Math.max(0.20, 0.38 - (algoFreq - 1.0) * 0.08);

    if (pseudoRand1 > t1) {
      spikeBoost = (2.6 + pseudoRand2 * 2.4) * algoFreq; // Major sudden spike
    } else if (pseudoRand1 > t2) {
      spikeBoost = (1.2 + pseudoRand2 * 1.4) * algoFreq; // Moderate sudden spike
    } else if (pseudoRand1 > t3) {
      spikeBoost = (0.35 + pseudoRand2 * 0.45) * algoFreq; // Subtle organic lift
    }

    const jitterSpread = Math.min(1.4, 0.70 * spikiness);
    const dailyJitter = Math.max(0.25, (1.0 - jitterSpread / 2) + pseudoRand3 * jitterSpread);

    const baseDailyViews = Math.round(18000 * userCurveVal * (1.0 + uploadMultiplier + spikeBoost) * weekendMultiplier * dailyJitter);
    const ctr = parseFloat((7.8 + 0.3 * Math.sin(i * 1.3 + 0.7)).toFixed(1));
    const impressions = Math.round(baseDailyViews / (ctr / 100));

    const avgDurationSecs = Math.round(240 + 10 * Math.cos(i * 0.9 + 0.3));
    const watchTimeHrs = parseFloat((baseDailyViews * (avgDurationSecs / 3600)).toFixed(1));

    // Daily RPM around $33.64 average
    const rpm = parseFloat((33.64 + 0.5 * Math.sin(i * 1.1 + 1.2)).toFixed(2));
    const cpm = parseFloat((rpm * 1.72).toFixed(2));
    const revenue = parseFloat(((baseDailyViews / 1000) * rpm).toFixed(2));

    const subsGained = Math.round(baseDailyViews * 0.012);
    const subsLost = Math.round(subsGained * 0.12);
    cumulativeSubs += (subsGained - subsLost);

    const likes = Math.round(baseDailyViews * 0.044);
    const comments = Math.round(baseDailyViews * 0.0032);

    dailyData.push({
      date: dateStr,
      day: `Day ${daysCount - i}`,
      views: baseDailyViews,
      impressions,
      ctr,
      watchTimeHrs,
      avgViewDurationSecs: avgDurationSecs,
      avgViewDuration: `${Math.floor(avgDurationSecs / 60)}:${(avgDurationSecs % 60).toString().padStart(2, '0')}`,
      rpm,
      cpm,
      revenue,
      subscribersGained: subsGained,
      subscribersLost: subsLost,
      subscribersNet: subsGained - subsLost,
      cumulativeSubscribers: cumulativeSubs,
      likes,
      comments
    });
  }

  return dailyData;
}

export const DAILY_SERIES = generateDailyTimeSeries(365, '2026-08-16');

/**
 * Filter daily metrics based on date range boundaries
 */
export function filterDailyMetricsByRange(dailySeries, startDateStr, endDateStr) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  end.setHours(23, 59, 59, 999);

  return dailySeries.filter(item => {
    const itemDate = new Date(item.date);
    return itemDate >= start && itemDate <= end;
  });
}

/**
 * Calculate aggregated summary statistics for a filtered daily subset
 */
export function aggregateMetrics(filteredDaily, _videoId = null) {
  if (!filteredDaily || filteredDaily.length === 0) {
    return {
      views: 0,
      viewsFormatted: '0',
      watchTimeHrs: 0,
      watchTimeHrsFormatted: '0',
      impressions: 0,
      impressionsFormatted: '0',
      ctr: 0,
      revenue: 0,
      revenueFormatted: '₹0.00',
      subscribersGained: 0,
      subscribersLost: 0,
      subscribersNet: 0,
      subscribersNetFormatted: '+0',
      rpm: 0,
      cpm: 0,
      likes: 0,
      comments: 0
    };
  }

  const views = filteredDaily.reduce((s, d) => s + d.views, 0);
  const watchTimeHrs = filteredDaily.reduce((s, d) => s + d.watchTimeHrs, 0);
  const impressions = filteredDaily.reduce((s, d) => s + d.impressions, 0);
  const revenue = filteredDaily.reduce((s, d) => s + d.revenue, 0);
  const subscribersGained = filteredDaily.reduce((s, d) => s + d.subscribersGained, 0);
  const subscribersLost = filteredDaily.reduce((s, d) => s + d.subscribersLost, 0);
  const subscribersNet = subscribersGained - subscribersLost;
  const likes = filteredDaily.reduce((s, d) => s + d.likes, 0);
  const comments = filteredDaily.reduce((s, d) => s + d.comments, 0);

  const avgCtr = impressions > 0 ? parseFloat(((views / impressions) * 100).toFixed(1)) : 0;
  const avgRpm = views > 0 ? parseFloat(((revenue / (views / 1000))).toFixed(2)) : 0;
  const avgCpm = parseFloat((avgRpm * 1.72).toFixed(2));

  const formatCompact = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toLocaleString();
  };

  return {
    views,
    viewsFormatted: formatCompact(views),
    watchTimeHrs: parseFloat(watchTimeHrs.toFixed(1)),
    watchTimeHrsFormatted: `${formatCompact(Math.round(watchTimeHrs))}`,
    impressions,
    impressionsFormatted: formatCompact(impressions),
    ctr: avgCtr,
    revenue: parseFloat(revenue.toFixed(2)),
    revenueFormatted: `₹${revenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    subscribersGained,
    subscribersLost,
    subscribersNet,
    subscribersNetFormatted: subscribersNet >= 0 ? `+${formatCompact(subscribersNet)}` : `-${formatCompact(Math.abs(subscribersNet))}`,
    rpm: avgRpm,
    cpm: avgCpm,
    likes,
    comments
  };
}

/**
 * Traffic sources breakdown where percentages sum to 100%
 */
export function getTrafficSources(totalViews) {
  const breakdown = [
    { source: 'Browse Features', percentage: 42.5 },
    { source: 'Suggested Videos', percentage: 28.3 },
    { source: 'YouTube Search', percentage: 14.2 },
    { source: 'External', percentage: 6.4 },
    { source: 'Notifications', percentage: 4.1 },
    { source: 'Playlists', percentage: 2.5 },
    { source: 'Channel Pages', percentage: 1.2 },
    { source: 'Shorts Feed', percentage: 0.8 }
  ];

  return breakdown.map(item => ({
    ...item,
    views: Math.round(totalViews * (item.percentage / 100))
  }));
}

/**
 * Audience Geographies, Age/Gender, Subtitles & Online Heatmap
 */
export function getAudienceBreakdown(totalViews) {
  const geographies = [
    { country: 'United States', percentage: 38.5, rpm: 48.20, views: Math.round(totalViews * 0.385) },
    { country: 'Canada', percentage: 11.2, rpm: 42.50, views: Math.round(totalViews * 0.112) },
    { country: 'United Kingdom', percentage: 9.8, rpm: 39.80, views: Math.round(totalViews * 0.098) },
    { country: 'Germany', percentage: 8.4, rpm: 38.10, views: Math.round(totalViews * 0.084) },
    { country: 'Australia', percentage: 6.5, rpm: 41.00, views: Math.round(totalViews * 0.065) },
    { country: 'India', percentage: 14.2, rpm: 4.20, views: Math.round(totalViews * 0.142) },
    { country: 'Philippines', percentage: 4.8, rpm: 5.10, views: Math.round(totalViews * 0.048) },
    { country: 'Brazil', percentage: 4.0, rpm: 6.50, views: Math.round(totalViews * 0.040) }
  ];

  const ageGender = [
    { group: '18–24 years', percentage: 22.4, male: 74, female: 26 },
    { group: '25–34 years', percentage: 48.6, male: 76, female: 24 },
    { group: '35–44 years', percentage: 18.2, male: 72, female: 28 },
    { group: '45–54 years', percentage: 7.1, male: 70, female: 30 },
    { group: '55+ years', percentage: 3.7, male: 68, female: 32 }
  ];

  const subtitleLanguages = [
    { language: 'English (Original)', percentage: 76.5 },
    { language: 'Spanish', percentage: 8.2 },
    { language: 'Hindi', percentage: 6.4 },
    { language: 'German', percentage: 4.1 },
    { language: 'No subtitles/CC', percentage: 4.8 }
  ];

  const viewerWatchBehavior = [
    { type: 'Returning viewers', percentage: 34.2, description: 'Viewers who watched your channel before and returned' },
    { type: 'New viewers', percentage: 65.8, description: 'Viewers who watched your channel for the first time' }
  ];

  // 7 days x 24 hours heatmap data for "When your viewers are on YouTube"
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const viewerHeatmap = days.map((day, dayIndex) => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      let intensity = 0; // 0 = very few, 3 = many
      if (h >= 14 && h <= 22) intensity = ((h + (dayIndex * 3)) % 3) + 1;
      else if (h >= 9 && h <= 13) intensity = 1;
      hours.push({ hour: h, intensity });
    }
    return { day, hours };
  });

  return {
    geographies,
    ageGender,
    subtitleLanguages,
    viewerWatchBehavior,
    viewerHeatmap
  };
}

/**
 * Realtime continuous data generator (Last 60 minutes & Last 48 hours)
 */
export function generateRealtimeDataset(anchorDate = '2026-08-16') {
  const last60Minutes = [];
  const now = new Date(anchorDate.includes('T') ? anchorDate : `${anchorDate}T12:00:00Z`);

  for (let i = 59; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60 * 1000);
    const timeStr = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
    const baseViews = Math.round(35 + Math.sin(i / 10) * 12 + ((i * 7) % 15));
    last60Minutes.push({ minute: timeStr, views: baseViews });
  }

  const last48Hours = [];
  for (let i = 47; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 3600 * 1000);
    const label = `${d.getUTCHours()}:00`;
    const hourViews = Math.round(1850 + Math.sin(i / 4) * 600 + ((i * 37) % 250));
    last48Hours.push({ hour: label, views: hourViews });
  }

  return {
    last60Minutes,
    last48Hours,
    total60MinViews: last60Minutes.reduce((s, m) => s + m.views, 0),
    total48HourViews: last48Hours.reduce((s, h) => s + h.views, 0)
  };
}

/**
 * Ticker function to update realtime dataset with continuous natural micro-fluctuations
 */
export function tickRealtimeData(currentRealtime) {
  if (!currentRealtime || !currentRealtime.last60Minutes) {
    return generateRealtimeDataset();
  }

  const new60 = [...currentRealtime.last60Minutes];
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Natural fluctuation on latest minute
  const lastItem = new60[new60.length - 1];
  const delta = ((now.getSeconds() % 7) - 3);
  const updatedViews = Math.max(12, lastItem.views + delta);

  if (lastItem.minute === timeStr) {
    new60[new60.length - 1] = { ...lastItem, views: updatedViews };
  } else {
    new60.shift();
    new60.push({ minute: timeStr, views: Math.round(30 + ((now.getMinutes() * 7) % 20)) });
  }

  const new48 = [...currentRealtime.last48Hours];
  const lastHourItem = new48[new48.length - 1];
  new48[new48.length - 1] = { ...lastHourItem, views: lastHourItem.views + Math.max(0, delta) };

  return {
    last60Minutes: new60,
    last48Hours: new48,
    total60MinViews: new60.reduce((s, m) => s + m.views, 0),
    total48HourViews: new48.reduce((s, h) => s + h.views, 0)
  };
}
