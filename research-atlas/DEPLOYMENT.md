# Deploy Research Atlas

The default release is a static Vite site for the public GitHub repository. Its build output is `research-atlas/out`, and relative asset URLs and hash navigation support the repository URL prefix. Hosting requires no credentials in the browser build. See the [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

1. In [repository Pages settings](https://github.com/rishadamin001/research-tracker-app/settings/pages), set the publishing source to **GitHub Actions**.
2. From **Actions**, run **Publish Research Atlas to GitHub Pages** on `main`.
3. Open the URL printed by the deployment job. Create a test project, enter a question, reload, and check persistence. Run a short scholarly search and verify a DOI.

Project data belongs to its browser origin. Use **My projects → Download backup** on the local app and **Import backup** on Pages to move an existing workspace.

For a local production preview, run `npm ci`, `npm run build`, and `npm run preview`. The default preview address is http://127.0.0.1:4173.

## Optional gateway

The default Pages build uses direct anonymous OpenAlex and public Crossref requests. OpenAlex discovery retrieves the first page. A verified-key gateway remains deferred. The existing template is available for independently operated deployments and keeps OpenAlex anonymous. Set `VITE_API_URL` only if you intentionally operate a gateway. The browser value is public and should contain only a URL. Optional Unpaywall configuration belongs on the server.

After publishing, run `node scripts/smoke.mjs <published-url> <commit-sha>` from `research-atlas`. To verify a local production preview, run `node scripts/smoke.mjs` with the preview running. The two reports are written separately under `docs/smoke/`.
