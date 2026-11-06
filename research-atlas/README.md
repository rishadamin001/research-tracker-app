# Research Atlas

A browser-local research workspace for students and early-career researchers. A project roadmap connects research planning, literature, study records, writing, and publication checks. Short examples and guidance appear beside each activity.

## Run

Open [Research Atlas on GitHub Pages](https://rishadamin001.github.io/research-tracker-app/). To install it, open **Preferences → Install app** in a supported browser. On iPhone or iPad, use Safari’s **Share → Add to Home Screen**.

For local development, use Node.js 24. Run `npm ci` and `npm run dev`, then open http://127.0.0.1:5174. For the production build, run `npm run build` and `npm run preview`, then open http://127.0.0.1:4173.

## Workflow

- Create a project with your field, experience, and goal. Shortlist topics and document a question and objectives.
- Search OpenAlex, save each source once, record screening reasons, and compare methods, findings, and limitations. Browse reported citation connections between saved sources.
- Plan methods and ethics, record data management and analysis, and draft a manuscript with citations from the saved library.
- Shortlist journals, document checks and fees, and look up DOI metadata and open-access locations. Task status records progress through the workspace.
- Download backups from My projects. Import restores copies, and previous version 1 backups receive defaults for new fields. Data is scoped to the browser origin, so export and import when moving from the local preview to Pages.

See [Workflow specification](WORKFLOW.md), [Architecture](ARCHITECTURE.md), and [Deployment](DEPLOYMENT.md). Scholarly search uses [OpenAlex](https://help.openalex.org/api/authentication/) and DOI metadata uses [Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/).

See the [competitive audit implementation status](docs/REQUIREMENT_STATUS.md) for completed and deferred blueprint items. Use **Privacy & data** to see what is shared with providers and manage local backups.

## Research planner, conferences, and literature search

- **Paper search** works before you create a project. Compare results by journal quartile, citations, publication date, reading price or estimated open-access publishing fee. Prices without a source stay unavailable. [How prices are sourced](docs/PUBLICATION-COSTS.md)
- **Research planner** introduces the journey from idea through peer review, data and survey design, beginner-friendly tools, and publishing checks. Under **My plan**, set a deadline, work backward, record a budget and venue requirements, draft a submission pack, and export point-by-point reviewer replies. The original guide is under **Research basics**.
- **Conference planner** separates events held in Bangladesh from events abroad. Browse organizer-checked listings, save or enter events, and choose an event date or deadline for Google Calendar or a standard `.ics` export. The upcoming view follows the device date. Organizer links and source check dates show when to recheck a listing. Exported calendar events are copies. Date changes at the source require updating the calendar entry.
- **Explore disciplines** launches a literature search from a discipline or topic in one click.
- **Literature results** default to journal quartile (Q1 to Q4, then unavailable) with OpenAlex citation count as the tie-breaker. Cards show the publication, publisher, and the subject and edition of each matched [POSI journal quartile](docs/JOURNAL-QUARTILES.md). Citation count and venue rank describe different things. You can also sort by field-adjusted citations, citation count, or publication date.
- **Preferences** remember light, dark or device theme, comfortable or compact layout, motion, and the roadmap’s unfinished-task filter. Preferences, literature sort, and saved conference entries are stored on this browser separately from project backups.

## Verify

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. For browser tests, install Chromium with `npx playwright install chromium`.
