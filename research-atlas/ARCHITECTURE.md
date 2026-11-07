# Architecture

Vite serves a React and TypeScript application. `Atlas` owns browser navigation, selected project and queued autosave. Planning, evidence and execution components update the same project. Home offers three intent-based entry points; the short beginner journey leads into project creation. `ContextGuide` places Understand / See / Do / Review guidance beside all ten project stages. `workflow.ts` derives task statuses and downstream review flags. Statuses record activity; they do not certify research quality.

`workspace-navigation.ts` maps legacy routes into six primary destinations and a common seven-tab project shell. Returning Home uses `ResearchDashboard`; contextual `NextAction` derives one action from current project state. Guided/Expert is a local preference controlling default guidance expansion. Project Overview contains the existing plan workbench.

## Local data and portable backups

`model.ts` validates the additive project schema (version 1). `storage.ts` writes the complete workspace in an IndexedDB transaction, and `Atlas` queues writes and exposes save failures with recovery export. `backup.ts` separately defines the version 2 portable envelope, app version, source origin, counts and SHA-256 integrity checksum. Validation precedes preview; import adds new project copies. Legacy version 1 backups remain readable. A checksum detects changes, not authenticity. [Backup/migration design](docs/BACKUP-MIGRATION.md)

The workspace envelope adds a revision checked within the replacement transaction. BroadcastChannel/storage notices pause stale clients; the transaction comparison remains authoritative. Local snapshots are bounded by count and size; corrupt projects are isolated without overwriting the original envelope. Restoring a snapshot temporarily blocks editing and must preserve the current workspace first. [Storage and recovery](docs/STORAGE-RECOVERY.md)

Each project reference stores metadata, user-authored extraction, screening events, evidence claims and citation IDs. Discovery, screening, extraction and writing reuse that record. `duplicates.ts` and `DuplicateReview` provide conservative candidate review, bounded audit archives and undo. References are still project-scoped; there is no shared cross-project bibliographic entity or cloud synchronization.

`atlas-library.ts` derives DOI/ID groups across these records. Atlas Library filters and organizes the grouped view and can explicitly copy bibliography into another project, resetting project judgments. Metadata conflicts are shown rather than silently reconciled. A canonical global reference schema/migration remains deferred. `research-trail.ts` records committed question versions and a bounded/coalesced project event stream through `updateProject`; saved question drafts remain distinct from committed wording. [Library](docs/ATLAS-LIBRARY.md) · [Trail](docs/RESEARCH-TRAIL.md)

## Discovery and evidence

`providers.ts` validates public scholarly metadata. The default static app calls anonymous OpenAlex and public Crossref directly. `search-provenance.ts` defines bounded basic page continuation and reconstructed search runs. Project logs travel with backups; standalone search keeps at most 50 local run records. Refresh compares IDs with a previous matching snapshot. Neither a permanent result cache nor exhaustive search is claimed. [Search continuation](docs/SEARCH-CONTINUATION.md)

Related-paper discovery explicitly retrieves up to 20 citation/reference suggestions from OpenAlex. It is distinct from the citation panel, which displays relationships among already-saved records. No private project notes or drafts are automatically submitted to scholarly services.

`evidence-ledger.ts` defines reusable screening criteria, stage-specific decision events and located claims. Events retain the criterion as applied. Claims distinguish evidence level, interpretation, uncertainty and review state, and can support or challenge a scoped gap candidate. A changed research question flags reviewed claims for another look.

## Planning and interoperability

`research-plan.ts` defines deadlines, budgets and submission drafts. `study-planning.ts` defines structured methods context, an abstaining conditional router, thirteen data-management prompts and separate sourced design/reporting/appraisal registries. Existing freeform plans remain available and are included in exports. `reference-exchange.ts` handles bounded local RIS/BibTeX parsing, recognized-field round trips and duplicate previews. External DMP Tool and OSF Registrations links are optional handoffs; Atlas does not submit registrations or create OSF Projects.

Publisher marks and the POSI journal index are bundled assets. Browser-local preferences and PWA shell caching require no runtime font service, account, hosted database, analytics or advertising. Public Privacy, Terms and Support routes are accessible without a project. [PDF implementation coverage](docs/PDF-AUDIT-STATUS.md)
