export function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(String(value).replace(/[,$₹$€£]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function parseBool(value) {
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1';
}

export function formatCompactNumber(num) {
  const n = parseNumber(num);
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return n.toLocaleString();
}

export function formatCurrency(amount) {
  const n = parseNumber(amount);
  const sym = '$';
  if (n >= 1e6) return `${sym}${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${sym}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${sym}${n.toFixed(2)}`;
}

export function normalizeHeader(str) {
  return String(str || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

export function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h] = row[i] !== undefined ? row[i] : '';
  });
  return obj;
}

export function parseKeyValueSheet(rows, keyCol, valueCol) {
  const result = {};
  for (const row of rows) {
    const key = String(row[keyCol] ?? '').trim();
    const value = row[valueCol];
    if (key) result[key] = value;
  }
  return result;
}
