# WhoStoodUp — Claude Code context

Static site tracking public figures' statements on Sonam Wangchuk's hunger strike and the CJP protest. Crowdsourced via GitHub PRs. Deployed on Cloudflare Pages.

## Architecture

```
data/
  config.json          # site config + strike_start_date
  quotes.json          # rotating quote ticker content
  entries/             # one .json file per entry (no merge conflicts)
scripts/
  validate-entry.js    # shared validation logic (imported by build + tests + CI)
  build.js             # aggregates entries → dist/ (HTML + JSON + sitemap)
  ci-validate-pr.js    # runs in CI on PRs, writes validation-result.md
src/
  index.html           # template with <!-- MARKER --> injection points
  why.html             # static about page
  style.css            # design system (no preprocessor, CSS custom props)
  main.js              # client-side JS (IIFE, no bundler, no framework)
  robots.txt / llms.txt
tests/
  unit/                # Vitest — schema, duplicate hash, timestamp, Day N, reltime, build
  e2e/                 # Playwright — full site smoke tests post-build
.github/
  PULL_REQUEST_TEMPLATE.md
  ISSUE_TEMPLATE/maintainer-application.yml
  workflows/
    validate-pr.yml    # runs on pull_request (no secrets) → uploads artifact
    comment-pr.yml     # runs on workflow_run (has write) → posts PR comment
    build-deploy.yml   # runs on push to main → build + wrangler pages deploy
```

## Design system tokens

Background `#0A0A0A` · Foreground `#FAFAFA` · Muted `#1A1A1A` · MutedForeground `#737373` · Accent `#FF3D00` · Border `#262626`

Fonts: Inter Tight (headlines) · JetBrains Mono (labels, stats, mono text) · Playfair Display (pull-quotes only)

Stance coding: support = accent + bold · opposition = foreground + bold · concern/neutral = mutedForeground + regular. Always include text label alongside colour — never colour alone.

## Build pipeline

`npm run build` → `node scripts/build.js`

- Reads `data/entries/*.json`, validates all, fails hard on any error
- Sorts newest-first
- Injects into `src/index.html` template via `<!-- MARKER -->` string replacement
- Writes `dist/` (index.html, entries.json, why.html, style.css, main.js, robots.txt, llms.txt, sitemap.xml)
- Pre-renders full table in HTML for SEO; client JS replaces tbody on load for filters/sort/pagination

## Entry schema

```json
{
  "name": "string (required)",
  "role": "celebrity|politician|other",
  "wiki_url": "https://... (optional)",
  "stance": "support|opposition|concern|neutral",
  "target": "person|demands|both",
  "quote": "verbatim, required, ≥10 chars",
  "timestamp": "YYYY-MM-DD HH:MM (IST, fixed UTC+5:30)",
  "source_url": "https://... (required)"
}
```

Entry filenames: `YYYY-MM-DD-HHMM_name-slug.json` — timestamp is statement time, not PR time.

## Security non-negotiables

- CI uses `pull_request` trigger, NEVER `pull_request_target` — untrusted PR code runs with zero secret access
- PR code runs in `validate-pr.yml` (no secrets); comment is posted by `comment-pr.yml` (workflow_run, has PR write) reading the artifact
- **TODO before going live: pin all `uses:` in workflows to commit SHAs, not version tags**
  - Run: `gh api repos/{owner}/{repo}/commits/{tag} --jq .sha`
  - Affected: `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, `actions/download-artifact`, `actions/github-script`, `gitleaks/gitleaks-action`
- `CLOUDFLARE_API_TOKEN` must be scoped to Pages:Edit only (not full account)
- `permissions: contents: read` on all jobs unless explicitly wider

## Maintainer identity hygiene (see PRD)

- Use a dedicated GitHub org/account — do not link to personal GitHub
- Set `git config user.email` to GitHub's noreply address for this repo
- Add `includeIf "gitdir:~/path/to/whostoodup/"` in `~/.gitconfig` to auto-apply project identity inside this folder
- Separate SSH key for the project GitHub account
- GA4 property owned by project account, not personal Google
- `whostoodup.pages.dev` → no payment method needed on Cloudflare free tier

## GitHub Secrets required

- `CLOUDFLARE_API_TOKEN` — Pages:Edit scoped token
- `CLOUDFLARE_ACCOUNT_ID` — found in Cloudflare dashboard
- `GITLEAKS_LICENSE` — (optional, for gitleaks-action; free tier doesn't need it)

## Commands

```bash
npm run build       # full build → dist/
npm test            # unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright, builds first)
npm run test:all    # both
```

## YAGNI rule (Ponytail plugin)

This is a static site (HTML + CSS + vanilla JS). Before reaching for a framework or dependency, exhaust: stdlib → native browser feature → installed dependency → custom code. No React, no bundler, no CSS preprocessor. The exception is hard-blocking: security, data loss, accessibility.
