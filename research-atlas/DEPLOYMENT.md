# Deploy Research Atlas

The default release is a static Vite site for the public GitHub repository. Its build output is `research-atlas/out`, and relative asset URLs and hash navigation support the repository URL prefix. Hosting requires no credentials in the browser build. See the [GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

1. In [repository Pages settings](https://github.com/rishadamin001/research-tracker-app/settings/pages), set the publishing source to **GitHub Actions**.
2. From **Actions**, run **Publish Research Atlas to GitHub Pages** on `main`.
3. Open the URL printed by the deployment job. Create a test project, enter a question, reload, and check persistence. Run a short scholarly search and verify a DOI.

Project data belongs to its browser origin. Use **My projects → Download backup** on the local app and **Import backup** on Pages to move an existing workspace.

For a local production preview, run `npm ci`, `npm run build`, and `npm run preview`. The default preview address is http://127.0.0.1:4173.

## Optional gateway

The existing gateway is optional for organizations operating a verified free deployment. Set `VITE_API_URL` to its public origin if you intentionally use it. Configure gateway secrets on the server. The `VITE_` value is public and must contain only a URL. The default Pages build uses direct keyless OpenAlex and Crossref requests.
