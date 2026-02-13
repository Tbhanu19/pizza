
export function parseApiDate(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value;
    return new Date(ms);
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s) && !s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
      return new Date(s + 'Z');
    }
    return new Date(s);
  }
  return new Date(value);
}


export function formatDateTime(value) {
  const d = typeof value === 'string' || typeof value === 'number' ? parseApiDate(value) : value;
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
