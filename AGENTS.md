# Agent instructions — WhoStoodUp

These instructions apply to Claude Code, Cursor, Windsurf, Cline, GitHub Copilot, and any other agent or tool working in this repo.

## What this project is

A static crowdsourced website tracking public figures' statements on Sonam Wangchuk's hunger strike. No backend. No framework. Entries come in via GitHub PRs; CI validates; maintainers merge; GitHub Actions build and deploy to Cloudflare Pages.

## Stack

- **Frontend**: plain HTML, CSS (custom properties), vanilla JS (IIFE, no bundler)
- **Build**: Node.js scripts in `scripts/` (ESM, Node 20+)
- **Tests**: Vitest (unit) + Playwright (e2e)
- **CI**: GitHub Actions (two-workflow pattern for PR security)
- **Hosting**: Cloudflare Pages (`wrangler pages deploy`)

## Coding rules (Ponytail / YAGNI)

Before adding anything, ask: does this need to exist? → stdlib? → native browser feature? → installed dep? → custom code? Never reach for a framework or library where a native equivalent exists. Three similar lines is better than a premature abstraction.

Exceptions that override YAGNI without discussion: security vulnerabilities, data loss, accessibility failures.

## Design system

Tokens are in `src/style.css`. Do not introduce new colours. The palette is: `#0A0A0A` bg · `#FAFAFA` fg · `#1A1A1A` muted · `#737373` muted-fg · `#FF3D00` accent · `#262626` border. Accent is for support stance, CTAs, focus rings, and underlines — used sparingly. No rounded corners (`border-radius: 0`). No shadows.

Stance labels always include text — never rely on colour alone.

## Security rules

- CI trigger for PRs is `pull_request`, not `pull_request_target` — do not change this
- No secrets in code or committed files
- All workflow `uses:` should be pinned to commit SHAs (TODO before first deploy)
- User-submitted content (quotes, URLs) must be HTML-escaped before DOM insertion

## Build → inject pattern

`src/index.html` is a template. `scripts/build.js` replaces `<!-- MARKER -->` comments with generated content. Do not use a templating engine. Do not import external build tools.

Markers: `<!-- META_TITLE -->` `<!-- META_DESCRIPTION -->` `<!-- JSON_LD -->` `<!-- CONFIG_JSON -->` `<!-- QUOTES_JSON -->` `<!-- ENTRIES_JSON -->` `<!-- GENERATED_AT -->` `<!-- ENTRIES_TABLE -->` `<!-- SUPPORT_COUNT -->` `<!-- OPPOSITION_COUNT -->` `<!-- CONCERN_COUNT -->` `<!-- TOTAL_COUNT -->`

## Data model

One file per entry in `data/entries/`. Shared validation logic is in `scripts/validate-entry.js` — if you change the schema, update both the validation constants and the tests.

`schema_version` in `data/config.json` and `dist/entries.json`: bump on any breaking schema change so downstream tools don't silently break.

## Tests

- Unit tests: `tests/unit/*.test.js` (Vitest)
- E2E tests: `tests/e2e/site.spec.js` (Playwright, runs after `npm run build`)

Run both before opening a PR. If you change `validate-entry.js`, update `tests/unit/schema.test.js` and `tests/unit/duplicate.test.js`. If you change the build output structure, update `tests/unit/aggregate.test.js`.

## Files to update together

| Change | Also update |
|---|---|
| Entry schema fields | `validate-entry.js`, `scripts/build.js` (renderRows), `src/index.html` (table headers), `CONTRIBUTING.md`, `src/llms.txt`, `CLAUDE.md` |
| New design token | `src/style.css` only |
| New filter type | `src/index.html` (filter bar), `src/main.js` (filter logic), `tests/e2e/site.spec.js` |
| New build marker | `scripts/build.js` (replacer), `src/index.html` (marker), `CLAUDE.md` |
