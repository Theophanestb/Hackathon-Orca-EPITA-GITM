# Lab Report Analyzer

Analyse medical lab reports **entirely in your browser**. There is no backend, no analytics, no storage and no network calls during analysis: your data never leaves your device.

> This tool is a decision-support prototype, not a diagnosis. Always consult a healthcare professional.

Live: https://labanalyzer.stabat.fr

## Features

- **Three ways to enter a report**
  - **Try a sample**: 4 fictitious reports (healthy, single anomaly, metabolic risk, critical case).
  - **Upload**: drag and drop a JSON or CSV file (comma, semicolon or tab separated, decimal commas supported), with the expected format shown and downloadable templates.
  - **Manual entry**: sex plus one field per marker, with units and reference ranges shown inline.
- **17 markers** across 7 panels (blood count, metabolic, kidney, liver, lipids, thyroid, inflammation), with sex-specific ranges for haemoglobin and critical thresholds for potassium and sodium.
- **5 status levels**: normal, borderline (within 10 % of a bound, still in range), low/high, critical, plus "not analysed" for unknown markers or unsupported units. These are listed with the reason, never silently dropped.
- **7 combination rules** (possible diabetes, kidney function, liver damage, iron-deficiency anaemia, hypothyroidism, cardiovascular risk, infection/inflammation), sorted by priority. Each has a plain-language explanation, the values involved and a next step.
- **Results dashboard**: summary cards, critical-value banner, alerts first, then a table per panel with value, unit, range, status badge and a small range bar.
- **Accessible by design**: status is never conveyed by colour alone (icon + text label), the app is keyboard navigable with visible focus, has a skip link, labelled form fields and live regions, and respects reduced motion.
- **Print / Save as PDF** with a dedicated print stylesheet (always light, no navigation).
- **Transparent**: the "How it works" page lists every range, threshold and rule, generated from the same data the engine uses.
- Light and dark mode, responsive from 320 px phones to desktop.

## Architecture

```
src/
  data/referenceRanges.ts   Marker definitions: names, aliases, units, panels, ranges, critical thresholds
  data/samples.ts           The 4 demo reports (bundled from public/samples, no fetch)
  lib/parse.ts              JSON / CSV parsing and validation, with line-level error messages
  lib/analyze.ts            Classification of each value (normal, borderline, low/high, critical, not analysed)
  lib/rules.ts              Combination rules: declarative metadata + predicate, sorted by priority
  lib/report.ts             runAnalysis() = analyze + rules, plus formatting helpers
  components/input/         Sample picker, file upload, manual entry
  components/results/       Dashboard, summary cards, alerts, panel tables, range bar, status badge
  app/                      Pages: / (analyzer), /how-it-works, /privacy
public/samples/             Demo reports and CSV / JSON templates
scripts/csp-hashes.mjs      Post-build: hashes Next.js inline scripts for the nginx CSP
```

The layers are separate: `data` holds the medical knowledge only, `lib` holds pure, UI-free functions (fully unit-tested), and `components` handles presentation. Changing a range or adding a rule touches a single file, and the "How it works" page updates automatically.

Design decisions:

- **Range semantics**: two-sided ranges include their bounds; one-sided limits are strict, exactly as written ("below 5.7" means 5.7 is high).
- **Borderline band**: 10 % of the range width for two-sided ranges, and 10 % of the limit for one-sided ones. Using 10 % of the bound itself would make the whole sodium range (135 to 145) borderline.
- **No unit conversion**: unsupported units become "not analysed". A silent wrong conversion is worse than no result.
- **Duplicates are rejected**, not guessed.
- **No persistence**: the analysis lives in React state only. Only the theme preference is stored.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest: parse, analyze, rules, samples, page
npm run lint
npm run build      # static site in ./out (+ CSP hashes in nginx/generated/)
```

Docker (as in production):

```bash
docker network create web      # once; production shares this network with cloudflared
docker compose up -d --build   # http://127.0.0.1:8085
```

Deployment behind a Cloudflare Tunnel: see [DEPLOY.md](DEPLOY.md).

## Eco-design and security

- Static export served by nginx; no server-side code, no API routes.
- System font stack (no web fonts), no CDN, no chart library (the range bar is a few `div`s), and only small dependencies (shadcn/ui on Base UI, lucide icons tree-shaken). Samples are bundled, so analysis needs no request.
- Strict security headers in `nginx.conf`: CSP `default-src 'self'` with `frame-ancestors 'none'`, plus `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`. Next.js inline bootstrap scripts are allowed by **hash** (computed after each build by `scripts/csp-hashes.mjs`), so `script-src` never needs `'unsafe-inline'`.
- Long-term caching for hashed assets, `no-cache` for HTML, gzip.

## Tools used

- **Next.js** (App Router, static export), **TypeScript**, **Tailwind CSS**, **shadcn/ui** (Base UI primitives), **lucide-react**, **sonner** (toasts), **next-themes**
- **Vitest**, **Testing Library** and **jsdom** for tests; **ESLint**
- **Docker**, **nginx**, **Cloudflare Tunnel** for hosting
- **AI assistance**: Claude Code (Anthropic) was used as a pair-programming assistant to scaffold the project, write code, tests and documentation, and configure the deployment. All output was reviewed, run and tested by the team.

## Pre-built work

Everything in this repository was built during the hackathon. No pre-existing project code was reused. The only reused pieces are standard open-source tooling: the Next.js project generator (`create-next-app`), the shadcn/ui component generator, and the npm libraries listed above.
