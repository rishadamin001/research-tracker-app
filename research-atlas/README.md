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

## Verify

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:e2e`. For browser tests, install Chromium with `npx playwright install chromium`.
