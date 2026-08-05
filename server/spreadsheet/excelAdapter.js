import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import chokidar from 'chokidar';

export class ExcelAdapter {
  constructor(filePath, onChange) {
    this.filePath = path.resolve(filePath);
    this.onChange = onChange;
    this.watcher = null;
    this.lastModified = null;
  }

  resolvePath() {
    return this.filePath;
  }

  exists() {
    return fs.existsSync(this.filePath);
  }

  getLastModified() {
    if (!this.exists()) return null;
    return fs.statSync(this.filePath).mtime.toISOString();
  }

  readRawSheets() {
    if (!this.exists()) {
      throw new Error(`Excel file not found: ${this.filePath}`);
    }

    const workbook = XLSX.readFile(this.filePath, { cellDates: true });
    console.info('[Spreadsheet] Workbook Loaded:', this.filePath);
    const rawSheets = {};

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      rawSheets[sheetName] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }

    console.info('[Spreadsheet] Workbook Parsed:', workbook.SheetNames);

    this.lastModified = this.getLastModified();
    return rawSheets;
  }

  startWatching() {
    if (this.watcher) return;

    const dir = path.dirname(this.filePath);
    const file = path.basename(this.filePath);

    this.watcher = chokidar.watch(path.join(dir, file), {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 }
    });

    const handleChange = () => {
      const modified = this.getLastModified();
      if (modified && modified !== this.lastModified) {
        this.onChange?.({ type: 'excel-changed', path: this.filePath, modified });
      }
    };

    this.watcher.on('change', handleChange);
    this.watcher.on('add', handleChange);
  }

  stopWatching() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  updatePath(newPath) {
    this.stopWatching();
    this.filePath = path.resolve(newPath);
  }
}
