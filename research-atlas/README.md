# Research Atlas

A browser-local research workspace for students and early-career researchers. A project roadmap connects research planning, literature, study records, writing, and publication checks. Short examples and guidance appear beside each activity.

Version 0.9 uses six destinations: **Home, My Research, Discover, Library, Learn and Publish**. Returning Home shows your current question and pending work. Each project shares Overview, Question, Literature, Study, Evidence, Write and Publish tabs. Choose **Step-by-step guidance** for smaller tasks or **Focus workspace** to see all grouped fields. Both preserve the same answers. Open **Overview → My plan** for deadlines, budget and submission materials.

The [professional standards audit status](docs/PROFESSIONAL-AUDIT-STATUS.md) describes the 0.8 scope and remaining review. [Atlas Library](docs/ATLAS-LIBRARY.md) groups references across projects; [Project history](docs/RESEARCH-TRAIL.md) records explicitly committed question versions and research changes. The unified Library is currently a view over project records, with a canonical reference database still planned.

New in 0.9: explore real paper examples before committing to a question, use provider-specific search filters and failed-page recovery, and find journal candidates from related articles with a visible evidence trail. See [the readiness update](docs/READINESS-090.md) for scope and verification limits.

## Run

Open [Research Atlas on GitHub Pages](https://rishadamin001.github.io/research-tracker-app/). To install it, open **Preferences → Install app** in a supported browser. On iPhone or iPad, use Safari’s **Share → Add to Home Screen**.

For local development, use Node.js 24. Run `npm ci` and `npm run dev`, then open http://127.0.0.1:5174. For the production build, run `npm run build` and `npm run preview`, then open http://127.0.0.1:4173.

## Workflow

- Start from one of three homepage intentions: new to research, already have a topic/question, or need papers. The short guided path leads into a minimal project form. Create a project with your field, experience, and goal. Shortlist topics and document a question and objectives.
- Search OpenAlex, Europe PMC or Crossref, save each source once, then inspect, screen and record findings in the connected Evidence Desk. Review possible duplicates side by side and explore bounded OpenAlex citation/reference suggestions beyond the saved-library citation view.
- Choose an optional research pathway, plan methods and ethics, and record data management and analysis. Build section drafts in Writing Studio with deliberate citations and located evidence links; export Markdown, DOCX or cited references for further editing.
- Shortlist journals, document checks and fees, and look up DOI metadata and open-access locations. Task status records progress through the workspace.
- Download backups from My projects. Import restores copies, and new exports use backup v2 with source origin and integrity checksum. Previous version 1 backups remain supported. Version 0.9 reads workspace envelopes 1, 2 and 3 and writes envelope 3 on a changed save; project schema and IndexedDB version remain 1. Reload all older tabs after updating and avoid importing newer backups into older app versions. Revision checks and bounded local snapshots protect updated clients on the same device. Data is scoped to the browser origin, so export and import when moving from the local preview to Pages.

See [Workflow specification](WORKFLOW.md), [Architecture](ARCHITECTURE.md), and [Deployment](DEPLOYMENT.md). Search uses public [OpenAlex](https://help.openalex.org/api/authentication/), [Europe PMC](https://europepmc.org/RestfulWebService) and [Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) metadata. No paid subscription, personal API key or billing account is required by this app.

See the [PDF audit implementation status](docs/PDF-AUDIT-STATUS.md) and [earlier blueprint status](docs/REQUIREMENT_STATUS.md) for completed and deferred blueprint items. Use **Privacy & data** to see what is shared with providers and manage local backups.

## Research planner, conferences, and literature search

- **Paper search** works before you create a project. Choose broad OpenAlex coverage, biomedical/life-science Europe PMC, or Crossref journal articles. Compare retrieved results by journal quartile, provider relevance, citations, publication date, reading price or estimated open-access publishing fee. Load additional pages manually up to 100 records per search; export query history or refresh a matching search to compare discovered IDs. Google Scholar, PubMed, ResearchGate and Semantic Scholar links open the query on those sites; they do not import results. Prices without a source stay unavailable. [Search limits and history](docs/SEARCH-CONTINUATION.md) · [How prices are sourced](docs/PUBLICATION-COSTS.md)
- **Learn** introduces the journey from idea through peer review with short visual lessons and the Research Planner. Under project **Overview → My plan**, set a deadline, work backward, record a budget and venue requirements, draft a submission pack, and export point-by-point reviewer replies. **Publish** groups venue, conference and submission tools.
- **Conference planner** separates events held in Bangladesh from events abroad. Browse organizer-checked listings, save or enter events, and choose an event date or deadline for Google Calendar or a standard `.ics` export. The upcoming view follows the device date. Organizer links and source check dates show when to recheck a listing. Exported calendar events are copies. Date changes at the source require updating the calendar entry.
- **Explore disciplines** launches a literature search from a discipline or topic in one click.
- **Literature discovery** defaults to provider relevance unless you saved another sort. Quartile ordering (Q1 to Q4, then unavailable) remains available, with citation count as the tie-breaker. The Library retains its own sort preference. Cards show the publication, publisher, and the subject and edition of each matched [POSI journal quartile](docs/JOURNAL-QUARTILES.md). Citation count and venue rank describe different things. You can also sort by field-adjusted citations, citation count, or publication date.
- **Methods and data planning** ask about evidence, measurement, causal intent, ethics and resources before offering conditional approaches. Unresolved essentials produce no design suggestion. A structured 13-part DMP exports with original planning notes. [Scope and sources](docs/STUDY-PLANNING.md)
- **Question and guidance** keep autosaved drafts separate from committed wording. Only **Save question revision** creates a version. Changing mode, navigating away or finding papers retains the draft. Quantitative, qualitative, mixed-methods and literature pathways change prompts without clearing earlier answers. [Guidance behavior](docs/GUIDANCE-WORKSPACE.md)
- **Evidence and writing** connect source inspection, reasoned screening, located findings and section drafts. The Overview completeness review suggests what to revisit without scoring scientific quality. Research Passport exports explain the recorded trail; project backups remain the recovery format. [Evidence Desk and Passport](docs/EVIDENCE-DESK.md) · [Writing Studio](docs/WRITING-STUDIO.md)
- **Privacy, Terms and Support** are public routes without project creation. Backup v2 import previews show origin and record counts; existing projects remain in place. [Moving work safely](docs/BACKUP-MIGRATION.md)
- **Preferences** remember light, dark or device theme, comfortable or compact layout, motion, and the roadmap’s unfinished-task filter. Project backups include display preferences for reference; import preserves the current display settings. Literature sort, saved conference entries and standalone search history remain separate browser records.

## Verify

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. For configured browser tests, install the required engines with `npx playwright install`. Actual engine/device coverage and release results belong in [Testing](TESTING.md).
