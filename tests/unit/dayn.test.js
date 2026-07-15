import { describe, it, expect } from 'vitest';

// Inline the Day N logic so we can test it in isolation without a DOM.
function dayN(strikeStartDate, nowMs) {
  const start = new Date(strikeStartDate + 'T00:00:00+05:30');
  const diffDays = Math.floor((nowMs - start.getTime()) / 86400000);
  return Math.max(1, diffDays + 1);
}

describe('dayN', () => {
  const START = '2026-07-13';
  // 2026-07-13T00:00:00+05:30 = 2026-07-12T18:30:00Z
  const startUtcMs = new Date('2026-07-12T18:30:00Z').getTime();

  it('is Day 1 at the start time itself', () => {
    expect(dayN(START, startUtcMs)).toBe(1);
  });

  it('is Day 1 one second before midnight on day 1 IST', () => {
    // End of day 1 IST = 2026-07-13T18:29:59Z
    const endOfDay1 = new Date('2026-07-13T18:29:59Z').getTime();
    expect(dayN(START, endOfDay1)).toBe(1);
  });

  it('is Day 2 at midnight on day 2 IST', () => {
    // 2026-07-14T00:00:00+05:30 = 2026-07-13T18:30:00Z
    const day2 = new Date('2026-07-13T18:30:00Z').getTime();
    expect(dayN(START, day2)).toBe(2);
  });

  it('is Day 3 on 2026-07-15', () => {
    const day3 = new Date('2026-07-14T18:30:00Z').getTime();
    expect(dayN(START, day3)).toBe(3);
  });

  it('never returns less than 1 (before strike start)', () => {
    const before = startUtcMs - 86400000;
    expect(dayN(START, before)).toBe(1);
  });

  it('calculates Day 10 correctly', () => {
    const day10 = startUtcMs + 9 * 86400000;
    expect(dayN(START, day10)).toBe(10);
  });

  it('is not affected by DST (IST has none)', () => {
    // IST is a fixed UTC+5:30 with no DST; any two consecutive midnights are exactly 86400s apart
    const day7 = startUtcMs + 6 * 86400000;
    expect(dayN(START, day7)).toBe(7);
  });
});
