# Version 0.9 readiness update (verification in progress)

This update responds to the supplied 0.8 Professional Readiness Review. It remains a public beta; no paid infrastructure, subscriptions or API credentials were added.

- Discovery defaults to provider relevance unless a user saved a different sort. Journal quartiles, publisher identities, citation counts, dates and available price sorts remain available. Sorting applies to retrieved records, not the entire database.
- Provider-specific document/source filters are recorded in search history and reused during paging. Unsupported filters are explicit. Failed page attempts preserve earlier records and expose retry and official-provider links. Network failures do not invent an unreadable HTTP status.
- Beginner exploration starts with interests, an approach and real OpenAlex records. Search groups are query-based examples, not automatically established research gaps. A formal question is optional and remains an uncommitted draft when creating a project.
- Conference discovery distinguishes the finite curated list from external official directories. A saved directory lead remains a personal, unverified event until checked against its organizer.
- Journal Match prepares editable keywords locally, retrieves related articles and groups journals by overlapping supplied ISSNs. Suggestions are ranked by supporting article count and provider relevance positions. Quartile is separate from subject fit. Explicit identity lookup exposes provider-reported metadata and listed APCs; unknown fees remain unknown. Current scope, accepted article types, indexing and fee waivers still need manual checks.
- Shortlisted suggestions retain their supporting articles, query and retrieval date. Existing manual journal checks remain separate.

The app does not scrape Google Scholar or ResearchGate. It provides query links to them and uses public scholarly APIs for embedded results. External access restrictions can still interrupt live requests; this release adds recovery and observability, not a guarantee of third-party availability.

## Verification limits

Automated checks use synthetic research records. They do not replace independent academic review, novice-user studies, physical Android testing, manual screen-reader testing or a security audit. A DOCX ZIP/XML check is not evidence of actual Word rendering. Deployment and live-test results must be recorded after completion; this document does not claim they have passed.
