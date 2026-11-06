# Verification

## Release checks

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. Use `npx playwright install chromium firefox` to install the browser binaries. The default suite uses desktop Chromium and Pixel 7 emulation. Set `ATLAS_FIREFOX=1` to include desktop Firefox.

Fixtures cover literature sorting, fee provenance, rate limits, screening history, claim export, reference import, backup validation, write failure recovery, and planner persistence. The accessibility cases scan the paper search, planner and privacy views with axe-core. Keyboard focus is checked separately. WebKit, physical-device testing and a complete manual accessibility audit are outside this suite.

## Live provider checks

Run `node scripts/smoke.mjs` against a running production preview. For the published site, pass its URL and commit SHA. Use `docs/smoke/local-latest.json` and `docs/smoke/production-latest.json` to distinguish those runs. The smoke test checks a real OpenAlex search, a real Crossref DOI lookup, backup restore, offline reopening and a mobile viewport. Its provider responses are time-dependent. The deterministic fixture suite remains the release regression check.
