import { apiCache } from './YouTubeCacheService';

export class PlaylistService {
  static async getPlaylists(forceRefresh = false) {
    const cacheKey = 'youtube_playlists';
    if (!forceRefresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }

    const res = await fetch('/api/youtube/playlists');
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Failed to fetch playlists");
    }

    const data = await res.json();
    apiCache.set(cacheKey, data.playlists);
    return data.playlists;
  }
}
