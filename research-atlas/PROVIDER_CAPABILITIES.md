# Provider capabilities

OpenAlex: keyword phrase, starting year, OA-only filter, first 20 results, title/authors/year/DOI/source/OA-link normalization. AND/OR/NOT or parentheses are rejected in this release to avoid silently misleading query behavior. No pagination, institution/author filters, abstract reconstruction, or citation crawling yet.

Crossref: one normalized DOI lookup, title/publisher/ISSN/container, post-publication update signal if supplied. Not journal endorsement, complete retraction checking, APC verification, or indexing verification.

OA resolution: direct OpenAlex DOI lookup works without credentials. If VITE_API_URL is configured, the gateway uses Unpaywall with OPERATOR_EMAIL. No email is invented and no user email is collected for runtime searches.

Network failure/429 states are actionable; no automatic paid retry. UI uses a 15-second deadline; gateway uses 12 seconds and caps response at 2 MB. No persistent remote cache in v0.1, no automatic retry loop. User can retry manually or follow the official source.

Paper ordering can use OpenAlex field-weighted citation impact or citation count. For journals, Atlas requests OpenAlex sources by ISSN and uses metrics after the researcher confirms the exact source. Citation measures are distinct from official quartiles, index coverage, peer review, and research quality. Conference cards use dated organizer checks. Directory links offer live browsing and do not act as imported feeds.
