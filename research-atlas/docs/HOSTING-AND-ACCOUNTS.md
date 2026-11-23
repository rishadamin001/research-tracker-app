# Where to host Atlas and when to add accounts

**Keep the current GitHub Pages site and guest workspace.** The current app can search, save, write and recover projects without a hosted account. A student who loses their laptop can recover work from an encrypted backup they kept on another device. Automatic recovery without a previously exported file would require an additional service and consent.

| Option | What changes for Atlas | Cost and operational decision |
| --- | --- | --- |
| GitHub Pages | Continue publishing the tested static build through the existing workflow. Browser storage stays at the current origin. | The public repository qualifies for Pages on GitHub Free. An owner site at the same origin could serve the Android association file. [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) |
| Cloudflare Pages and Workers | Pages can serve the static build. A Worker could run the existing optional provider gateway, protect a provider credential and enforce request limits. | Static and function requests have separate allowances. Assess free quotas and fail closed at the limit before enabling a service. [Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/) |
| Hostinger static hosting | Upload the built site to a supported hosting plan. Configure a fallback and test the project path, service worker, cache and headers. | A hosting subscription and a domain each have a renewal decision. Atlas currently gains little from moving the static files alone. [Website types](https://www.hostinger.com/support/1583214-how-to-add-a-website-in-hostinger/) |
| Hostinger with a backend | A supported managed Node plan could run a separate API. The current Worker would require a Node adapter, secret configuration, maintenance and tests. | Consider only after a concrete server feature justifies the ongoing cost. [Node deployment options](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) |

## What the services do

Domain registration gives control of a name. Hosting serves files. Backend execution runs code on requests. A database persists records. Authentication identifies an account, while authorization decides which records it may read or change. A scholarly API subscription grants a provider-specific allowance. Encryption protects data using keys. Monitoring detects failures and suspicious activity and requires decisions about log contents and retention. Android distribution adds signing, device testing, association, listing and review. Each is a separate responsibility.

## If cross-device recovery becomes a requirement

| Candidate | Identity and records | What to prove before adoption |
| --- | --- | --- |
| Supabase Auth and Postgres | An authenticated session identifies the user. Apply row-level security to every project and related record, including inserts and changes of ownership. Keep privileged credentials server-side. | Verify owner-only reads and writes with two accounts, logged-out access and deleted sessions. Review storage, database backups, retention and free-tier limits. [Auth](https://supabase.com/docs/guides/auth) · [Row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security) |
| Firebase Authentication and Firestore | Store records under an owner identity and validate ownership, fields and allowed operations in Security Rules. Trusted server code needs its own checks. | Exercise two-account isolation, unexpected fields, offline edits and quota exhaustion before choosing a billing plan. [Security Rules](https://firebase.google.com/docs/rules/basics) · [Pricing plans](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans) |

For a first pilot, compare **optional encrypted backup storage** before attempting automatic sync. Show the selected projects, destination and retention terms before uploading. Explain who holds the decryption key and how a lost passphrase affects recovery. Keep guest access, local export, session revocation, account deletion and removal of remote copies. Test how deletion interacts with backup retention. Keep unpublished research and paper-search terms out of diagnostic logs.

For editable sync, give every record a stable ID and revision. Require the server to compare the expected revision on writes, keep deletion markers and queue offline changes. When two edits diverge, keep both for inspection before merging. Test reconnects, duplicate requests, concurrent edits, interrupted writes, sign-out and changing accounts on a shared device.

## Moving an existing workspace

Keep the existing Pages address online. Rehearse with a synthetic project. Export an encrypted backup at the original origin, verify the file, open the candidate in a fresh browser profile, import as copies, and compare project counts, source links, notes and citations. Confirm Android downloads and restores separately. Offer this procedure before any change to the canonical address. Domain, hosting, account architecture and uploads each require a separate owner decision.
