# Changelog

## 0.9.0 — 2026-11-09

Added interest-first beginner exploration with real paper examples, provider-specific search filters, relevance-first discovery respecting saved preferences, and explicit page retry with retained earlier results. Quartile, citation, date and available price sorts remain.

Added article-backed Journal Match with conservative ISSN or title-and-publisher grouping, supporting-article provenance, separate subject-fit and quartile indicators, and explicit optional fee lookup. Conference discovery distinguishes curated events from external directories and unverified personal leads. Unknown prices remain unknown.

Workspace envelope 3 preserves new drafts and provenance while reading versions 1 and 2. Backup import/export now waits for initial storage loading, preventing an import from being overwritten during startup. No paid services, credentials or billing setup were added. See [readiness and verification](docs/READINESS-090.md).

## 0.8.0 — 2026-11-08

Added task-based **Step-by-step guidance** and **Focus workspace** using the same saved fields. Question drafts autosave separately; only **Save question revision** commits wording and flags downstream work. Optional quantitative, qualitative, mixed-methods and literature pathways adapt examples without deleting earlier answers.

Added the connected Evidence Desk for inspecting, screening and recording located findings, a completeness review, and Markdown/JSON Research Passport exports. Writing Studio stores six section drafts, deliberate citation and located-evidence links, bibliography snapshots and review prompts. Markdown, minimal DOCX, cited RIS/BibTeX and evidence-link exports stay on the device; earlier freeform manuscripts remain available.

Paper search adds free, keyless Europe PMC and Crossref choices alongside OpenAlex, plus official-site query links. Searches retain provider-specific filters and page history, with explicit loading, added-record, retry and end states. Each provider is bounded to 20 records per page and five manually requested pages. Quartile sorting, publisher marks, citation counts, date ordering and separate access/APC estimates remain; unavailable metadata stays unavailable.

Changed the local workspace envelope to version 2 so version 0.7 clients refuse newer records instead of dropping added fields. Version 1 workspaces remain readable and upgrade on the next changed save. Portable backup format remains 2, project schema remains 1, and IndexedDB remains version 1. Reload all older tabs after updating, retain a downloaded backup, and do not use an older app to import a newer backup. [Migration details](docs/BACKUP-MIGRATION.md)

The [professional standards audit status](docs/PROFESSIONAL-AUDIT-STATUS.md) separates delivered source behavior from remaining validation. Release checks and deployment verification are recorded in [Testing](TESTING.md); this entry does not claim a completed run. No paid runtime, API key, subscription, billing account or hosted database is added.

## 0.7.0 — 2026-11-08

Reorganized navigation into Home, My Research, Discover, Library, Learn and Publish. Projects keep one seven-tab shell. Returning Home shows the current question, actual pending work and a next useful action; My plan now lives under project Overview. Guided/Expert mode persists with display preferences, and short visual lessons lead back to workspace actions.

Added the cross-project Atlas Library view with DOI grouping, tags, reading states and explicit project linking that keeps screening and evidence judgments separate. Added committed question versions, reasons and affected-work snapshots, a bounded project event history with exports/source links, and a search notebook with query reuse. Provider citation metadata now includes its retrieval date.

Added revision-checked workspace saves, stale-tab write protection, bounded rolling recovery snapshots and corrupted-record isolation with original-data export. Existing v1 projects and v1/v2 backups remain supported. Downloaded backups are still required for recovery outside this browser. Reload older tabs after upgrading.

See the [deep blueprint status](docs/DEEP-BLUEPRINT-STATUS.md) for delivered boundaries and later releases. The Library is currently a derived view over project references, not a canonical global table. No paid runtime, AI provider or new hosted service is added.

## 0.6.0 — 2026-11-07

Simplified Home to three intentions and reduced initial project setup to a working title, discipline, goal and experience. The beginner path shows a compact research journey, worked example and next useful action.

Added manually requested OpenAlex continuation up to 100 records, page/query provenance, standalone local search history, CSV/JSON logs, explicit stop/resume, refresh snapshots and related-paper lists. Existing quartiles, publisher marks, citation counts, date ordering and separate access/APC estimates remain. Basic pages are not stable snapshots or exhaustive searches; no API key or paid balance is configured.

Added side-by-side duplicate review with keep/merge choices, provenance, archived records and undo. Added a conditional methods planner that abstains when essential context is missing, separate sourced design/reporting/appraisal registries, a structured exportable data management plan, optional preregistration handoffs, and venue facts/warning/unknown assessment.

Backup format v2 records app version, source origin, counts, validated preferences and a checksum; old version 1 backups remain supported and restore as new copies. Added storage diagnostics, public Terms and Support routes, and migration instructions. Browser database/project schema remains version 1 with additive fields. No custom-domain move, Android store publication or physical-device verification is claimed.

See the [PDF audit implementation matrix](docs/PDF-AUDIT-STATUS.md) for the scope and deferred requirements, and [Testing](TESTING.md) for checks actually completed. No paid runtime dependency, account requirement, analytics or AI service is added.

## 0.5.0 — 2026-11-07

Added a standalone Paper search page with newest and oldest ordering, reading access, and estimated journal publishing fees. Expanded the Research Guide into a visual Research Planner with a data and survey walkthrough, toolkit, publication checks, and project-specific timelines, budgets, submission drafts and reviewer replies. The evidence matrix now records the study problem and dataset.

Search records show executed queries and anonymous coverage. Screening keeps a criterion and decision history. Evidence claims include a source level and locator and can support or challenge a candidate gap. Added local RIS and BibTeX exchange, explicit POSI badges, and privacy and backup recovery controls.

## 0.4.0 — 2026-11-06

Literature results default to POSI journal quartile order. Result cards show the publication, publisher, ranking subject and edition, and the OpenAlex citation count. Discipline topics launch searches in one tap. The app is installable and its workspace can reopen offline after the first online visit.

## 0.3.0 — 2026-11-06

Added a visual research guide, conference tracker and calendar exports, transparent OpenAlex sorting for papers and journals, and saved display preferences. Updated workspace navigation, color, density, and section transitions.

## 0.2.0 — 2026-11-06

Reorganized Atlas around a persistent project roadmap. Added a short starter exercise, profile and topic planning, screening reasons and decision history, evidence comparison, citation connections, data and analysis records, a manuscript draft, and a publication shortlist. A revised question flags prior work for review. The Vite build supports GitHub Pages and imports previous backups.

## 0.1.1 — 2026-11-06

Removed Research Foundations navigation, lessons, and homepage promotion. External references now use same-tab navigation and include copy-link/fallback controls. Corrected OpenLearn and PRISMA URLs, switched the blocked OpenAlex website fallback to Crossref metadata search, and updated the Scopus directory URL. OA resolution now works directly through the OpenAlex API without gateway credentials. Added desktop/mobile link regression checks.

## 0.1.0 — 2026-11-06

Initial local-first Research Atlas implementation: responsive workspace, six discipline packs, lessons, question builder, conditional design router, public search, extraction matrix, scoped contribution notes, journal identity lookup, protocol export, and backup/restore. Optional gateway prepared. Added behavioral unit/E2E checks and corrected modal focus containment. Public deployment remains pending account verification.
