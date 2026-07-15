import { createHash } from 'crypto';

export const VALID_ROLES = ['celebrity', 'politician', 'influencer', 'journalist', 'other'];
export const VALID_STANCES = ['support', 'opposition', 'neutral'];

const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
const URL_RE = /^https?:\/\/.+/;

// Parse an IST timestamp string ("YYYY-MM-DD HH:MM") to a UTC Date.
export function parseIstTimestamp(ts) {
  if (!TIMESTAMP_RE.test(ts)) return null;
  const [datePart, timePart] = ts.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  // Explicit range checks — Date.UTC silently wraps out-of-range values.
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (hour < 0 || hour > 23) return null;
  if (minute < 0 || minute > 59) return null;

  // IST = UTC+5:30 → subtract 5h30m to get UTC
  const utcMs = Date.UTC(year, month - 1, day, hour - 5, minute - 30);
  const d = new Date(utcMs);
  return isNaN(d.getTime()) ? null : d;
}

export function validateEntry(entry) {
  const errors = [];

  if (!entry.name?.trim()) errors.push('name is required');
  if (!VALID_ROLES.includes(entry.role)) errors.push(`role must be one of: ${VALID_ROLES.join(', ')}`);
  if (!VALID_STANCES.includes(entry.stance)) errors.push(`stance must be one of: ${VALID_STANCES.join(', ')}`);
  if (entry.quote && entry.quote.trim().length < 10) errors.push('quote is too short — must be a verbatim statement');
  if (!URL_RE.test(entry.source_url ?? '')) errors.push('source_url must be a valid https:// URL');
  if (entry.wiki_url && !URL_RE.test(entry.wiki_url)) errors.push('wiki_url must be a valid https:// URL when provided');

  if (!TIMESTAMP_RE.test(entry.timestamp ?? '')) {
    errors.push('timestamp must be YYYY-MM-DD HH:MM (IST)');
  } else {
    const d = parseIstTimestamp(entry.timestamp);
    if (!d) {
      errors.push('timestamp is not a valid date/time');
    } else if (d > new Date()) {
      errors.push('timestamp is in the future');
    }
  }

  return errors;
}

// Stable hash for duplicate detection: name (normalized) + source_url.
export function duplicateHash(entry) {
  const key = `${String(entry.name ?? '').toLowerCase().trim()}::${entry.source_url ?? ''}`;
  return createHash('sha256').update(key).digest('hex').slice(0, 16);
}
