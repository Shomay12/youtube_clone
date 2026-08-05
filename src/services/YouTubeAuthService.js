import { apiCache } from './YouTubeCacheService';

export class YouTubeAuthService {
  /**
   * Initiates Google OAuth Flow by requesting backend consent URL
   */
  static async initiateOAuth() {
    try {
      const res = await fetch('/api/auth/url');
      if (!res.ok) throw new Error("Failed to generate auth URL");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("YouTubeAuthService Error:", err);
      throw err;
    }
  }

  /**
   * Checks backend authentication status
   */
  static async checkAuthStatus() {
    try {
      const res = await fetch('/api/auth/status');
      if (!res.ok) return { isConnected: false };
      return await res.json();
    } catch (err) {
      console.error("YouTubeAuthService checkAuthStatus error:", err);
      return { isConnected: false };
    }
  }

  /**
   * Disconnects YouTube channel (clears server tokens and local cache)
   */
  static async logout() {
    try {
      apiCache.clear();
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("YouTubeAuthService logout error:", err);
    }
  }
}
