import { apiCache } from './YouTubeCacheService';

export class CommentService {
  static async getComments(forceRefresh = false) {
    const cacheKey = 'youtube_comments';
    if (!forceRefresh) {
      const cached = apiCache.get(cacheKey);
      if (cached) return cached;
    }

    const res = await fetch('/api/youtube/comments');
    if (!res.ok) {
      if (res.status === 401) throw new Error("UNAUTHORIZED");
      throw new Error("Failed to fetch comments");
    }

    const data = await res.json();
    apiCache.set(cacheKey, data.comments);
    return data.comments;
  }
}
