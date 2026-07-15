import { describe, it, expect } from 'vitest';
import { validateEntry, VALID_ROLES, VALID_STANCES } from '../../scripts/validate-entry.js';

const validEntry = {
  name: 'Test Person',
  role: 'celebrity',
  wiki_url: 'https://en.wikipedia.org/wiki/Test',
  stance: 'support',
  quote: 'I fully support Sonam Wangchuk and his demands.',
  timestamp: '2026-07-14 10:30',
  source_url: 'https://twitter.com/test/status/123',
};

describe('validateEntry', () => {
  it('accepts a valid entry', () => {
    expect(validateEntry(validEntry)).toEqual([]);
  });

  it('requires name', () => {
    expect(validateEntry({ ...validEntry, name: '' })).toContain('name is required');
    expect(validateEntry({ ...validEntry, name: '   ' })).toContain('name is required');
  });

  it('rejects invalid role', () => {
    const errs = validateEntry({ ...validEntry, role: 'musician' });
    expect(errs.some(e => e.includes('role'))).toBe(true);
  });

  it('accepts all valid roles', () => {
    for (const role of VALID_ROLES) {
      expect(validateEntry({ ...validEntry, role })).toEqual([]);
    }
  });

  it('rejects invalid stance', () => {
    const errs = validateEntry({ ...validEntry, stance: 'maybe' });
    expect(errs.some(e => e.includes('stance'))).toBe(true);
  });

  it('accepts all valid stances', () => {
    for (const stance of VALID_STANCES) {
      expect(validateEntry({ ...validEntry, stance })).toEqual([]);
    }
  });

  it('accepts entry without quote', () => {
    const { quote, ...e } = validEntry;
    expect(validateEntry(e)).toEqual([]);
  });

  it('rejects quote that is too short when provided', () => {
    const errs = validateEntry({ ...validEntry, quote: 'Yes' });
    expect(errs.some(e => e.includes('too short'))).toBe(true);
  });

  it('requires source_url to be https', () => {
    const errs = validateEntry({ ...validEntry, source_url: 'not-a-url' });
    expect(errs.some(e => e.includes('source_url'))).toBe(true);
  });

  it('accepts source_url with http', () => {
    expect(validateEntry({ ...validEntry, source_url: 'http://example.com/post' })).toEqual([]);
  });

  it('rejects invalid wiki_url when provided', () => {
    const errs = validateEntry({ ...validEntry, wiki_url: 'wikipedia.org/Test' });
    expect(errs.some(e => e.includes('wiki_url'))).toBe(true);
  });

  it('accepts entry without wiki_url', () => {
    const { wiki_url, ...e } = validEntry;
    expect(validateEntry(e)).toEqual([]);
  });

  it('rejects malformed timestamp', () => {
    expect(validateEntry({ ...validEntry, timestamp: '14-07-2026 10:30' }).some(e => e.includes('timestamp'))).toBe(true);
    expect(validateEntry({ ...validEntry, timestamp: '2026-07-14' }).some(e => e.includes('timestamp'))).toBe(true);
    expect(validateEntry({ ...validEntry, timestamp: '2026-07-14 10' }).some(e => e.includes('timestamp'))).toBe(true);
  });

  it('rejects future timestamp', () => {
    const future = new Date(Date.now() + 86400000 * 365);
    const ts = `${future.getFullYear()}-${String(future.getMonth()+1).padStart(2,'0')}-${String(future.getDate()).padStart(2,'0')} 12:00`;
    expect(validateEntry({ ...validEntry, timestamp: ts }).some(e => e.includes('future'))).toBe(true);
  });
});
