import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = new URL('../..', import.meta.url).pathname;
const ENTRIES_DIR = join(ROOT, 'data/entries');
const DIST_DIR = join(ROOT, 'dist');
const TEST_FILES = [];

const baseEntry = {
  schema_version: '1',
  name: 'Test Actor',
  role: 'celebrity',
  wiki_url: 'https://en.wikipedia.org/wiki/Test',
  stance: 'support',
  quote: 'I stand with Sonam Wangchuk and his demands.',
  timestamp: '2026-07-14 10:00',
  source_url: 'https://twitter.com/testactor/status/1001',
};

function writeTestEntry(name, content) {
  const file = join(ENTRIES_DIR, name);
  writeFileSync(file, JSON.stringify(content, null, 2));
  TEST_FILES.push(file);
  return file;
}

function runBuild() {
  execSync('node scripts/build.js', { cwd: ROOT, stdio: 'pipe' });
}

beforeAll(() => {
  writeTestEntry('2026-07-14-1000_test-actor.json', baseEntry);
  writeTestEntry('2026-07-14-1200_test-politician.json', {
    ...baseEntry,
    name: 'Test Politician',
    role: 'politician',
    stance: 'opposition',
    quote: 'I do not support this disruption of public order.',
    timestamp: '2026-07-14 12:00',
    source_url: 'https://twitter.com/testpol/status/1002',
  });
});

afterAll(() => {
  TEST_FILES.forEach(f => { try { rmSync(f); } catch {} });
});

describe('build script', () => {
  it('runs without error', () => {
    expect(() => runBuild()).not.toThrow();
  });

  it('produces dist/entries.json', () => {
    runBuild();
    expect(existsSync(join(DIST_DIR, 'entries.json'))).toBe(true);
  });

  it('entries.json contains all seeded entries', () => {
    runBuild();
    const out = JSON.parse(readFileSync(join(DIST_DIR, 'entries.json'), 'utf8'));
    expect(out.entries.some(e => e.name === 'Test Actor')).toBe(true);
    expect(out.entries.some(e => e.name === 'Test Politician')).toBe(true);
  });

  it('entries.json is sorted newest-first by default', () => {
    runBuild();
    const { entries } = JSON.parse(readFileSync(join(DIST_DIR, 'entries.json'), 'utf8'));
    const relevant = entries.filter(e => e.name === 'Test Actor' || e.name === 'Test Politician');
    expect(relevant[0].timestamp.localeCompare(relevant[1].timestamp)).toBeGreaterThan(0);
  });

  it('produces dist/index.html', () => {
    runBuild();
    expect(existsSync(join(DIST_DIR, 'index.html'))).toBe(true);
  });

  it('index.html contains pre-rendered entry names', () => {
    runBuild();
    const html = readFileSync(join(DIST_DIR, 'index.html'), 'utf8');
    expect(html).toContain('Test Actor');
    expect(html).toContain('Test Politician');
  });

  it('produces dist/sitemap.xml', () => {
    runBuild();
    expect(existsSync(join(DIST_DIR, 'sitemap.xml'))).toBe(true);
  });

  it('produces dist/entries.json with generated_at field', () => {
    runBuild();
    const out = JSON.parse(readFileSync(join(DIST_DIR, 'entries.json'), 'utf8'));
    expect(out.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('produces dist/entries.json with schema_version field', () => {
    runBuild();
    const out = JSON.parse(readFileSync(join(DIST_DIR, 'entries.json'), 'utf8'));
    expect(out.schema_version).toBe('1');
  });

  it('escapes HTML special chars in entry content', () => {
    const file = join(ENTRIES_DIR, '2026-07-14-1400_xss-test.json');
    writeFileSync(file, JSON.stringify({
      ...baseEntry,
      name: 'XSS <script>alert(1)</script>',
      quote: 'Quote with <b>bold</b> & "quotes"',
      timestamp: '2026-07-14 14:00',
      source_url: 'https://example.com/source',
    }));
    TEST_FILES.push(file);

    runBuild();
    const html = readFileSync(join(DIST_DIR, 'index.html'), 'utf8');
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
