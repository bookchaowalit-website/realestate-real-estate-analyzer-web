# Real Estate Analyzer

A client-only property ledger over four hard-coded, synthetic listings. Pick a listing to see its asking price,
monthly rent and gross yield (annual rent / price), and move a down-payment slider (10-80%) to see initial cash,
annual gross rent and gross payback in years.

Live: https://real-estate.bookchaowalit.com (Vercel builds every push to `main`, see `PRODUCT.md`).

## What it does not do

- No listing feed, search, own-property input, mortgage or net-yield maths (vacancy, fees, tax, maintenance are
  ignored), and no investment advice. No account or storage.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: yield and payback maths, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/realestate.ts`: the sample listings plus `grossYield`, `computeMetrics`, `yieldBarWidth` and the baht
  formatter (used by the page).
- `app/page.tsx`: the ledger page (client component).
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when
  `NEXT_PUBLIC_SENTRY_DSN` is unset.
