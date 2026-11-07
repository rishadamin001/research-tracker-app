# Zero-cost policy

The default release runs as a static app on GitHub Pages for a public repository. Projects and backups stay in the browser. Atlas uses anonymous OpenAlex and Crossref for its public scholarly lookups, with no account, API key, payment method, or hosted database required. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) · [Provider capabilities](PROVIDER_CAPABILITIES.md)

Free allowances are finite and may change. Atlas offers manually requested basic OpenAlex pages, capped at 100 retrieved records per run, and public source links when a request fails. Related-paper discovery is bounded to 20 records per action. When OpenAlex sends a readable `Retry-After`, the app waits for manual search until that time. Known exhausted allowance with a readable reset time blocks search and related discovery until reset. No automatic page/retry loop runs. The software never automatically enables paid fallback, purchases credits, or subscribes to a paid plan. [OpenAlex authentication and limits](https://help.openalex.org/api/authentication/)

Source code cannot establish account-level billing configuration. The optional gateway is outside the default deployment and sends anonymous OpenAlex requests. Deploy it only after separately verifying a free hosting account with spending protection. A verified-free-key gateway is deferred until the operator can confirm account status and enforce a free-only budget. The active Pages release works without a gateway or an OpenAlex key.

Paper access and journal publishing charges are external publisher costs. A price shown in Atlas is informational. The app collects no payment. [Reading and publishing costs](docs/PUBLICATION-COSTS.md)

The conditional methods router, evidence review, duplicate handling, backup integrity, and structured DMP run on the device without AI calls. DMP Tool, OSF Registrations and other tools are optional external links; their accounts or paid features are not requirements for the core app.

No custom-domain purchase, paid developer enrolment, store publication or new server is included in the 0.6.0 code changes. The existing free web/PWA path remains the deployment target. [Implemented and deferred PDF scope](docs/PDF-AUDIT-STATUS.md)
