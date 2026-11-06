# Verification report — 6 November 2026

## Final results

| Check | Outcome |
|---|---|
| TypeScript strict type check | Passed |
| ESLint | Passed, no warnings |
| Core behavior tests | 9 passed |
| Playwright desktop/mobile tests | 14 passed |
| Production static build | Passed |
| Production dependency audit | 0 vulnerabilities reported |
| Real OpenAlex search in production preview | 20 records returned; 15 supplied OA links |
| Real Crossref lookup | DOI 10.1038/nature12373 returned verified metadata |
| Production browser diagnostics | No console warnings/errors or page exceptions observed during smoke flow |
| Mobile overflow | None observed |
| Public deployment | Not performed; billing verification blocked |
| Dedicated Unpaywall endpoint | Prepared, not live-tested or deployed |

## Automated coverage

Chromium desktop at 1440×1000 and Pixel 7 mobile emulation independently exercise project creation, question entry, conditional design selection, ethics/analysis notes, protocol download, refresh persistence, backup export, import preview, non-destructive restoration, mocked literature search, extraction, scoped gap notes, simulated 429 failure, journal identity lookup, malformed backup rejection, and modal keyboard focus/containment/restoration.

Core tests cover backup schema round trips and rejection, DOI normalization, unsafe link rejection, missing provider metadata, exact DOI deduplication, spreadsheet-formula neutralization, design-router abstention and disciplinary applicability, discipline configuration, unsupported Boolean syntax, and quota failures.

Provider fixtures establish UI behavior, not live provider correctness. The separate production smoke run uses real network requests without fixtures. OA link availability was observed in OpenAlex metadata; link destinations and dedicated Unpaywall resolution were not exhaustively validated.

## Issues found and corrected

1. New-project dialog initially left keyboard focus behind the overlay. Added focus placement, containment, Escape handling, and restoration; regression checks passed on both viewports.
2. Save status could show completion of an older snapshot while recent changes were still waiting. Removed delayed writes, serialized saves, tracked revisions, marked edits dirty immediately, and added an unsaved-navigation warning. Refresh/restore regression checks passed on both viewports.
3. Test selectors initially overlooked the project-count badge and matched Next.js's separate route alert. Selectors now identify the intended visible control/message without weakening expected behavior.

## Remaining limits

No physical-device, screen-reader, Safari, Firefox, institutional expert-review, load, or exhaustive accessibility audit was performed. No multi-tab conflict resolution is implemented. Storage exhaustion UI exists but has not been browser-injected in this test suite. The optional gateway requires account configuration and live deployment verification. Current IUB taxonomy and missing original MIS material remain unverified.

Commands are documented in README.md. Evidence screenshots are in docs/screenshots; the machine-readable live smoke report is docs/live-smoke-report.json. Screenshots are local deliverables, not required repository files.

## External-link repair verification

Same-tab link navigation, copy-address fallback, absence of Foundations UI, and project persistence after returning were checked on desktop and mobile. A real DOI OA lookup succeeded without a gateway. Crossref search, PRISMA, EQUATOR, STROBE, ARRIVE, TRIPOD, CARE, Think.Check.Submit, and Clarivate loaded in the browser. OpenLearn, DOAJ, and Scopus returned access challenges to the test browser; those third-party restrictions are not claimed fixed or bypassed. The copy-link control and access notice remain available.
