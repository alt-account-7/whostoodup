import { describe, it, expect } from 'vitest';

// Mirror of the relTime function from main.js for unit testing.
function relTime(timestamp, nowMs) {
  const [datePart, timePart] = timestamp.split(' ');
  const [y, m, d] = datePart.split('-').map(Number);
  const [h, min] = timePart.split(':').map(Number);
  const utcMs = Date.UTC(y, m - 1, d, h - 5, min - 30);
  const diffMs = nowMs - utcMs;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

// Reference: 2026-07-14 12:00 IST = 2026-07-14T06:30:00Z
const BASE_MS = new Date('2026-07-14T06:30:00Z').getTime();

describe('relTime', () => {
  it('returns "just now" for < 1 minute', () => {
    expect(relTime('2026-07-14 12:00', BASE_MS + 30000)).toBe('just now');
    expect(relTime('2026-07-14 12:00', BASE_MS + 59000)).toBe('just now');
  });

  it('returns "Xm ago" for minutes', () => {
    expect(relTime('2026-07-14 12:00', BASE_MS + 60000)).toBe('1m ago');
    expect(relTime('2026-07-14 12:00', BASE_MS + 5 * 60000)).toBe('5m ago');
    expect(relTime('2026-07-14 12:00', BASE_MS + 59 * 60000)).toBe('59m ago');
  });

  it('returns "Xh ago" for hours', () => {
    expect(relTime('2026-07-14 12:00', BASE_MS + 3600000)).toBe('1h ago');
    expect(relTime('2026-07-14 12:00', BASE_MS + 23 * 3600000)).toBe('23h ago');
  });

  it('returns "Xd ago" for days', () => {
    expect(relTime('2026-07-14 12:00', BASE_MS + 24 * 3600000)).toBe('1d ago');
    expect(relTime('2026-07-14 12:00', BASE_MS + 48 * 3600000)).toBe('2d ago');
  });

  it('handles boundary: exactly 60 minutes', () => {
    expect(relTime('2026-07-14 12:00', BASE_MS + 60 * 60000)).toBe('1h ago');
  });

  it('handles boundary: exactly 24 hours', () => {
    expect(relTime('2026-07-14 12:00', BASE_MS + 24 * 3600000)).toBe('1d ago');
  });
});
