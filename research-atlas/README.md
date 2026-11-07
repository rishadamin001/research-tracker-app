# Research Atlas

A browser-local research workspace for students and early-career researchers. A project roadmap connects research planning, literature, study records, writing, and publication checks. Short examples and guidance appear beside each activity.

## Run

Open [Research Atlas on GitHub Pages](https://rishadamin001.github.io/research-tracker-app/). To install it, open **Preferences → Install app** in a supported browser. On iPhone or iPad, use Safari’s **Share → Add to Home Screen**.

For local development, use Node.js 24. Run `npm ci` and `npm run dev`, then open http://127.0.0.1:5174. For the production build, run `npm run build` and `npm run preview`, then open http://127.0.0.1:4173.

## Workflow

- Start from one of three homepage intentions: new to research, already have a topic/question, or need papers. The short guided path leads into a minimal project form. Create a project with your field, experience, and goal. Shortlist topics and document a question and objectives.
- Search OpenAlex, save each source once, record screening reasons, and compare methods, findings, and limitations. Review possible duplicates side by side and explore bounded citation/reference suggestions beyond the saved-library citation view.
- Plan methods and ethics, record data management and analysis, and draft a manuscript with citations from the saved library.
- Shortlist journals, document checks and fees, and look up DOI metadata and open-access locations. Task status records progress through the workspace.
- Download backups from My projects. Import restores copies, and new exports use backup v2 with source origin and integrity checksum. Previous version 1 backups receive defaults for new fields. Data is scoped to the browser origin, so export and import when moving from the local preview to Pages.

See [Workflow specification](WORKFLOW.md), [Architecture](ARCHITECTURE.md), and [Deployment](DEPLOYMENT.md). Scholarly search uses [OpenAlex](https://help.openalex.org/api/authentication/) and DOI metadata uses [Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/).

See the [PDF audit implementation status](docs/PDF-AUDIT-STATUS.md) and [earlier blueprint status](docs/REQUIREMENT_STATUS.md) for completed and deferred blueprint items. Use **Privacy & data** to see what is shared with providers and manage local backups.

## Research planner, conferences, and literature search

- **Paper search** works before you create a project. Compare results by journal quartile, citations, publication date, reading price or estimated open-access publishing fee. Load additional pages manually up to 100 records; export query history or refresh a matching search to compare discovered IDs. Prices without a source stay unavailable. [Search limits and history](docs/SEARCH-CONTINUATION.md) · [How prices are sourced](docs/PUBLICATION-COSTS.md)
- **Research planner** introduces the journey from idea through peer review, data and survey design, beginner-friendly tools, and publishing checks. Under **My plan**, set a deadline, work backward, record a budget and venue requirements, draft a submission pack, and export point-by-point reviewer replies. The original guide is under **Research basics**.
- **Conference planner** separates events held in Bangladesh from events abroad. Browse organizer-checked listings, save or enter events, and choose an event date or deadline for Google Calendar or a standard `.ics` export. The upcoming view follows the device date. Organizer links and source check dates show when to recheck a listing. Exported calendar events are copies. Date changes at the source require updating the calendar entry.
- **Explore disciplines** launches a literature search from a discipline or topic in one click.
- **Literature results** default to journal quartile (Q1 to Q4, then unavailable) with OpenAlex citation count as the tie-breaker. Cards show the publication, publisher, and the subject and edition of each matched [POSI journal quartile](docs/JOURNAL-QUARTILES.md). Citation count and venue rank describe different things. You can also sort by field-adjusted citations, citation count, or publication date.
- **Methods and data planning** ask about evidence, measurement, causal intent, ethics and resources before offering conditional approaches. Unresolved essentials produce no design suggestion. A structured 13-part DMP exports with original planning notes. [Scope and sources](docs/STUDY-PLANNING.md)
- **Privacy, Terms and Support** are public routes without project creation. Backup v2 import previews show origin and record counts; existing projects remain in place. [Moving work safely](docs/BACKUP-MIGRATION.md)
- **Preferences** remember light, dark or device theme, comfortable or compact layout, motion, and the roadmap’s unfinished-task filter. Project backups include display preferences for reference; import preserves the current display settings. Literature sort, saved conference entries and standalone search history remain separate browser records.

## Verify

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. For configured browser tests, install the required engines with `npx playwright install`. Actual engine/device coverage and release results belong in [Testing](TESTING.md).
