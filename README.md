# Research Space

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
