# Architecture

## Interface and onboarding in 0.13

The workspace shell owns navigation. The orientation controller highlights semantic `data-tour` targets and follows layout changes. The spotlight is nonmodal, so a learner can operate the highlighted control. Dialogs use the browser's modal behavior for actions that need a decision. Local tutorial keys are independent of project storage, encrypted backups and practice progress.

Shared tokens, touch sizes and reduced-motion rules live in `src/app/interface.css`. Discover owns the existing provider and pagination state. Its dialogs present filters, external links, paper details and search activity. Search tips open in a nonmodal help panel.

Using React and Lucide already shipped with the application keeps the tour offline and introduces no additional runtime license, remote script or stylesheet. Driver.js offers configurable popovers and targets, but Atlas would still need its own project-state and mobile-navigation integration. [Driver configuration](https://driverjs.com/docs/configuration) · [Native dialogs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)

The filter chips take inspiration from Linear's visible search criteria. Keeping paper metadata, notes and citations distinct follows a familiar reference-manager workflow. [Linear filters](https://linear.app/docs/filters) · [Zotero basics](https://www.zotero.org/support/quick_start_guide)

## Source layout

The active web application, optional gateway and Android wrapper all live in the repository's `research-atlas/` directory. The root `client/` and `server/` directories contain the earlier app. The [Android wrapper](android/README.md) launches the existing website using the device's browser. Study data belongs to the browser profile and origin. The [hosting and accounts proposal](docs/HOSTING-AND-ACCOUNTS.md) describes future options.

- `src/main.tsx` starts the React client. `src/components/workspace/Atlas.tsx` coordinates navigation, project selection, and saves.
- `src/components/` groups client components by feature. Each named React component has its own `.tsx` file. Related stylesheet and type files live with the feature. Shared controls live under `src/components/shared/`.
- `src/lib/` contains research models, browser storage, scholarly provider clients, and import and export logic.
- `gateway/worker.ts` is the optional Cloudflare Worker entry. `gateway/src/handler.ts` routes requests, `gateway/src/providers/` owns provider-specific validation and URLs, and `gateway/src/http/` handles response policies and upstream forwarding. The static GitHub Pages app can run directly with the scholarly providers.

Vite serves a React and TypeScript application. `Atlas` owns browser navigation, selected project and queued autosave. Planning, evidence and execution components update the same project. Home offers three intent-based entry points; the short beginner journey leads into project creation. `ContextGuide` retains optional Understand / See / Do / Review help while task groups provide inline guidance. `workflow.ts` derives task statuses and downstream review flags. Statuses record activity; they do not certify research quality.

`workspace-navigation.ts` maps legacy routes into six primary destinations and a common seven-tab project shell. Returning Home uses `ResearchDashboard`; contextual `NextAction` derives one action from current project state. Step-by-step guidance and Focus workspace retain the stored `guided`/`expert` preference values. `TaskSteps` shows one task group or all groups using the same fields, preserving drafts across mode changes. `research-pathway.ts` supplies reversible optional pathway examples. Project Overview contains the plan workbench and completeness review.

## Local data and portable backups

`model.ts` validates the additive project schema (version 1). `storage.ts` writes the complete workspace in an IndexedDB transaction, and `Atlas` queues writes and exposes save failures with recovery export. `backup.ts` separately defines the version 2 portable envelope, app version, source origin, counts and SHA-256 integrity checksum. Validation precedes preview; import adds new project copies. Legacy version 1 backups remain readable. A checksum detects changes, not authenticity. [Backup/migration design](docs/BACKUP-MIGRATION.md)

The local workspace envelope now uses `schemaVersion: 2`, independently of project schema 1, portable backup format 2 and IndexedDB version 1. Version 1 workspace envelopes remain readable; a changed save or snapshot restore writes version 2. This format boundary makes version 0.7 readers refuse newer records instead of stripping added fields. All older loaded tabs must be closed or reloaded after an update; newer backups should not be imported into an older application. Workspace revisions are checked within the replacement transaction. BroadcastChannel/storage notices pause stale clients; the transaction comparison remains authoritative. Local snapshots are bounded by count and size; corrupt projects are isolated without overwriting the original envelope. Restoring a snapshot temporarily blocks editing and must preserve the current workspace first. [Storage and recovery](docs/STORAGE-RECOVERY.md)

Each project reference stores metadata, user-authored extraction, screening events, evidence claims and citation IDs. Discovery, screening, extraction and writing reuse that record. `duplicates.ts` and `DuplicateReview` provide conservative candidate review, bounded audit archives and undo. References are still project-scoped; there is no shared cross-project bibliographic entity or cloud synchronization.

`atlas-library.ts` derives DOI/ID groups across these records. Atlas Library filters and organizes the grouped view and can explicitly copy bibliography into another project, resetting project judgments. Metadata conflicts are shown rather than silently reconciled. A canonical global reference schema/migration remains deferred. `research-trail.ts` records explicitly committed question versions and a bounded/coalesced project event stream through `updateProject`; autosaved question drafts remain distinct from committed wording, and navigation does not commit. [Library](docs/ATLAS-LIBRARY.md) · [Trail](docs/RESEARCH-TRAIL.md)

## Discovery and evidence

`providers.ts` validates OpenAlex metadata and DOI verification. `additional-search.ts` handles public Europe PMC cursor search and Crossref journal-article offset search; `search-publications.ts` dispatches provider-specific requests and restores supported filters. The static app makes these requests directly without a key or billing setup. `search-provenance.ts` bounds each provider to five manually requested pages of 20 and reconstructs search runs. Project logs travel with backups; standalone search keeps at most 50 local run records. Refresh compares IDs with a previous matching provider/query/filter snapshot. Neither a permanent result cache nor exhaustive search is claimed. [Search continuation](docs/SEARCH-CONTINUATION.md)

Related-paper discovery explicitly retrieves up to 20 citation/reference suggestions from OpenAlex. It is distinct from the citation panel, which displays relationships among already-saved records. No private project notes or drafts are automatically submitted to scholarly services.

`evidence-ledger.ts` defines reusable screening criteria, stage-specific decision events and located claims. Events retain the criterion as applied. Claims distinguish evidence level, interpretation, uncertainty and review state, and can support or challenge a scoped gap candidate. A changed research question flags reviewed claims for another look.

`EvidenceDesk` reuses these records in a source list, inspection pane and comparison view, mounting up to 20 source rows at a time. Source/claim links hand off to Writing Studio; unsaved claim forms guard navigation. `research-readiness.ts` derives completeness prompts and a bounded Research Passport, not a scientific-quality score or a restore format. Public abstracts are optional provider metadata; no full-text extraction or AI summary runs.

`writing-studio.ts` defines optional structured sections, stable numbered bibliography snapshots and located-evidence snapshots, with unresolved-source and changed-record prompts. Earlier `manuscript` text remains separate. `WritingStudio` exposes explicit insertion and metadata refresh; `writing-docx.ts` creates a minimal Office Open XML package locally. Markdown, DOCX, cited RIS/BibTeX and evidence-link JSON exports require no conversion service. [Writing design and limits](docs/WRITING-STUDIO.md)

## Planning and interoperability

`research-plan.ts` defines deadlines, budgets and submission drafts. `study-planning.ts` defines structured methods context, an abstaining conditional router, thirteen data-management prompts and separate sourced design/reporting/appraisal registries. Existing freeform plans remain available and are included in exports. `reference-exchange.ts` handles bounded local RIS/BibTeX parsing, recognized-field round trips and duplicate previews. External DMP Tool and OSF Registrations links are optional handoffs; Atlas does not submit registrations or create OSF Projects.

Publisher marks and the POSI journal index are bundled assets. Browser-local preferences and PWA shell caching require no runtime font service, account, hosted database, analytics or advertising. Public Privacy, Terms and Support routes are accessible without a project. [PDF implementation coverage](docs/PDF-AUDIT-STATUS.md)
