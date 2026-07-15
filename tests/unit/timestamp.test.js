import { describe, it, expect } from 'vitest';
import { parseIstTimestamp } from '../../scripts/validate-entry.js';

describe('parseIstTimestamp', () => {
  it('parses a known IST time to correct UTC', () => {
    // 2026-07-14 12:00 IST = 2026-07-14 06:30 UTC
    const d = parseIstTimestamp('2026-07-14 12:00');
    expect(d).toBeInstanceOf(Date);
    expect(d.toISOString()).toBe('2026-07-14T06:30:00.000Z');
  });

  it('handles midnight IST correctly', () => {
    // 2026-07-14 00:00 IST = 2026-07-13 18:30 UTC
    const d = parseIstTimestamp('2026-07-14 00:00');
    expect(d.toISOString()).toBe('2026-07-13T18:30:00.000Z');
  });

  it('handles 23:30 IST correctly', () => {
    // 2026-07-14 23:30 IST = 2026-07-14 18:00 UTC
    const d = parseIstTimestamp('2026-07-14 23:30');
    expect(d.toISOString()).toBe('2026-07-14T18:00:00.000Z');
  });

  it('returns null for malformed input', () => {
    expect(parseIstTimestamp('14-07-2026 12:00')).toBeNull();
    expect(parseIstTimestamp('2026-07-14')).toBeNull();
    expect(parseIstTimestamp('')).toBeNull();
    expect(parseIstTimestamp(null)).toBeNull();
    expect(parseIstTimestamp('2026-07-14 25:00')).toBeNull(); // invalid hour
    expect(parseIstTimestamp('2026-13-01 12:00')).toBeNull(); // invalid month
  });

  it('handles year boundary: 2026-01-01 00:00 IST', () => {
    // 2026-01-01 00:00 IST = 2025-12-31 18:30 UTC
    const d = parseIstTimestamp('2026-01-01 00:00');
    expect(d.toISOString()).toBe('2025-12-31T18:30:00.000Z');
  });
});
