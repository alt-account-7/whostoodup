import { describe, it, expect } from 'vitest';
import { duplicateHash } from '../../scripts/validate-entry.js';

describe('duplicateHash', () => {
  const base = { name: 'Priyanka Chopra', source_url: 'https://twitter.com/pc/status/123' };

  it('produces consistent hash for same input', () => {
    expect(duplicateHash(base)).toBe(duplicateHash(base));
  });

  it('same hash for same name + source regardless of other fields', () => {
    const a = { ...base, stance: 'support', quote: 'Quote A' };
    const b = { ...base, stance: 'opposition', quote: 'Quote B', role: 'politician' };
    expect(duplicateHash(a)).toBe(duplicateHash(b));
  });

  it('different hash for different source_url', () => {
    const a = { ...base, source_url: 'https://twitter.com/pc/status/123' };
    const b = { ...base, source_url: 'https://twitter.com/pc/status/456' };
    expect(duplicateHash(a)).not.toBe(duplicateHash(b));
  });

  it('different hash for different name', () => {
    const a = { ...base, name: 'Priyanka Chopra' };
    const b = { ...base, name: 'Deepika Padukone' };
    expect(duplicateHash(a)).not.toBe(duplicateHash(b));
  });

  it('normalises name casing for hash', () => {
    const a = { ...base, name: 'PRIYANKA CHOPRA' };
    const b = { ...base, name: 'priyanka chopra' };
    expect(duplicateHash(a)).toBe(duplicateHash(b));
  });

  it('normalises name whitespace for hash', () => {
    const a = { ...base, name: '  Priyanka Chopra  ' };
    const b = { ...base, name: 'priyanka chopra' };
    expect(duplicateHash(a)).toBe(duplicateHash(b));
  });

  it('returns a 16-char hex string', () => {
    expect(duplicateHash(base)).toMatch(/^[0-9a-f]{16}$/);
  });
});
