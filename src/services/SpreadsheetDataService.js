const API_BASE = '/api/spreadsheet';

export const SpreadsheetDataService = {
  async getStatus() {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch spreadsheet status');
    return res.json();
  },

  async getData(videoId = null) {
    const url = videoId ? `${API_BASE}/data?videoId=${encodeURIComponent(videoId)}` : `${API_BASE}/data`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch spreadsheet data');
    }
    return res.json();
  },

  async refresh() {
    const res = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to refresh spreadsheet');
    }
    return res.json();
  },

  async updateConfig(config) {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update spreadsheet config');
    }
    return res.json();
  },

  subscribeToEvents(onEvent) {
    const source = new EventSource(`${API_BASE}/events`);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(data);
      } catch {
        /* ignore parse errors */
      }
    };

    source.onerror = () => {
      onEvent({ type: 'connection-error' });
    };

    return () => source.close();
  }
};
