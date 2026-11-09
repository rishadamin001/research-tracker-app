# Research Atlas

**Find literature, organize evidence, and plan your first research paper.**

A free, browser-local academic research workspace for students and early-career researchers. Research Atlas connects paper discovery, literature screening, study planning, writing, and publication checks in one guided workflow.

**[Open Research Atlas](https://rishadamin001.github.io/research-tracker-app/)** · [App guide](research-atlas/README.md) · [0.9 readiness update](research-atlas/docs/READINESS-090.md) · [Report an issue](https://github.com/rishadamin001/research-tracker-app/issues)

## What you can do

| Workspace | What it helps you do |
| --- | --- |
| **Paper search** | Choose OpenAlex, Europe PMC or Crossref; manually retrieve up to 100 records per search, retain provider/filter/page history and export logs. Sort by quartile, provider relevance, citations, date or available cost. Open Scholar, PubMed, ResearchGate or Semantic Scholar query links externally. |
| **Literature & evidence** | Inspect, screen and record located findings in Evidence Desk, compare sources, review duplicate candidates and connect claims to writing. Exchange RIS/BibTeX references. |
| **Research planner** | Develop an autosaved question draft and explicitly save revisions; choose a reversible research pathway, review conditional designs, build a data management plan, and plan deadlines, budgets, submissions and reviewer replies. |
| **Writing Studio** | Draft sections with deliberate numbered citations and located evidence links; export Markdown, minimal DOCX or cited references. Review recorded-completeness prompts and export a Research Passport. |
| **Journal Match** | Find related publications, inspect supporting articles and ISSNs, and retain journal suggestions with query provenance. Unknown fees stay explicit. |
| **Conferences** | Distinguish curated events from external directories, save unverified personal leads, track dates and export calendar entries. |
| **Atlas Library** | Browse references across projects with quartiles, tags and reading states; link bibliography to another project while keeping project judgments separate. |
| **Your workspace** | Use Step-by-step guidance or Focus workspace with the same saved fields, a returning dashboard and project tabs. Follow explicit question versions and bounded history; recover local snapshots and download versioned backups. |

## Start using the app

1. [Open the live app](https://rishadamin001.github.io/research-tracker-app/).
2. Explore real paper examples from your interests, use **Discover** to search papers, or create a project in **My Research**.
3. Use **Library** for sources across projects, **Learn** for short lessons and the planner, and **Publish** for venues, conferences and submissions.
4. Export project backups regularly. Browser data does not automatically sync between devices. Use the [migration guide](research-atlas/docs/BACKUP-MIGRATION.md) when changing browser or website address.

Navigation has six destinations: Home, My Research, Discover, Library, Learn and Publish. Returning Home shows the active question and actual pending work. Projects share Overview, Question, Literature, Study, Evidence, Write and Publish tabs. [Privacy & data](https://rishadamin001.github.io/research-tracker-app/#privacy), [Terms](https://rishadamin001.github.io/research-tracker-app/#terms) and [Support](https://rishadamin001.github.io/research-tracker-app/#support) are public.

The published app requires no paid subscription, payment card, or personal API key. Search requests go to external scholarly providers and are subject to their availability and limits. Project records stay in your browser.

## Run Research Atlas locally

Use **Node.js 24** and npm. The active app is in `research-atlas/`; run these commands from the repository root:

```sh
cd research-atlas
npm ci
npm run dev
```

Open **http://127.0.0.1:5174**.

```sh
npm run build
npm run preview
```

The production preview opens at **http://127.0.0.1:4173**. Local previews and the published site use separate browser storage; move projects with backup export/import.

## Repository map

```text
research-atlas/       Active Research Atlas app (React, TypeScript, Vite)
  src/               Application source
  public/            Static assets and installable app resources
  tests/             Automated checks
  docs/              Data-source notes, implementation status, smoke reports
.github/workflows/   Research Atlas checks and GitHub Pages publishing
client/              Earlier Research Space tracker frontend
server/              Earlier Research Space tracker API and SQLite storage
package.json         Earlier tracker's workspace commands
```

## Documentation

| Read this | For |
| --- | --- |
| [App overview](research-atlas/README.md) | Features, preferences, and everyday use |
| [Readiness update](research-atlas/docs/READINESS-090.md) | Version 0.9 behavior, remaining validation and free-operation boundaries |
| [Guidance and pathways](research-atlas/docs/GUIDANCE-WORKSPACE.md) | Task groups, mode changes and explicit question commits |
| [Evidence Desk](research-atlas/docs/EVIDENCE-DESK.md) | Source work, completeness review and Research Passport |
| [Writing Studio](research-atlas/docs/WRITING-STUDIO.md) | Section drafts, evidence links and local exports |
| [Research workflow](research-atlas/WORKFLOW.md) | How the guided research stages fit together |
| [Architecture](research-atlas/ARCHITECTURE.md) | Application structure and data design |
| [Journal quartiles](research-atlas/docs/JOURNAL-QUARTILES.md) | Ranking sources, matching, and limitations |
| [Publication costs](research-atlas/docs/PUBLICATION-COSTS.md) | Reading prices versus author publishing fees |
| [Search continuation](research-atlas/docs/SEARCH-CONTINUATION.md) | Page limits, reproducibility, history, and related papers |
| [Study planning](research-atlas/docs/STUDY-PLANNING.md) | Conditional methods, sourced guidance, and structured data plans |
| [Backup & migration](research-atlas/docs/BACKUP-MIGRATION.md) | Backup versions, integrity, and moving between origins |
| [Deep blueprint status](research-atlas/docs/DEEP-BLUEPRINT-STATUS.md) | Current release boundaries and planned later work |
| [Atlas Library](research-atlas/docs/ATLAS-LIBRARY.md) | Cross-project grouping, linking and current storage limitations |
| [Research trail](research-atlas/docs/RESEARCH-TRAIL.md) | Question versions, project event history and exports |
| [PDF audit status](research-atlas/docs/PDF-AUDIT-STATUS.md) | Previous audit requirements and limitations |
| [Testing](research-atlas/TESTING.md) | Verification coverage and results |
| [Deployment](research-atlas/DEPLOYMENT.md) | GitHub Pages publishing |
| [Contributing](research-atlas/CONTRIBUTING.md) | Development conventions |

## Data you can interpret

- **Quartiles:** matched POSI journal quartiles include their subject and edition. They are not interchangeable with SJR or JCR rankings and do not establish the quality of an individual paper.
- **Citations:** counts come from the scholarly provider and may differ from other databases.
- **Costs:** reading access and author publishing fees are separate. Missing prices remain unavailable rather than being treated as zero.
- **Conference dates:** source links and check dates help you verify listings. Calendar exports are copies and do not automatically update.
- **Library:** the unified Library currently derives its view from project references. A migrated canonical reference database and PDF attachments remain later work.
- **Storage:** browser storage can be cleared. Version 0.9 reads envelopes 1, 2 and 3 and writes local workspace envelope 3; backup format remains 2, project schema 1 and IndexedDB version 1. Reload all older tabs after updating and avoid importing newer backups into older app versions, whose parsers may omit new fields. Keep downloaded backups. Standalone search history is local and exported separately; Research Passport is not a restore backup.
- **Coverage:** each provider is bounded to five manually requested pages and does not prove exhaustive coverage. Methods suggestions and completeness prompts do not certify scientific quality. The [0.9 readiness update](research-atlas/docs/READINESS-090.md) records remaining human, device and content review. Completed release checks belong in [Testing](research-atlas/TESTING.md).

## Development checks

Run inside `research-atlas/`:

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install
npm run test:e2e
```

See [Contributing](research-atlas/CONTRIBUTING.md) before changing application behavior. Do not commit credentials or private research data, and keep the public app free of paid runtime requirements.

## Earlier Research Space tracker

The original React + Express + SQLite tracker is retained in `client/` and `server/`. Its root-level commands run that earlier app. The published GitHub Pages site runs **Research Atlas**.

<details>
<summary>Open the earlier tracker's setup, API, and storage instructions</summary>

A student research dashboard built with React, Vite, Express, and SQLite. Track papers, see counts by status, and keep your library between sessions.

## Run locally

Use **Node.js 24** (or Node.js 22.12+) and npm. If you use nvm, run `nvm use` from this directory.

```sh
npm ci
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` requests to the Express API at `http://127.0.0.1:3001`, so no separate CORS configuration is needed. Both processes start with one command; Ctrl+C stops them.

The first launch creates an empty SQLite database automatically at `server/data/research.db`. Add your first paper with **Add paper**. There are no required accounts, secrets, or external services.

## Features

- Add and edit title, authors, journal, publication year, and status (`reading`, `read`, or `published`).
- View total, reading, completed, and published counts computed by the API.
- Search titles, authors, and journals; filter by status; sort the library.
- Change status directly in the table; confirm before deleting a paper.
- Export your library as a CSV file.
- Responsive dashboard with keyboard-accessible forms and loading/error feedback.

## Build and test

```sh
npm test
npm run build
npm start
```

`npm test` runs integration tests against real Express listeners and SQLite, including CRUD, metrics, invalid input, and persistence after reopening a database. Test databases are temporary and do not modify your library.

`npm run build` creates `client/dist`. Then `npm start` serves both the compiled dashboard and API at **http://localhost:3001**. Restart the server after building so it discovers the frontend output. `npm run preview --workspace client` only previews static assets; use Express for a working production API.

## Configuration and data

The backend reads these optional environment variables directly from its process:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Express port |
| `HOST` | `127.0.0.1` | Express listen address |
| `DB_PATH` | `server/data/research.db` | SQLite file path; relative paths resolve from the process working directory |
| `API_PROXY_TARGET` | `http://127.0.0.1:3001` | Vite proxy target when using a different API port |

For example, `PORT=4001 API_PROXY_TARGET=http://127.0.0.1:4001 npm run dev` starts development with a different backend port. For LAN access to the production app, explicitly set `HOST=0.0.0.0 npm start` on a trusted network.

The database uses SQLite WAL mode. Database files and builds are ignored by Git. Back up the database using SQLite's backup facilities, or stop the server before copying the database and any companion files. Keep the database outside a deployment's disposable directory if you need to retain it across deployments.

This is a local, single-workspace application without authentication. For a shared public deployment, add authentication and user-scoped data in a separate implementation task.

## REST API

| Method | Endpoint | Response |
| --- | --- | --- |
| `GET` | `/api/health` | `{ "status": "ok" }` after a database check |
| `GET` | `/api/papers` | `{ "papers": [...] }` |
| `GET` | `/api/papers/:id` | `{ "paper": {...} }` |
| `POST` | `/api/papers` | `201` and `{ "paper": {...} }` |
| `PATCH` | `/api/papers/:id` | Update supplied fields; `{ "paper": {...} }` |
| `PUT` | `/api/papers/:id` | Replace all editable fields; `{ "paper": {...} }` |
| `DELETE` | `/api/papers/:id` | `204` with no body |
| `GET` | `/api/metrics` | `{ "total": 0, "reading": 0, "read": 0, "published": 0 }` |

Create a paper with a JSON body like:

```json
{
  "title": "Attention Is All You Need",
  "authors": "Ashish Vaswani et al.",
  "journal": "NeurIPS",
  "publicationYear": 2017,
  "status": "reading"
}
```

Title, authors, and journal are required nonempty strings (maximum 400, 1000, and 300 characters). The year must be an integer from 1 to 9999. Invalid inputs return `400`; missing papers return `404`; errors have an `error` message. Paper responses also include `id`, `createdAt`, and `updatedAt`.

## Project layout

```text
client/              React UI and Vite configuration
server/src/          Express routes, validation, and SQLite schema
server/test/         API and persistence integration tests
server/data/         Local database (created automatically; ignored)
package-lock.json    Frozen workspace dependency tree
```

Use the existing checkout for cloud tasks; each task already has an isolated environment. No additional Git worktree is needed.

</details>

