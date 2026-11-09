# Version 0.9 readiness update

This update responds to the supplied 0.8 Professional Readiness Review. It remains a public beta; no paid infrastructure, subscriptions or API credentials were added.

- Discovery defaults to provider relevance unless a user saved a different sort. Journal quartiles, publisher identities, citation counts, dates and available price sorts remain available. Sorting applies to retrieved records, not the entire database.
- Provider-specific document/source filters are recorded in search history and reused during paging. Unsupported filters are explicit. Failed page attempts preserve earlier records and expose retry and official-provider links. Network failures do not invent an unreadable HTTP status.
- Beginner exploration starts with interests, an approach and real OpenAlex records. Search groups are query-based examples, not automatically established research gaps. A formal question is optional and remains an uncommitted draft when creating a project.
- Conference discovery distinguishes the finite curated list from external official directories. A saved directory lead remains a personal, unverified event until checked against its organizer.
- Journal Match prepares editable keywords locally, retrieves related articles and groups journals by overlapping supplied ISSNs, or exact normalized title and publisher when ISSNs are missing. Records without either identity basis are omitted. Suggestions are ranked by the sum of inverse provider positions of supporting articles. Quartile is separate from subject fit. Explicit identity lookup exposes provider-reported metadata and listed APCs; unknown fees remain unknown. Current scope, accepted article types, indexing and fee waivers still need manual checks.
- Shortlisted suggestions retain their supporting articles, query and retrieval date. Existing manual journal checks remain separate.
- Backup import and export wait until the initial workspace load finishes. A delayed-storage regression checks that an imported project remains selected and survives reload. Workspace envelope 3 reads prior envelopes 1 and 2; portable backup format remains 2.

The app does not scrape Google Scholar or ResearchGate. It provides query links to them and uses public scholarly APIs for embedded results. External access restrictions can still interrupt live requests; this release adds recovery and observability, not a guarantee of third-party availability.

## Verification limits

Automated workflow checks use synthetic research records. The connected scenario creates a question, searches, saves and screens a paper, records a located claim, cites it in Writing Studio, exports DOCX and restores a downloaded backup. The resulting DOCX was also opened in installed Microsoft Word Protected View: title, citation, bibliography and source-location appendix rendered. This is bounded rendering evidence, not exhaustive Word compatibility.

Independent academic review, novice-user studies, physical Android testing, manual screen-reader testing and an independent security audit remain unverified. Crossref can return HTTP 429 or a browser-visible network/CORS failure; app recovery preserves earlier records but cannot guarantee provider availability. See [Testing](../TESTING.md) for exact release checks and deployment evidence.
