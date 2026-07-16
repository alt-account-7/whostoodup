import { describe, it, expect } from 'vitest';

// Inline the search matching logic (mirrors main.js implementation)
function matchesSearch(entry, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  return entry.name.toLowerCase().includes(q) || (entry.quote ?? '').toLowerCase().includes(q);
}

const entries = [
  { name: 'Swara Bhasker', quote: 'I stand in solidarity with Sonam Wangchuk.' },
  { name: 'Dharmendra Pradhan', quote: 'They are the B-team of disruptive elements.' },
  { name: 'Naseeruddin Shah', quote: 'We urge the government to listen.' },
  { name: 'Visited only', quote: undefined },
];

describe('search filter', () => {
  it('returns all entries for empty query', () => {
    expect(entries.filter(e => matchesSearch(e, ''))).toHaveLength(4);
  });

  it('matches by name (case-insensitive)', () => {
    const results = entries.filter(e => matchesSearch(e, 'swara'));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Swara Bhasker');
  });

  it('matches by quote text', () => {
    const results = entries.filter(e => matchesSearch(e, 'solidarity'));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Swara Bhasker');
  });

  it('is case-insensitive', () => {
    expect(entries.filter(e => matchesSearch(e, 'PRADHAN'))).toHaveLength(1);
  });

  it('matches partial strings', () => {
    expect(entries.filter(e => matchesSearch(e, 'Shah'))).toHaveLength(1);
  });

  it('handles entries without a quote', () => {
    const results = entries.filter(e => matchesSearch(e, 'visited'));
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Visited only');
  });

  it('returns empty for no match', () => {
    expect(entries.filter(e => matchesSearch(e, 'zzznomatch'))).toHaveLength(0);
  });
});
