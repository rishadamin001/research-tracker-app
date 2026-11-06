# Architecture

Vite serves a React and TypeScript application. `Atlas` manages the selected project, browser navigation, and autosave. Planning, evidence, and execution components all read and update the same project. `workflow.ts` derives task statuses and sets review flags when the question changes. Statuses indicate recorded progress and do not certify the work.

`model.ts` validates version 1 backups with defaults for newer fields, produces CSV and Markdown outputs, and checks duplicate identifiers. `storage.ts` saves projects in IndexedDB. Each reference stores metadata, user-authored extraction notes, screening decisions, and optional citation IDs. Search, screening, extraction, and writing reuse these records. Publication decisions use a separate journal shortlist within the project.

`providers.ts` normalizes public records. The default static app calls OpenAlex and Crossref directly. The citation panel displays directed links between saved records using OpenAlex references already in the library. Project notes, drafts, and decisions stay in the browser.

`search-provenance.ts` defines the search attempt and first-page record. `evidence-ledger.ts` defines reusable criteria, decision events and located claims within a project. Screening keeps a convenience decision for the library view. Events retain the criterion as it was when applied. Claims can mark evidence for or against a candidate gap. Changing a question flags existing reviewed claims for another look.

`research-plan.ts` defines deadline, budget and submission fields with defaults for older backups. `reference-exchange.ts` handles bounded local RIS and BibTeX parsing, duplicate previews and exports. Bibliographic records remain scoped to a project.
