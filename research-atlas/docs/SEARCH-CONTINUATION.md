# Bounded search continuation

Version 0.8 offers **OpenAlex**, **Europe PMC** and **Crossref** as separate public, keyless searches. Each retrieves 20 records per manually requested page, up to five pages/100 records. OpenAlex supplies broad discovery; Europe PMC focuses on biomedical/life-science records using cursor continuation; Crossref searches publisher-deposited journal-article DOI records using offsets. Crossref's open-access filter is disabled because this search does not establish access status. Year and supported open-access filters are retained with the selected provider in history and query reuse. Missing abstracts, citation counts, publisher data and fees remain unavailable.

Discover starts in provider relevance order unless a saved preference applies. Sorting the retrieved set by quartile, citations or date leaves the provider query unchanged. Citation counts have provider-specific coverage and retrieval dates. Google Scholar, PubMed, ResearchGate and Semantic Scholar links open the query externally. Downloaded reference files can be imported through RIS/BibTeX exchange.

The two page controls share one request. A successful continuation shows the new batch, while **Show all retrieved papers** restores the full list. Earlier results remain available after a failed or canceled page. Record IDs and DOIs prevent repeated papers in the same run. A quota value of zero stops requests until the reported reset when one is available.

Each tab runs one discovery request at a time per provider and spaces request starts. The action deadline is 18 seconds including waiting, retrieval, and any retry. Per-attempt timeouts are 8 seconds for OpenAlex, 12 for Europe PMC, and 10 for Crossref. After a short transient failure, Atlas may try the same request once, with bounded backoff and jitter. A long `Retry-After` or exhausted daily quota is shown as a wait. Atlas keeps the user's provider and never fetches the next page until requested. [OpenAlex error handling](https://help.openalex.org/api/errors/) · [Crossref list-request limits](https://community.crossref.org/t/refining-rest-api-limits-for-improved-stability-and-reliability/16137)

Checked 7 November 2026 against official OpenAlex documentation:

- [Basic and cursor pagination](https://help.openalex.org/api/paging/): basic `page`/`per_page` supports the first 10,000 results. Cursor continuation beyond the first cursor page requires a free API key.
- [Authentication and limits](https://help.openalex.org/api/authentication/): casual use can be keyless. The public Atlas app does not register accounts, attach a key or add a paid balance.
- [Citation recipes](https://help.openalex.org/how-to/api-recipes/): `cites:W…` retrieves citing records; `openalex:W…|W…` batch-resolves referenced records.

For OpenAlex, Atlas uses five manually requested basic pages of 20, capped at 100 records per search. Search details retain the original and executed query, exact provider filters, retrieval timestamps, page actions, returned counts, reported total, Atlas parser version, available quota headers and failures. One page action can use two network requests. The recorded attempt count distinguishes that retry from an additional page. Runs are capped at 25 page actions.

Project search history is included in project backups. Without a project, the last 50 search-run records are stored in browser localStorage, including terms and result IDs (not full paper records); the UI offers exports and a clear-history action. Refresh compares IDs against the last successful matching query/filter snapshot. 'Newly discovered' means absent from that snapshot, not necessarily newly published. JSON preserves complete structured runs; CSV is a readable summary and neutralizes formula prefixes.

Basic paging is not a stable snapshot: the provider's relevance order may change between requests. Returned IDs are deduplicated for display. Ranking applies only to retrieved records. This cannot establish exhaustive coverage or a universally verified research gap.

Related-paper discovery is an explicit user action, capped at 20 records. It sends only OpenAlex IDs. It preserves quartile and citation metadata, and distinguishes suggestions from screened evidence. The saved-library citation map remains a separate local view.

Atlas can reuse a validated continuation page from the same run for five minutes while the tab is open. The in-memory cache holds up to 12 small pages and records when each was retrieved. A new search or manual refresh makes a fresh request. After reopening, search history can reconstruct the query. Saved references remain available locally.

The earlier live check recorded OpenAlex HTTP 429. On 17 November 2026 Asia/Dhaka, a single anonymous request for “Hypothyroidism” succeeded from a different network. The two observations establish intermittent throttling across the tested contexts. They do not identify which quota or rate limit caused the earlier response. The public client uses no private key. Deterministic app checks and independent live-provider health checks report their own results.
