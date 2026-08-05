import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:5172/api/auth/callback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const TOKENS_FILE = path.join(__dirname, 'tokens.json');

function saveTokens(tokens) {
  try {
    let existing = {};
    if (fs.existsSync(TOKENS_FILE)) {
      existing = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
    const updated = {
      ...existing,
      ...tokens,
      refresh_token: tokens.refresh_token || existing.refresh_token
    };
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (err) {
    console.error("Error saving tokens:", err);
  }
}

function loadTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      return JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error("Error loading tokens:", err);
  }
  return null;
}

async function getAuthenticatedClient() {
  const tokens = loadTokens();
  if (!tokens || (!tokens.refresh_token && !tokens.access_token)) {
    throw new Error("NOT_AUTHENTICATED");
  }
  oauth2Client.setCredentials(tokens);

  // Handle token refresh if expired or about to expire
  oauth2Client.on('tokens', (newTokens) => {
    saveTokens(newTokens);
  });

  return oauth2Client;
}

// Format helpers
function formatCompactNumber(num) {
  if (!num || isNaN(num)) return "0";
  const n = Number(num);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

function parseISO8601Duration(durationStr) {
  if (!durationStr) return "00:00";
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "00:00";
  const hours = parseInt(match[1] || 0, 10);
  const minutes = parseInt(match[2] || 0, 10);
  const seconds = parseInt(match[3] || 0, 10);

  const secFormatted = seconds < 10 ? `0${seconds}` : `${seconds}`;
  if (hours > 0) {
    const minFormatted = minutes < 10 ? `0${minutes}` : `${minutes}`;
    return `${hours}:${minFormatted}:${secFormatted}`;
  }
  return `${minutes}:${secFormatted}`;
}

// --- Endpoints ---

// 1. Get OAuth Consent URL
app.get('/api/auth/url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });

  res.json({ url });
});

// 2. OAuth Callback
app.get('/api/auth/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send("No authorization code found.");
  }
  try {
    const { tokens } = await oauth2Client.getToken(code);
    saveTokens(tokens);
    // Redirect back to main frontend UI
    res.redirect('/?oauth=success');
  } catch (err) {
    console.error("Error exchanging OAuth code:", err);
    res.redirect('/?oauth=error');
  }
});

// 3. Auth Status
app.get('/api/auth/status', (req, res) => {
  const tokens = loadTokens();
  const isConnected = !!(tokens && (tokens.refresh_token || tokens.access_token));
  res.json({ isConnected });
});

