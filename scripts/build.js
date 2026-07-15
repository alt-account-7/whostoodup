import { readFileSync, writeFileSync, mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import { validateEntry, duplicateHash } from './validate-entry.js';

const ROOT = new URL('..', import.meta.url).pathname;
const r = (...p) => join(ROOT, ...p);

mkdirSync(r('dist'), { recursive: true });

// --- Load data ---
const config = JSON.parse(readFileSync(r('data/config.json'), 'utf8'));
const quotes = JSON.parse(readFileSync(r('data/quotes.json'), 'utf8'));

const entryFiles = readdirSync(r('data/entries'))
  .filter(f => f.endsWith('.json') && !f.startsWith('.'));

const entries = [];
const seen = new Map();
const buildErrors = [];

for (const file of entryFiles) {
  let entry;
  try {
    entry = JSON.parse(readFileSync(r('data/entries', file), 'utf8'));
  } catch {
    buildErrors.push(`${file}: invalid JSON`);
    continue;
  }
  const errs = validateEntry(entry);
  if (errs.length) {
    buildErrors.push(`${file}: ${errs.join('; ')}`);
    continue;
  }
  const hash = duplicateHash(entry);
  if (seen.has(hash)) {
    buildErrors.push(`${file}: duplicate of ${seen.get(hash)}`);
    continue;
  }
  seen.set(hash, file);
  entries.push(entry);
}

if (buildErrors.length) {
  console.error('Build failed — entry validation errors:\n' + buildErrors.map(e => '  ' + e).join('\n'));
  process.exit(1);
}

entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

const generatedAt = new Date().toISOString();
const entriesJson = { schema_version: '1', generated_at: generatedAt, entries };

// --- Counts for meta / summary ---
const counts = { support: 0, opposition: 0, neutral: 0 };
entries.forEach(e => { if (counts[e.stance] !== undefined) counts[e.stance]++; });

// --- Utilities ---
function escHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function safeUrl(url) {
  return /^https?:\/\//i.test(url ?? '') ? url : '#';
}

function safeJson(obj) {
  return JSON.stringify(obj).replace(/<\/script/gi, '<\\/script');
}

function rowId(entry) {
  const slug = entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `entry-${slug}-${entry.timestamp.split(' ')[0]}`;
}

function stanceLabel(stance) {
  return { support: 'SUPPORT', opposition: 'OPPOSED', neutral: 'NEUTRAL' }[stance] ?? stance.toUpperCase();
}

// --- Pre-render table rows (SEO) ---
function renderRows(rows) {
  if (!rows.length) {
    return '<tr><td colspan="6" class="empty-state mono">No entries yet — be the first to contribute.</td></tr>';
  }
  return rows.map(e => {
    const date = e.timestamp.split(' ')[0];
    const nameHref = e.wiki_url ? safeUrl(e.wiki_url) : '#';
    return `<tr id="${rowId(e)}" class="entry-row stance-${e.stance}">
      <td class="mono col-date">${escHtml(date)}</td>
      <td class="col-name">${nameHref !== '#' ? `<a href="${escHtml(nameHref)}" target="_blank" rel="noopener noreferrer">${escHtml(e.name)}</a>` : escHtml(e.name)}</td>
      <td class="mono col-role">${escHtml(e.role.toUpperCase())}</td>
      <td class="col-stance"><span class="stance-badge stance-${e.stance}" aria-label="${stanceLabel(e.stance)}">${stanceLabel(e.stance)}</span></td>
      <td class="col-quote">${e.quote ? `&ldquo;${escHtml(e.quote)}&rdquo;` : '<span class="no-quote">Attended / no public statement</span>'}</td>
      <td class="col-source"><a href="${escHtml(safeUrl(e.source_url))}" target="_blank" rel="noopener noreferrer" class="source-link mono" data-entry="${escHtml(e.name)}">SOURCE ↗</a></td>
    </tr>`;
  }).join('\n');
}

// --- JSON-LD structured data ---
// Must escape </script> — this string lands inside a <script> tag in HTML.
function buildJsonLd() {
  const graph = [
    {
      '@type': 'Event',
      name: "Sonam Wangchuk's Hunger Strike at Jantar Mantar",
      startDate: config.strike_start_date,
      description: 'Indefinite hunger strike by Sonam Wangchuk at Jantar Mantar, New Delhi, demanding the resignation of Education Minister Dharmendra Pradhan over competitive exam paper leaks and student suicides.',
      location: { '@type': 'Place', name: 'Jantar Mantar, New Delhi, India' },
      url: config.base_url,
    },
    ...entries.map(e => ({
      '@type': 'Quotation',
      text: e.quote,
      spokenByCharacter: {
        '@type': 'Person',
        name: e.name,
        ...(e.wiki_url ? { sameAs: e.wiki_url } : {}),
      },
      dateCreated: e.timestamp.split(' ')[0],
      citation: { '@type': 'WebPage', url: e.source_url },
    })),
  ];
  return safeJson({ '@context': 'https://schema.org', '@graph': graph });
}

// --- Meta tag content ---
function metaTitle() {
  const dayN = Math.max(1, Math.floor((Date.now() - new Date(config.strike_start_date + 'T00:00:00+05:30').getTime()) / 86400000) + 1);
  return `Day ${dayN}: WhoStoodUp — Who's speaking on Wangchuk's fast for exam justice`;
}

function metaDescription() {
  return `${entries.length} sourced entries: ${counts.support} support, ${counts.opposition} opposed. Tracking public figures' statements on Sonam Wangchuk's fast at Jantar Mantar demanding Education Minister Dharmendra Pradhan's resignation over exam paper leaks and student suicides.`;
}

// --- Build index.html ---
const template = readFileSync(r('src/index.html'), 'utf8');
// replaceAll: some markers (META_TITLE, META_DESCRIPTION) appear multiple times (title + OG tags).
const indexHtml = template
  .replaceAll('<!-- META_TITLE -->', escHtml(metaTitle()))
  .replaceAll('<!-- META_DESCRIPTION -->', escHtml(metaDescription()))
  .replace('<!-- JSON_LD -->', buildJsonLd())
  .replace('<!-- CONFIG_JSON -->', safeJson(config))
  .replace('<!-- QUOTES_JSON -->', safeJson(quotes))
  .replace('<!-- ENTRIES_JSON -->', safeJson(entriesJson))
  .replace('<!-- GENERATED_AT -->', generatedAt)
  .replace('<!-- ENTRIES_TABLE -->', renderRows(entries))
  .replace('<!-- SUPPORT_COUNT -->', counts.support)
  .replace('<!-- OPPOSITION_COUNT -->', counts.opposition)
  .replace('<!-- TOTAL_COUNT -->', entries.length);

writeFileSync(r('dist/index.html'), indexHtml);

// --- Copy static files ---
for (const file of ['why.html', 'style.css', 'main.js', 'robots.txt', 'llms.txt']) {
  copyFileSync(r('src', file), r('dist', file));
}

// --- Write entries.json ---
writeFileSync(r('dist/entries.json'), JSON.stringify(entriesJson, null, 2));

// --- Generate sitemap.xml ---
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.base_url}/</loc>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
    <lastmod>${generatedAt.split('T')[0]}</lastmod>
  </url>
  <url>
    <loc>${config.base_url}/why.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
writeFileSync(r('dist/sitemap.xml'), sitemap);

console.log(`Built ${entries.length} entries → dist/ [${generatedAt}]`);
console.log(`  Support: ${counts.support}  Opposed: ${counts.opposition}  Neutral: ${counts.neutral}`);
