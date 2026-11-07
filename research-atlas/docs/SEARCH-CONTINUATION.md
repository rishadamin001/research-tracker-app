# Bounded search continuation

Checked 7 November 2026 against official OpenAlex documentation:

- [Basic and cursor pagination](https://help.openalex.org/api/paging/): basic `page`/`per_page` supports the first 10,000 results. Cursor continuation beyond the first cursor page requires a free API key.
- [Authentication and limits](https://help.openalex.org/api/authentication/): casual use can be keyless. The public Atlas app does not register accounts, attach a key or add a paid balance.
- [Citation recipes](https://help.openalex.org/how-to/api-recipes/): `cites:W…` retrieves citing records; `openalex:W…|W…` batch-resolves referenced records.

Atlas uses five manually requested basic pages of 20, capped at 100 records per search. No automatic page or retry loop runs. Search results retain the original and executed query, exact provider filters, retrieval timestamps, each page attempt, returned counts, reported total, Atlas parser version, available quota headers and failures. OpenAlex does not report a response schema version, so Atlas does not invent one. A failed page leaves earlier results available and can be retried; runs are capped at 25 page attempts.

Project search history is included in project backups. Without a project, the last 50 search-run records are stored in browser localStorage, including terms and result IDs (not full paper records); the UI offers exports and a clear-history action. Refresh compares IDs against the last successful matching query/filter snapshot. 'Newly discovered' means absent from that snapshot, not necessarily newly published. JSON preserves complete structured runs; CSV is a readable summary and neutralizes formula prefixes.

Basic paging is not a stable snapshot: the provider's relevance order may change between requests. Returned IDs are deduplicated for display. Ranking applies only to retrieved records. This cannot establish exhaustive coverage or a universally verified research gap.

Related-paper discovery is an explicit user action, capped at 20 records. It sends only OpenAlex IDs. It preserves quartile and citation metadata, and distinguishes suggestions from screened evidence. The saved-library citation map remains a separate local view.

No search result cache is claimed. Earlier results survive an error while that search view remains open; search history can reconstruct the query after reopening but does not restore full result cards. External provider availability and shared anonymous quota remain outside Atlas' control.