// 4. Logout / Disconnect
app.post('/api/auth/logout', (req, res) => {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      fs.unlinkSync(TOKENS_FILE);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Fetch YouTube Channel Data
app.get('/api/youtube/channel', async (req, res) => {
  try {
    const auth = await getAuthenticatedClient();
    const youtube = google.youtube({ version: 'v3', auth });

    const channelRes = await youtube.channels.list({
      mine: true,
      part: ['snippet', 'contentDetails', 'statistics', 'brandingSettings']
    });

    if (!channelRes.data.items || channelRes.data.items.length === 0) {
      return res.status(404).json({ error: 'No channel found' });
    }

    const item = channelRes.data.items[0];
    const snippet = item.snippet || {};
    const stats = item.statistics || {};
    const branding = item.brandingSettings || {};

    const channelInfo = {
      id: item.id,
      name: snippet.title || 'My Channel',
      handle: snippet.customUrl ? (snippet.customUrl.startsWith('@') ? snippet.customUrl : `@${snippet.customUrl}`) : '@mychannel',
      subscribers: parseInt(stats.subscriberCount || 0, 10),
      subscribersFormatted: formatCompactNumber(stats.subscriberCount),
      lifetimeViews: parseInt(stats.viewCount || 0, 10),
      lifetimeViewsFormatted: formatCompactNumber(stats.viewCount),
      totalUploads: parseInt(stats.videoCount || 0, 10),
      avatar: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      banner: branding.image?.bannerExternalUrl || '',
      description: snippet.description || '',
      country: snippet.country || 'United States',
      joinedDate: snippet.publishedAt ? new Date(snippet.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown',
      uploadsPlaylistId: item.contentDetails?.relatedPlaylists?.uploads || null
    };

    res.json({ channelInfo });
  } catch (err) {
    console.error("Error fetching channel:", err.message);
    res.status(err.message === 'NOT_AUTHENTICATED' ? 401 : 500).json({ error: err.message });
  }
});

// 6. Fetch YouTube Videos
app.get('/api/youtube/videos', async (req, res) => {
  try {
    const auth = await getAuthenticatedClient();
    const youtube = google.youtube({ version: 'v3', auth });

    // 1. Get channel uploads playlist ID
    const channelRes = await youtube.channels.list({
      mine: true,
      part: ['contentDetails']
    });

    const uploadsId = channelRes.data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!uploadsId) {
      return res.json({ videos: [] });
    }

    // 2. Fetch playlist items (up to 50)
    const playlistRes = await youtube.playlistItems.list({
      playlistId: uploadsId,
      part: ['snippet', 'contentDetails'],
      maxResults: 50
    });

    const videoIds = playlistRes.data.items.map(item => item.contentDetails.videoId).filter(Boolean);

    if (videoIds.length === 0) {
      return res.json({ videos: [] });
    }

    // 3. Fetch detailed video stats, duration, status
    const videosRes = await youtube.videos.list({
      id: videoIds,
      part: ['snippet', 'contentDetails', 'statistics', 'status']
    });

    const videos = videosRes.data.items.map(item => {
      const snip = item.snippet || {};
      const stat = item.statistics || {};
      const content = item.contentDetails || {};
      const status = item.status || {};

      return {
        id: item.id,
        title: snip.title || '',
        description: snip.description || '',
        thumbnail: snip.thumbnails?.maxres?.url || snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || '',
        visibility: status.privacyStatus ? status.privacyStatus.charAt(0).toUpperCase() + status.privacyStatus.slice(1) : 'Public',
        restrictions: status.madeForKids ? 'Made for Kids' : 'None',
        date: snip.publishedAt ? snip.publishedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        views: parseInt(stat.viewCount || 0, 10),
        viewsFormatted: formatCompactNumber(stat.viewCount),
        comments: parseInt(stat.commentCount || 0, 10),
        likes: parseInt(stat.likeCount || 0, 10),
        duration: parseISO8601Duration(content.duration),
        type: 'video',
        playlist: 'Uploads',
        audience: status.madeForKids ? 'Made for kids' : 'Not made for kids',
        monetization: true,
        tags: (snip.tags || []).join(', '),
        category: snip.categoryId || 'Science & Technology',
        language: snip.defaultLanguage || 'English',
        license: snip.license || 'Standard YouTube License',
        ageRestriction: 'No',
        paidPromotion: false
      };
    });

    res.json({ videos });
  } catch (err) {
    console.error("Error fetching videos:", err.message);
    res.status(err.message === 'NOT_AUTHENTICATED' ? 401 : 500).json({ error: err.message });
  }
});

// 7. Fetch YouTube Playlists
app.get('/api/youtube/playlists', async (req, res) => {
  try {
    const auth = await getAuthenticatedClient();
    const youtube = google.youtube({ version: 'v3', auth });

    const response = await youtube.playlists.list({
      mine: true,
      part: ['snippet', 'contentDetails', 'status'],
      maxResults: 50
    });

    const playlists = (response.data.items || []).map(p => ({
      id: p.id,
      title: p.snippet?.title || '',
      description: p.snippet?.description || '',
      videoCount: p.contentDetails?.itemCount || 0,
      visibility: p.status?.privacyStatus ? p.status.privacyStatus.charAt(0).toUpperCase() + p.status.privacyStatus.slice(1) : 'Public',
      lastUpdated: p.snippet?.publishedAt ? new Date(p.snippet.publishedAt).toLocaleDateString() : 'Recently',
      thumbnail: p.snippet?.thumbnails?.medium?.url || p.snippet?.thumbnails?.default?.url || ''
    }));

    res.json({ playlists });
  } catch (err) {
    console.error("Error fetching playlists:", err.message);
    res.status(err.message === 'NOT_AUTHENTICATED' ? 401 : 500).json({ error: err.message });
  }
});

// 8. Fetch Comments
app.get('/api/youtube/comments', async (req, res) => {
  try {
    const auth = await getAuthenticatedClient();
    const youtube = google.youtube({ version: 'v3', auth });

    const response = await youtube.commentThreads.list({
      allThreadsRelatedToChannelId: (await youtube.channels.list({ mine: true, part: ['id'] })).data.items?.[0]?.id,
      part: ['snippet', 'replies'],
      maxResults: 50
    });

    const comments = (response.data.items || []).map(ct => {
      const top = ct.snippet?.topLevelComment?.snippet || {};
      return {
        id: ct.id,
        author: top.authorDisplayName || 'Anonymous',
        authorAvatar: top.authorProfileImageUrl || '',
        text: top.textDisplay || '',
        time: top.publishedAt ? new Date(top.publishedAt).toLocaleDateString() : 'Recently',
        videoTitle: 'Channel Video',
        videoId: top.videoId || '',
        likes: top.likeCount || 0,
        userLiked: false,
        heart: false,
        status: 'Published',
        replies: (ct.replies?.comments || []).map(r => ({
          id: r.id,
          author: r.snippet?.authorDisplayName || '',
          authorAvatar: r.snippet?.authorProfileImageUrl || '',
          time: r.snippet?.publishedAt ? new Date(r.snippet.publishedAt).toLocaleDateString() : '',
          text: r.snippet?.textDisplay || ''
        }))
      };
    });

    res.json({ comments });
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    res.status(err.message === 'NOT_AUTHENTICATED' ? 401 : 500).json({ error: err.message });
  }
});

// 9. Fetch Analytics
app.get('/api/youtube/analytics', async (req, res) => {
  try {
    const auth = await getAuthenticatedClient();
    const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });
    const youtube = google.youtube({ version: 'v3', auth });

    const channelRes = await youtube.channels.list({ mine: true, part: ['id'] });
    const channelId = channelRes.data.items?.[0]?.id;

    if (!channelId) {
      return res.status(404).json({ error: 'No channel found' });
    }

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let analyticsData = [];
    try {
      const reportRes = await youtubeAnalytics.reports.query({
        ids: `channel==${channelId}`,
        startDate,
        endDate,
        metrics: 'views,estimatedMinutesWatched,subscribersGained',
        dimensions: 'day',
        sort: 'day'
      });

      if (reportRes.data.rows) {
        analyticsData = reportRes.data.rows.map(row => ({
          date: row[0],
          views: row[1],
          watchTime: (row[2] / 60).toFixed(1),
          subscribers: row[3]
        }));
      }
    } catch (anErr) {
      console.warn("YouTube Analytics API notice (falling back or empty):", anErr.message);
    }

    res.json({ analyticsData });
  } catch (err) {
    console.error("Error in analytics endpoint:", err.message);
    res.status(err.message === 'NOT_AUTHENTICATED' ? 401 : 500).json({ error: err.message });
  }
});

import { registerSpreadsheetRoutes } from './spreadsheetRoutes.js';
registerSpreadsheetRoutes(app);

app.listen(PORT, () => {
  console.log(`YouTube Auth & API Proxy Server running on http://localhost:${PORT}`);
});
