# Privacy

Effective 7 November 2026. Public page: [Privacy & data](https://rishadamin001.github.io/research-tracker-app/#privacy). Maintained through [rishadamin001/research-tracker-app](https://github.com/rishadamin001/research-tracker-app). General privacy/support questions can be raised on the public issue tracker without sensitive details; a private support address is not configured.

Project questions, notes, evidence extraction, and protocols are stored in browser IndexedDB. No app account, central project server, or analytics is used. There is no application-level encryption. Anyone with access to the browser profile may access the data. Clearing browser storage can erase it.

Standalone Paper search stores the last 50 query records in localStorage, including entered terms, filters, timestamps and provider response details. Its Clear search history button removes those records. Project search logs remain with their project and backup. Related-paper discovery sends the seed work identifier or reference identifiers to OpenAlex only when the user requests it.

Paper searches and related lookups send keywords, filters, DOI, work IDs or ISSNs to OpenAlex as applicable. Crossref receives the DOI when you request bibliographic verification. An optional independently operated gateway may send a DOI to Unpaywall. GitHub Pages receives ordinary connection metadata. External-link destinations have their own policies. Keep private project notes, draft text and participant information out of search terms.

Back up regularly and use one editing tab. Imported backups are validated and added as new copies. Backups and reference exports can contain private information you entered. Deleting a project removes its local workspace record. Manage downloaded copies separately. The Privacy & data screen can ask the browser for persistent storage and display its response.

Research Atlas does not use product analytics, advertising SDKs, marketing cookies, or an Atlas-operated logging server in this public release. GitHub Pages and external scholarly providers receive ordinary web connection information and apply their own retention policies. Their processing may occur outside your country. See [GitHub privacy](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement), [OpenAlex privacy](https://openalex.org/OpenAlex_privacy_policy.pdf), and [Crossref privacy](https://www.crossref.org/privacy/).

Browser site-data controls remove the site's local workspace, preferences, and cached app resources. Downloaded backups remain until removed separately. No central Atlas copy exists. HTTPS and validated imports reduce some risks but do not guarantee security. Policy changes are dated and recorded in repository history. See [Terms](TERMS.md), [Support](SUPPORT.md), and [Backup migration](docs/BACKUP-MIGRATION.md).
