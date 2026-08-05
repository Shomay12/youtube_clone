import { apiCache } from './YouTubeCacheService';

export class YouTubeVideoService {
  static async getVideos(forceRefresh = false) {
    const cacheKey = 'youtube_videos_list';
    if (!forceRefresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }

    const res = await fetch('/api/youtube/videos');
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Failed to fetch videos");
    }

    const data = await res.json();
    apiCache.set(cacheKey, data.videos);
    return data.videos;
  }
}
