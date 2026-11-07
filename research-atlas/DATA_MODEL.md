# Data model

## Versions and storage

The project/IndexedDB schema remains **version 1**, with additive optional fields and defaults for older records. Portable exports use the independent **backup format version 2**. They contain `format`, `backupVersion`, `schemaVersion`, `appVersion`, `createdAt`, `sourceOrigin`, `projectCount`, validated projects, optional display preferences and an integrity checksum. Version 1 exports still import. Unknown format versions, malformed data, altered checksums and inconsistent version 2 counts are rejected before mutation. Imports assign new project IDs and preserve existing projects. Display preferences are shown in the preview but are not automatically applied. [Envelope and migration](docs/BACKUP-MIGRATION.md)

## Project records

Projects store profile, topic, question, objectives, design and ethics notes, analysis plans/records, manuscript and venue candidates. Each project owns references, searches, review flags, dated decisions, a budget/timeline/submission plan and optional structured methods and data-management fields. Existing `dataPlan` notes survive alongside `structuredDmp`.

A reference carries provider ID, optional normalized DOI, title, authors, year/full publication date, source and access URLs. Optional journal metrics include citation counts, publisher, ISSNs and a quartile's source/year/category/link. Reader access estimates and author publishing fees remain separate; new estimates carry a source URL and retrieval timestamp where supplied by Atlas' lookup. Missing values stay unknown. Imported older estimates can lack a check date.

The same reference carries screening decisions/reasons, stage-specific screening events, extracted fields, notes and evidence claims. Claims identify evidence level, source locator, interpretation, uncertainty, review status and supporting/challenging role. Question revisions retain earlier work and flag downstream stages/claims for review. Importing project copies retains internal reference relationships.

## Search and duplicate audit

A `SearchRun` retains original/executed query, filters, provider/default relevance, Atlas parser version, start/completion time, bounded page attempts, result IDs, reported match count, available quota fields and failures. Basic page continuation is capped at five pages of twenty records; up to 25 attempts permit bounded manual retries. OpenAlex does not report a response schema version. Standalone search records live separately in localStorage (latest 50), and are exported through the search UI rather than project backups. [Search semantics](docs/SEARCH-CONTINUATION.md)

Duplicate review stores up to 50 actions per project: source identities, action, time and the snapshots needed to preserve merged/removed information and undo. Exact DOI/ID prevention and fuzzy candidate review are different operations. Near matches are not automatically deleted. This is not a shared reference store or formal version graph.

Task status derives from recorded artifacts and is a planning aid. Legacy lesson IDs remain accepted for compatibility. Unit and browser verification results are documented separately in [Testing](TESTING.md).
