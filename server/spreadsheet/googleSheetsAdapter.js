import { google } from 'googleapis';

const EXPECTED_SHEETS = [
  'Channel', 'Videos', 'Daily Analytics', 'Analytics', 'Audience',
  'Traffic Sources', 'Comments', 'Subscribers', 'Playlists', 'Realtime', 'Settings', 'Revenue'
];

export class GoogleSheetsAdapter {
  constructor(spreadsheetId, onChange) {
    this.spreadsheetId = spreadsheetId;
    this.onChange = onChange;
    this.pollInterval = null;
    this.lastRevision = null;
  }

  getAuthClient() {
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (apiKey) return apiKey;

    const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH;
    if (serviceAccountPath) {
      const auth = new google.auth.GoogleAuth({
        keyFile: serviceAccountPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      return auth;
    }

    throw new Error(
      'Google Sheets requires GOOGLE_SHEETS_API_KEY (public sheet) or GOOGLE_SERVICE_ACCOUNT_PATH'
    );
  }

  async readRawSheets() {
    if (!this.spreadsheetId) {
      throw new Error('Google Sheets spreadsheet ID is not configured');
    }

    const auth = this.getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const meta = await sheets.spreadsheets.get({
      spreadsheetId: this.spreadsheetId,
      fields: 'properties,sheets.properties'
    });

    this.lastRevision = meta.data.properties?.revisionId || Date.now().toString();

    const sheetNames = meta.data.sheets?.map(s => s.properties.title) || EXPECTED_SHEETS;
    const rawSheets = {};

    for (const sheetName of sheetNames) {
      try {
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `'${sheetName.replace(/'/g, "''")}'`
        });

        const rows = res.data.values || [];
        if (rows.length < 2) {
          rawSheets[sheetName] = [];
          continue;
        }

        const headers = rows[0];
        rawSheets[sheetName] = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
          return obj;
        });
      } catch {
        rawSheets[sheetName] = [];
      }
    }

    return rawSheets;
  }

  startPolling(intervalMs = 10000) {
    this.stopPolling();
    this.pollInterval = setInterval(async () => {
      try {
        const auth = this.getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });
        const meta = await sheets.spreadsheets.get({
          spreadsheetId: this.spreadsheetId,
          fields: 'properties.revisionId'
        });
        const revision = meta.data.properties?.revisionId;
        if (revision && revision !== this.lastRevision) {
          this.lastRevision = revision;
          this.onChange?.({ type: 'google-sheets-changed', spreadsheetId: this.spreadsheetId });
        }
      } catch (err) {
        console.warn('[GoogleSheets] Poll error:', err.message);
      }
    }, intervalMs);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  updateSpreadsheetId(id) {
    this.spreadsheetId = id;
    this.lastRevision = null;
  }
}
