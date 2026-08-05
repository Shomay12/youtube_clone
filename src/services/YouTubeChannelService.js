import { apiCache } from './YouTubeCacheService';

export class YouTubeChannelService {
  static async getChannelInfo(forceRefresh = false) {
    const cacheKey = 'youtube_channel_info';
    if (!forceRefresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }

    const res = await fetch('/api/youtube/channel');
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Failed to fetch channel info");
    }

    const data = await res.json();
    apiCache.set(cacheKey, data.channelInfo);
    return data.channelInfo;
  }
}
