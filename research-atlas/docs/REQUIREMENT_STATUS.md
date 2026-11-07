# Competitive audit implementation status

This is the historical **0.5.0** matrix for the earlier pasted blueprint. The supplied PDF's newer requirements and the current **0.6.0** scope are tracked in [PDF audit implementation status](PDF-AUDIT-STATUS.md).

This release applies the foundation and evidence priorities of the November 2026 blueprint to Research Atlas. The legacy tracker is a separate app at the repository root.

| Requirement | Status | Current scope |
| --- | --- | --- |
| Direct literature search and ranking | IMPLEMENTED | Search without a project, explicit POSI source and edition, dates, citation counts, and available reading and APC price sorts. |
| Paid fallback prevention | IMPLEMENTED | Public Pages uses anonymous first-page OpenAlex and public Crossref. No key or billing mechanism is configured. |
| Server-side verified free key and cursor pagination | DEFERRED | The free-key account and billing state would need separate verification. |
| Search provenance | IMPLEMENTED | Project searches capture the user and executed queries, filters, mode, timing, result counts, pagination limits, and available quota details. |
| Screening and evidence ledger | IMPLEMENTED | Criteria, stage-aware decision history, Maybe, located claims with evidence level, and supporting and challenging evidence for the candidate gap. |
| Scoped gap model | PARTIAL | Evidence-supported status requires a reviewed supporting claim. Candidate status, evidence links and search limitations are available. Formal population, phenomenon, design and time-scope entities remain pending. |
| Reference interoperability | IMPLEMENTED | Local RIS and BibTeX exchange with preview, exact dedupe and conservative duplicate suggestions. |
| Global reference library and version history | DEFERRED | Existing project references remain the storage unit. |
| Graph and topic exploration | PARTIAL | The existing saved-citation view and discipline topics are available. Live seed expansion, topic clustering, and refresh deltas remain pending. |
| Beginner planning | IMPLEMENTED | Visual journey, data and surveys, tools, publishing checks, timelines, budget, submission pack and reviewer response tools. |
| Method design and standards | PARTIAL | Conditional guidance and reporting links are available. Separate versioned design, reporting and appraisal registries remain pending. |
| Venue fee verification | PARTIAL | OpenAlex list APC estimates preserve amount, currency, attribution and unknown state. Confirmed publisher fees and waiver terms require a manual check. |
| Conference verification | PARTIAL | Organizer-linked listings and calendar export remain available. Conflict reconciliation and broader source intake remain pending. |
| Backups, recovery and privacy | IMPLEMENTED | Version 1 backups retain newer fields and restore as copies. Backup download date, storage information and recovery export are visible. |
| Unified project event ledger | PARTIAL | Question revisions, searches, evidence and screening have records. A unified view and additional event sources remain pending. |
| Disciplinary content governance | PARTIAL | Educational source links and coverage notes are available. Independently reviewed discipline registries remain pending. |
| Browser accessibility and smoke checks | PARTIAL | See [Testing](../TESTING.md) for the tested matrix. WebKit and complete manual accessibility coverage remain pending. |
