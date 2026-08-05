import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ExcelAdapter } from './excelAdapter.js';
import { GoogleSheetsAdapter } from './googleSheetsAdapter.js';
import { normalizeSpreadsheetData } from './normalize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CONFIG_FILE = path.join(__dirname, 'config.json');

function findLatestExcelFile() {
  if (process.env.EXCEL_PATH) {
    return path.isAbsolute(process.env.EXCEL_PATH)
      ? process.env.EXCEL_PATH
      : path.resolve(PROJECT_ROOT, process.env.EXCEL_PATH);
  }
  try {
    const files = fs.readdirSync(PROJECT_ROOT).filter(f => f.endsWith('.xlsx'));
    if (files.length > 0) {
      files.sort((a, b) => fs.statSync(path.join(PROJECT_ROOT, b)).mtimeMs - fs.statSync(path.join(PROJECT_ROOT, a)).mtimeMs);
      return path.join(PROJECT_ROOT, files[0]);
    }
  } catch (err) {
    /* ignore */
  }
  return path.join(PROJECT_ROOT, 'YouTube_Studio_CMS_Template_Ultra_Realistic.xlsx');
}

const DEFAULT_CONFIG = {
  source: process.env.DATA_SOURCE || 'excel',
  excelPath: findLatestExcelFile(),
  googleSheetsId: process.env.GOOGLE_SHEETS_ID || '',
  autoRefreshInterval: Number(process.env.AUTO_REFRESH_INTERVAL || 60),
  liveSync: process.env.LIVE_SYNC !== undefined ? (process.env.LIVE_SYNC === 'true') : true
};

class SpreadsheetService {
  constructor() {
    this.config = this.loadConfig();
    this.cache = null;
    this.lastRawSheets = null;
    this.lastLoadedAt = null;
    this.lastError = null;
    this.isLoading = false;
    this.listeners = new Set();
    this.excelAdapter = null;
    this.googleAdapter = null;
    this.initAdapters();
  }

  loadConfig() {
    try {
      if (fs.existsSync(CONFIG_FILE)) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
      }
    } catch (err) {
      console.warn('[Spreadsheet] Config load error:', err.message);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig(updates) {
    this.config = { ...this.config, ...updates };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf8');
    this.initAdapters();
  }

  initAdapters() {
    this.excelAdapter?.stopWatching();
    this.googleAdapter?.stopPolling();

    if (this.config.source === 'excel') {
      this.excelAdapter = new ExcelAdapter(this.config.excelPath, (event) => {
        this.handleExternalChange(event);
      });
      if (this.config.liveSync) {
        this.excelAdapter.startWatching();
      }
    } else if (this.config.source === 'google') {
      this.googleAdapter = new GoogleSheetsAdapter(this.config.googleSheetsId, (event) => {
        this.handleExternalChange(event);
      });
      if (this.config.liveSync) {
        this.googleAdapter.startPolling(10000);
      }
    }
  }

  async handleExternalChange(event) {
    console.log('[Spreadsheet] External change detected:', event.type);
    try {
      await this.load(true);
      this.broadcast({ type: 'data-updated', event, loadedAt: this.lastLoadedAt });
    } catch (err) {
      this.broadcast({ type: 'error', message: err.message });
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  broadcast(event) {
    for (const listener of this.listeners) {
      try { listener(event); } catch { /* ignore */ }
    }
  }

  async load(force = false) {
    if (this.isLoading && !force) return this.cache;
    this.isLoading = true;
    this.lastError = null;

    try {
      let rawSheets;

      if (this.config.source === 'google') {
        if (!this.googleAdapter) {
          this.googleAdapter = new GoogleSheetsAdapter(this.config.googleSheetsId, (e) => this.handleExternalChange(e));
        }
        rawSheets = await this.googleAdapter.readRawSheets();
      } else {
        if (!this.excelAdapter) {
          this.excelAdapter = new ExcelAdapter(this.config.excelPath, (e) => this.handleExternalChange(e));
        }
        rawSheets = this.excelAdapter.readRawSheets();
      }

      // Check which sheets actually changed
      const affectedSheets = [];
      if (this.lastRawSheets) {
        const allSheetNames = new Set([...Object.keys(rawSheets), ...Object.keys(this.lastRawSheets)]);
        for (const name of allSheetNames) {
          const newJSON = JSON.stringify(rawSheets[name] || null);
          const oldJSON = JSON.stringify(this.lastRawSheets[name] || null);
          if (newJSON !== oldJSON) {
            affectedSheets.push(name);
          }
        }
      } else {
        affectedSheets.push(...Object.keys(rawSheets));
      }

      this.lastRawSheets = rawSheets;

      // Only update cache and loaded time if there are affected sheets or cache is null
      if (affectedSheets.length > 0 || !this.cache) {
        console.log('[Spreadsheet] Affected sheets reloaded:', affectedSheets);
        this.cache = normalizeSpreadsheetData(rawSheets);
        this.lastLoadedAt = new Date().toISOString();
      }

      return this.cache;
    } catch (err) {
      this.lastError = err.message;
      throw err;
    } finally {
      this.isLoading = false;
    }
  }

  getStatus() {
    const excelPath = this.config.source === 'excel' ? this.excelAdapter?.resolvePath?.() : null;
    return {
      source: this.config.source,
      excelPath,
      googleSheetsId: this.config.googleSheetsId,
      autoRefreshInterval: this.config.autoRefreshInterval,
      liveSync: this.config.liveSync,
      lastLoadedAt: this.lastLoadedAt,
      lastError: this.lastError,
      isLoading: this.isLoading,
      fileExists: this.config.source === 'excel' ? this.excelAdapter?.exists?.() : true,
      lastModified: this.config.source === 'excel' ? this.excelAdapter?.getLastModified?.() : null
    };
  }

  getData() {
    if (!this.cache) throw new Error('Spreadsheet data not loaded yet');
    return this.cache;
  }
}

export const spreadsheetService = new SpreadsheetService();
