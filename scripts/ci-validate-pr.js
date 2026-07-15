// Runs in CI on pull_request events. Validates new/modified entry files,
// writes validation-result.md for the comment workflow to post.
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { validateEntry, duplicateHash, parseIstTimestamp } from './validate-entry.js';

const ROOT = new URL('..', import.meta.url).pathname;
const r = (...p) => join(ROOT, ...p);

// Get changed files from git diff output (written by the workflow step)
const changedFilesRaw = readFileSync('changed-files.txt', 'utf8').trim();
const changedEntryFiles = changedFilesRaw
  .split('\n')
  .map(f => f.trim())
  .filter(f => f.startsWith('data/entries/') && f.endsWith('.json'));

if (!changedEntryFiles.length) {
  writeFileSync('validation-result.md', '> No entry files changed — skipping validation.');
  process.exit(0);
}

// Load all existing entries for duplicate detection
const allEntries = new Map();
try {
  const existing = readdirSync(r('data/entries')).filter(f => f.endsWith('.json') && !f.startsWith('.'));
  for (const file of existing) {
    try {
      const entry = JSON.parse(readFileSync(r('data/entries', file), 'utf8'));
      allEntries.set(duplicateHash(entry), file);
    } catch { /* skip unparseable existing files */ }
  }
} catch { /* entries dir missing */ }

async function checkUrl(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'WhoStoodUp-CI/1.0' },
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

const results = [];

for (const filePath of changedEntryFiles) {
  const file = filePath.split('/').pop();
  const result = { file, errors: [], warnings: [], pass: true };

  // 1. Parse JSON
  let entry;
  try {
    entry = JSON.parse(readFileSync(r(filePath), 'utf8'));
  } catch (e) {
    result.errors.push(`Invalid JSON: ${e.message}`);
    result.pass = false;
    results.push(result);
    continue;
  }

  // 2. Schema validation
  const schemaErrors = validateEntry(entry);
  if (schemaErrors.length) {
    schemaErrors.forEach(e => result.errors.push(e));
    result.pass = false;
  }

  // 3. Duplicate detection (only among *other* files, not itself)
  const hash = duplicateHash(entry);
  const existingFile = allEntries.get(hash);
  if (existingFile && existingFile !== file) {
    result.errors.push(`Likely duplicate of \`${existingFile}\` (same name + source URL)`);
    result.pass = false;
  }

  // 4. Source URL reachability
  if (/^https?:\/\//i.test(entry.source_url ?? '')) {
    const urlCheck = await checkUrl(entry.source_url);
    if (!urlCheck.ok) {
      result.errors.push(`source_url unreachable — ${urlCheck.status ?? urlCheck.error}`);
      result.pass = false;
    }
  }

  // 5. Basic quote hygiene warnings (advisory only, don't fail)
  if (entry.quote) {
    if (!entry.quote.match(/[.!?"।]/)) {
      result.warnings.push('Quote may be incomplete — no sentence-ending punctuation found');
    }
    if (entry.quote.length > 1000) {
      result.warnings.push('Quote is very long (>1000 chars) — consider using the most relevant excerpt');
    }
    if (/\b(paraphrase|summary|gist)\b/i.test(entry.quote)) {
      result.warnings.push('Quote contains paraphrase indicators — ensure this is verbatim');
    }
  }

  results.push(result);
}

// --- Generate markdown report ---
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;

const icon = (r) => r.pass ? '✅' : '❌';

let md = `## WhoStoodUp CI Validation\n\n`;
md += `**${passed} passed, ${failed} failed** across ${results.length} file(s).\n\n`;

for (const res of results) {
  md += `### ${icon(res)} \`${res.file}\`\n`;
  if (res.errors.length) {
    md += `**Errors (must fix):**\n`;
    res.errors.forEach(e => { md += `- ❌ ${e}\n`; });
    md += '\n';
  }
  if (res.warnings.length) {
    md += `**Warnings (advisory):**\n`;
    res.warnings.forEach(w => { md += `- ⚠️ ${w}\n`; });
    md += '\n';
  }
  if (res.pass && !res.warnings.length) {
    md += `All checks passed.\n\n`;
  }
}

md += `---\n*Maintainer: this is advisory — you make the final call on merge.*`;

writeFileSync('validation-result.md', md);

if (failed > 0) {
  console.error(md);
  process.exit(1);
} else {
  console.log(md);
  process.exit(0);
}
