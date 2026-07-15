# WhoStoodUp

A crowdsourced, publicly-sourced tracker of which celebrities and politicians have commented on **Sonam Wangchuk's hunger strike** and the Citizens for Justice and Peace (CJP) protest.

Live at: **https://whostoodup.pages.dev** · Follow: **[@WhoStoodUp](https://x.com/WhoStoodUp)**

---

## Contribute — submit an entry

### Not on GitHub? Tweet it to us

Tweet your submission to **[@WhoStoodUp](https://x.com/WhoStoodUp)** and we'll add it ourselves. Include:
- Name of the public figure
- Role (celebrity / politician / influencer / journalist / other)
- Stance (support / opposition / neutral)
- The verbatim quote (or note if they attended/visited but made no statement)
- A public source link
- Date they said it

No GitHub account needed. We review all tweets and add verified entries manually.

### Via GitHub Pull Request

Found a public statement? Open a PR.

1. Fork this repo
2. Add one file under `data/entries/` using the naming format:
   ```
   YYYY-MM-DD-HHMM_name-slug.json
   ```
   Example: `2026-07-14-1430_zeenat-aman.json`

3. The file must follow this schema:
   ```json
   {
     "name": "Full Name",
     "role": "celebrity",
     "wiki_url": "https://en.wikipedia.org/wiki/...",
     "stance": "support",
     "quote": "Exact verbatim quote here.",
     "timestamp": "2026-07-14 14:30",
     "source_url": "https://..."
   }
   ```

   **Field values:**
   - `role`: `celebrity` | `politician` | `influencer` | `journalist` | `other`
   - `stance`: `support` | `opposition` | `neutral`
   - `timestamp`: statement date/time in IST (`YYYY-MM-DD HH:MM`) — when they *said* it, not when you're submitting
   - `quote`: verbatim, not paraphrased. Omit entirely if the person attended/visited but made no public statement.
   - `source_url`: publicly accessible URL. Required.
   - `wiki_url`: Wikipedia or public profile link. Optional but highly recommended.

4. Open a PR. CI runs automatically and checks for schema errors, unreachable URLs, and likely duplicates. A maintainer will review and merge.

**Rules:** One file per PR. Source link required. No paraphrasing.

---

## Maintainers Wanted

Running this alone doesn't scale at high PR volume. If you'd like to help review incoming entries (no coding required — just checking sources, quotes, and duplicates), open an issue using the [Maintainer Application template](https://github.com/alt-account-7/whostoodup/issues/new?template=maintainer-application.yml).

Maintainer role: review PRs for accurate quoting, valid sources, and duplicates. Merge or request changes. Both support and opposition entries are welcome when properly sourced — this project does not take sides.

---

## What's tracked

- **`name`** — the public figure
- **`stance`** — support / opposition / neutral
- **`quote`** — verbatim, sourced (optional if visited without a public statement)
- **`timestamp`** — when they said it (IST)

---

## Machine-readable data

Full dataset: `https://whostoodup.pages.dev/entries.json`
Schema version: see `schema_version` field. Breaking changes bump this.

---

## Dev setup

```bash
npm install
npm run build      # generates dist/
npm test           # unit tests (Vitest)
npm run test:e2e   # end-to-end tests (Playwright)
```

See `CONTRIBUTING.md` for full details including security setup for first-time contributors.
