# Research Atlas

A browser-local research workspace for students and early-career researchers. A project roadmap connects research planning, literature, study records, writing, and publication checks. Short examples and guidance appear beside each activity.

## Run

Use Node.js 24. Run `npm ci` and `npm run dev`, then open http://127.0.0.1:5174. For the production build, run `npm run build` and `npm run preview`, then open http://127.0.0.1:4173.

## Workflow

- Create a project with your field, experience, and goal. Shortlist topics and document a question and objectives.
- Search OpenAlex, save each source once, record screening reasons, and compare methods, findings, and limitations. Browse reported citation connections between saved sources.
- Plan methods and ethics, record data management and analysis, and draft a manuscript with citations from the saved library.
- Shortlist journals, document checks and fees, and look up DOI metadata and open-access locations. Task status records progress through the workspace.
- Download backups from My projects. Import restores copies, and previous version 1 backups receive defaults for new fields. Data is scoped to the browser origin, so export and import when moving from the local preview to Pages.

See [Workflow specification](WORKFLOW.md), [Architecture](ARCHITECTURE.md), and [Deployment](DEPLOYMENT.md). Scholarly search uses [OpenAlex](https://help.openalex.org/api/authentication/) and DOI metadata uses [Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/).

## Research guide, conferences, and literature sorting

- **Research guide** explains papers, journals, proceedings, and review practices with diagrams, a sample paper, and verification checklists.
- **Conference planner** separates events held in Bangladesh from events abroad. Browse organizer-checked listings, save or enter events, and choose an event date or deadline for Google Calendar or a standard `.ics` export. The upcoming view follows the device date. Organizer links and source check dates show when to recheck a listing. Exported calendar events are copies. Date changes at the source require updating the calendar entry.
- **Saved literature** opens directly from the active project. Sort papers by OpenAlex field-adjusted citations, citation count, or publication date. Journal shortlist metrics are fetched from a user-confirmed OpenAlex match by ISSN. Missing data stays visible. Citation measures describe impact and do not establish research quality.
- **Preferences** remember light, dark or device theme, comfortable or compact layout, motion, and the roadmap’s unfinished-task filter. Preferences, literature sort, and saved conference entries are stored on this browser separately from project backups.

## Verify

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. For browser tests, install Chromium with `npx playwright install chromium`.
