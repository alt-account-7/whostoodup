# Contributing to WhoStoodUp

There are two ways to contribute: submitting entries and moderating PRs.

---

## Not comfortable with GitHub? Send it on X or Instagram

If you're not familiar with GitHub, you can send your submission on social and we'll add it ourselves:

- **X:** Tweet **[@WhoStoodUp](https://x.com/WhoStoodUp)**
- **Instagram:** Tag **[@whostoodup](https://www.instagram.com/whostoodup/)** in a story, or [DM us](https://www.instagram.com/whostoodup/) there

Include:
- **Name** of the public figure
- **Role** — celebrity / politician / influencer / journalist / other
- **Stance** — support / opposition / neutral
- **Quote** — verbatim, exactly what they said
- **Source link** — a public URL where the statement can be verified
- **Date** they said it (approximate is fine)

We review submissions and add verified entries manually. No GitHub account needed.

---

## Submitting an entry via GitHub

### Who qualifies as a public figure?

Elected/appointed officials, or anyone with a Wikipedia page, verified social account, or notable media coverage independent of this event. When in doubt, include the source and let the maintainer decide.

### File format

One JSON file per PR under `data/entries/`. Filename format:

```
YYYY-MM-DD-HHMM_name-slug.json
```

where the date/time is the time of the original statement (not your submission time), and the slug is the person's name in lowercase with hyphens.

### Required fields

| Field | Notes |
|---|---|
| `name` | Full public name |
| `role` | `celebrity` \| `politician` \| `influencer` \| `journalist` \| `other` |
| `stance` | `support` \| `opposition` \| `neutral` |
| `quote` | Verbatim — copy exactly, including punctuation. Omit entirely if the person visited/attended but made no public statement. |
| `timestamp` | `YYYY-MM-DD HH:MM` in IST. When they said it. |
| `source_url` | Must be public, not paywalled, not dead |

### Optional fields

| Field | Notes |
|---|---|
| `wiki_url` | Wikipedia or public profile link — makes the name clickable |

### The quote rule

The `quote` field is optional. Omit it entirely if the person visited/attended the protest or CJP event but made no public statement.

If a quote is provided, it must be a direct, verbatim quote. If the original statement is in another language, include the original AND an attributed translation — the original goes in `quote`, and you can note the translation in a PR comment.

No paraphrasing. No "gist." No editorial summary. If you have a source showing attendance but no direct quote, leave `quote` out.

### The source rule

`source_url` must:
- Be publicly accessible (no paywalls, login walls)
- Load at the time you submit the PR (CI checks this)
- Directly show the quote (not just the person's homepage)

### Timestamp rule

`timestamp` is when the person made the statement — not when you submit the PR. IST only (`YYYY-MM-DD HH:MM`). If you don't know the exact time, use `HH:00` for the hour.

### Duplicates

Check `data/entries/` before submitting — search for the person's name slug. CI also detects likely duplicates (same name + source URL). If the same person made *multiple* statements, each with a different source, each can have its own entry.

---

## Applying to help moderate

If you'd like to review incoming PRs:
1. Open an issue using the [Maintainer Application template](https://github.com/alt-account-7/whostoodup/issues/new?template=maintainer-application.yml)
2. Describe your availability (even 1-2 PR reviews per week helps)
3. You'll be added as a repo collaborator

**What moderation involves:**
- Check that the source URL actually contains the quote
- Confirm the quote is verbatim
- Check for duplicates (CI flags likely ones automatically)
- Confirm the stance classification is accurate
- Merge or request changes

No coding required. No political alignment required — both support and opposition entries are welcome when properly sourced.

**Contact for moderation or other project matters:** open an issue, or use the project's contact alias listed in `SECURITY.md`.

---

## Running locally

```bash
npm install
npm run build      # aggregates entries + generates dist/
npm test           # unit tests
npm run test:e2e   # Playwright end-to-end tests
```

Node 20+ required.

---

## Security

See `SECURITY.md`. TL;DR: no secrets in code, report vulnerabilities via issue (security label) or project alias — not public PRs.
