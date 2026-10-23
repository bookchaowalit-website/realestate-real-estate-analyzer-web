# Real Estate Analyzer — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `real-estate-analyzer`, evidence Prototype:
> "copy is accurate") on 2026-10-23.

## What it is

A client-only calculator over four hard-coded sample listings (condo, townhouse, studio, shop-house).

## Who it is for

A portfolio visitor, or a small investor sketching Bangkok-style rental numbers, who wants gross yield and payback
side by side.

## What works today

1. The index lists four sample records with their gross yield; selecting one shows price, rent, area, a field note
   and a yield bar.
2. The down-payment slider (10-80% in 5% steps) updates initial cash, annual gross rent and gross payback.
3. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- You cannot enter your own property; there is no listing API, broker, mortgage or net-yield model, and no
  investment recommendation.
- No account, storage or sync; nothing survives a reload. No API route. No product analytics.

## Live URL and deploy state

- Live: https://real-estate.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-real-estate-analyzer-frontend` is linked to this repository (`bookchaowalit-website/realestate-real-estate-analyzer-web`, branch `main`), so every
  push to `main` deploys to production. Last production deploy: the Next 16.4.2 security patch (e38d17f), by Git on
  2026-10-23.
- The L2 commits (lib/tests/Sentry/CI/docs) pushed on 2026-10-23 did not deploy: Vercel answered "Deployment rate
  limited — retry in 24 hours" (free-plan limit of 100 deployments per day). The live site shows the patch build
  until the next deploy of `main` after the quota resets.
- `NEXT_PUBLIC_SENTRY_DSN` is set on the Vercel project (Sentry project `realestate-real-estate-analyzer-web`, org `personal-yu0`); it takes effect
  with that next deploy.

## Boundaries

- Browser-only. All listings and figures are synthetic demonstration data.
