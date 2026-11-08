# Bounded search continuation

Version 0.8 offers **OpenAlex**, **Europe PMC** and **Crossref** as separate public, keyless searches. Each retrieves 20 records per manually requested page, up to five pages/100 records. OpenAlex supplies broad discovery; Europe PMC focuses on biomedical/life-science records using cursor continuation; Crossref searches publisher-deposited journal-article DOI records using offsets. Crossref's open-access filter is disabled because this search does not establish access status. Year and supported open-access filters are retained with the selected provider in history and query reuse. Missing abstracts, citation counts, publisher data and fees remain unavailable.

Quartile remains the default order for the retrieved set. Provider relevance is available when a closer topic match matters; changing the display sort does not fetch the provider's entire corpus. Citation counts have provider-specific coverage and retrieval dates. Google Scholar, PubMed, ResearchGate and Semantic Scholar links open the query externally, without importing results or bypassing their access controls. Reference files downloaded by the user can be imported through existing RIS/BibTeX exchange.

Loading feedback, added-record counts, new-batch navigation and explicit end/error states distinguish a pending request from a completed page. Earlier results remain available after a failed page. A quota value of zero does not become a permanent local block after its reported reset time; an actual later request can still fail under the provider's current limits. No automatic retry or background harvesting runs.

Checked 7 November 2026 against official OpenAlex documentation:

- [Basic and cursor pagination](https://help.openalex.org/api/paging/): basic `page`/`per_page` supports the first 10,000 results. Cursor continuation beyond the first cursor page requires a free API key.
- [Authentication and limits](https://help.openalex.org/api/authentication/): casual use can be keyless. The public Atlas app does not register accounts, attach a key or add a paid balance.
- [Citation recipes](https://help.openalex.org/how-to/api-recipes/): `cites:W…` retrieves citing records; `openalex:W…|W…` batch-resolves referenced records.

For OpenAlex, Atlas uses five manually requested basic pages of 20, capped at 100 records per search. No automatic page or retry loop runs. Search results retain the original and executed query, exact provider filters, retrieval timestamps, each page attempt, returned counts, reported total, Atlas parser version, available quota headers and failures. OpenAlex does not report a response schema version, so Atlas does not invent one. A failed page leaves earlier results available and can be retried; runs are capped at 25 page attempts.

Project search history is included in project backups. Without a project, the last 50 search-run records are stored in browser localStorage, including terms and result IDs (not full paper records); the UI offers exports and a clear-history action. Refresh compares IDs against the last successful matching query/filter snapshot. 'Newly discovered' means absent from that snapshot, not necessarily newly published. JSON preserves complete structured runs; CSV is a readable summary and neutralizes formula prefixes.

Basic paging is not a stable snapshot: the provider's relevance order may change between requests. Returned IDs are deduplicated for display. Ranking applies only to retrieved records. This cannot establish exhaustive coverage or a universally verified research gap.

Related-paper discovery is an explicit user action, capped at 20 records. It sends only OpenAlex IDs. It preserves quartile and citation metadata, and distinguishes suggestions from screened evidence. The saved-library citation map remains a separate local view.

No search result cache is claimed. Earlier results survive an error while that search view remains open; search history can reconstruct the query after reopening but does not restore full result cards. External provider availability and shared anonymous quota remain outside Atlas' control.
