# Research Atlas

A free, local-first research planning app. Built for students and early-career researchers, with examples across six disciplinary families and a Bangladesh-aware starting point.

## Run

Requires Node.js 24 and npm. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:3000.
For a production preview run `npm run build`, then `npm run preview`. Open http://127.0.0.1:4173. Do not open out/index.html directly with file://; browser storage and asset paths need an HTTP origin.

## Included

- Six discipline packs and 30 example domains (not an official university directory).
- Problem/question builder and conditional study-design guidance.
- OpenAlex keyword search with year/OA filters and source provenance.
- Literature matrix, screening decisions, evidence locators, search log, CSV export.
- Scoped contribution notes and Crossref DOI identity checks.
- Protocol Markdown export; versioned JSON backup and non-destructive restore.
- Local IndexedDB persistence, responsive layouts, keyboard-accessible project dialog.

## Architecture

Next.js static export + React + TypeScript + Zod. Private project data live in browser IndexedDB. Public source searches go directly to OpenAlex/Crossref by default. An optional Cloudflare Worker gateway is supplied for controlled proxying and Unpaywall DOI resolution. No paid AI, account system, analytics, or database server is required.


## Checks

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`.
Install the test browser first: `npx playwright install chromium`.

## Limits

This is a functional v0.1, not an exhaustive research platform or a validated methods tutor. Search returns the first 20 records and does not implement advanced Boolean syntax or systematic-review completeness. Most metadata fields may be missing. No automated gap verification, journal-quality score, or statistical analysis is performed. Guideline links are references, not full checklist audits. The original MIS inventory and current IUB directory were not available. Use one editing tab per workspace; simultaneous tab editing is not supported. Save backups regularly.

Dedicated Unpaywall lookup needs a configured free gateway and operator contact. Public deployment is pending billing-read verification. GitHub publication is not completed; the connected tool lacks repository creation and no repository was supplied. See DEPLOYMENT.md and TESTING.md for the precise delivery status.

External sources: https://help.openalex.org/api/ , https://www.crossref.org/documentation/retrieve-metadata/rest-api/ , https://data.unpaywall.org/products/api . Source links also accompany lessons and standards in the app.
