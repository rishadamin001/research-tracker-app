# Deploy Research Atlas

The default release is a static Vite site for the public GitHub repository. Its build output is `research-atlas/out`, and relative asset URLs and hash navigation support the repository URL prefix. Hosting requires no credentials in the browser build. See the [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

1. In [repository Pages settings](https://github.com/rishadamin001/research-tracker-app/settings/pages), set the publishing source to **GitHub Actions**.
2. From **Actions**, run **Publish Research Atlas to GitHub Pages** on `main`.
3. Open the URL printed by the deployment job. Create a test project, enter a question, reload, and check persistence. Run a short scholarly search and verify a DOI.

Project data belongs to its browser origin. Use **My projects → Download backup** on the source app, then **Import backup** at the destination. Atlas exports portable v3 backups and reads v1, v2 and v3. Current exports include origin, version, counts and an integrity checksum. Imports add new copies. Follow the [migration guide](docs/BACKUP-MIGRATION.md).

For a local production preview, run `npm ci`, `npm run build`, and `npm run preview`. The default preview address is http://127.0.0.1:4173.

## Optional gateway

The default Pages build uses direct public OpenAlex, Europe PMC and Crossref requests. OpenAlex discovery uses manually requested basic pages, bounded to 5 × 20 records per run. Related-paper actions retrieve at most 20 records. A verified-key gateway remains deferred. The existing template is available for independently operated deployments and keeps OpenAlex anonymous. Set `VITE_API_URL` only if you intentionally operate a gateway. Use a same-origin absolute path or an HTTPS URL without credentials, query parameters or a fragment. The build adds its exact origin to `connect-src`. The browser value is public. Optional Unpaywall configuration belongs on the server.

Production builds include a CSP and referrer policy in `index.html`, and generate `out/_headers` for static hosts that support that file. Verify the actual HTTP response after activating a compatible host. GitHub Pages currently supplies HSTS for the public app. HTTP frame restrictions, `nosniff` and Permissions Policy require host support. The release remains a manual workflow and must verify the revision used to produce the deployed artifact. [Security assessment](docs/SECURITY-ASSESSMENT-0103.md)

After publishing, run `node scripts/smoke.mjs <published-url> <deployed-commit-sha>` from `research-atlas`. The browser reads the published build version and commit from HTML and rejects a mismatch. When no expected commit is supplied, older builds can report an unknown revision. To verify a local production preview, run `node scripts/smoke.mjs` with the preview running. Reports are written separately under `docs/smoke/`.

## Migration and release limits

No new custom domain or migration schedule is configured. Keep the existing GitHub Pages origin accessible; a future domain move must allow users to export the data owned by that origin before any redirect. An origin-transfer fixture is not evidence of a completed real-domain migration.

The manifest and existing install controls provide the web/PWA route. No signed Android bundle, permanent package ID, Digital Asset Links, store account or Play publication is configured. Physical-device and manual screen-reader verification must be recorded separately from emulation and automated scans. Do not add paid enrolment or domain registration as an implicit deployment step.

For a candidate release, run the repository checks, then inspect the actual workflow result and exact published revision. Smoke-test public paper search including the second page, local save/reload, backup restore and affected new flows. [PDF scope/status](docs/PDF-AUDIT-STATUS.md) distinguishes implemented code from pending release/device gates. Deployment success is recorded only after that verification.
