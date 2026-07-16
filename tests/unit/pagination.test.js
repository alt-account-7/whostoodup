import { describe, it, expect } from 'vitest';

const PAGE_SIZE = 25;

function paginate(entries, page) {
  return entries.slice(0, page * PAGE_SIZE);
}

function makeEntries(n) {
  return Array.from({ length: n }, (_, i) => ({
    name: `Person ${i + 1}`,
    role: 'celebrity',
    stance: 'support',
    quote: `Quote ${i + 1}`,
    timestamp: `2026-07-01 ${String(i % 24).padStart(2, '0')}:00`,
    source_url: `https://example.com/${i}`,
  }));
}

describe('pagination', () => {
  it('shows 25 entries on first page', () => {
    const entries = makeEntries(55);
    expect(paginate(entries, 1)).toHaveLength(25);
  });

  it('shows 50 entries on second page', () => {
    const entries = makeEntries(55);
    expect(paginate(entries, 2)).toHaveLength(50);
  });

  it('shows all entries when total is less than PAGE_SIZE', () => {
    const entries = makeEntries(10);
    expect(paginate(entries, 1)).toHaveLength(10);
  });

  it('shows all entries on last page', () => {
    const entries = makeEntries(55);
    expect(paginate(entries, 3)).toHaveLength(55);
  });

  it('filtering works across all entries before pagination', () => {
    const entries = makeEntries(55);
    // Mark only entries 30-54 as opposition
    entries.forEach((e, i) => { if (i >= 30) e.stance = 'opposition'; });
    const filtered = entries.filter(e => e.stance === 'opposition');
    expect(filtered).toHaveLength(25);
    // First page of filtered results shows all 25 (fits in one page)
    expect(paginate(filtered, 1)).toHaveLength(25);
  });

  it('search works across all entries before pagination', () => {
    const entries = makeEntries(55);
    // Only Person 1, Person 10, Person 11...Person 19, Person 21 contain "1"
    const searched = entries.filter(e => e.name.toLowerCase().includes('1'));
    // First page capped at 25
    const firstPage = paginate(searched, 1);
    expect(firstPage.length).toBeLessThanOrEqual(25);
    // All results contain "1" in name
    firstPage.forEach(e => expect(e.name).toMatch(/1/));
  });
});
