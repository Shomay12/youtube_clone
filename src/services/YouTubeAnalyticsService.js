import { apiCache } from './YouTubeCacheService';

export class YouTubeAnalyticsService {
  static async getAnalytics(forceRefresh = false) {
    const cacheKey = 'youtube_analytics';
    if (!forceRefresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }

    const res = await fetch('/api/youtube/analytics');
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Failed to fetch analytics");
    }

    const data = await res.json();
    apiCache.set(cacheKey, data.analyticsData);
    return data.analyticsData;
  }
}
