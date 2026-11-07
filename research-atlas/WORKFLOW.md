# Research Atlas workflow

The roadmap belongs to the selected project. Every stage opens independently within Overview, Question, Literature, Study, Evidence, Write and Publish tabs. The next task prioritizes work marked Needs review, then the first unfinished task that can begin. The app saves edits in IndexedDB and reports save status. Ready for now describes a recorded artifact. It does not establish study quality, ethics approval, or submission readiness.

Returning Home shows the active question, pending screening/evidence work and backup status. Discover supports standalone searches and a search notebook; Library groups saved references across projects. Learn offers short lessons and the planner; Publish groups venues, conferences and submission materials. Deadlines, budget and submission drafts remain under project Overview → My plan. Guided/Expert changes default contextual help without changing the research records.

| Screen | Action and saved artifact | Status or validation | Next useful action |
| --- | --- | --- | --- |
| Home and starter exercise | Explore disciplines, draft a question, or create a project. The exercise passes its draft to a new project. | A blank title creates an untitled project. The exercise is optional. | Set up the project. |
| Profile | Choose discipline, domain, experience, and goal. Record optional institution and constraints. | Discipline, experience, and goal complete setup. Later edits preserve the other artifacts. | Explore topics. |
| Topic | Save a shortlist, working topic, and feasibility rationale. | A working topic and rationale complete the stage. | Frame the question. |
| Question | Record the problem, setting, question, objectives, and optional hypothesis. Draft text saves separately until Save, Continue or navigation. | Committed versions retain wording, reason and affected-work snapshots. Changing an existing question flags started downstream work. | Find supporting evidence. |
| Discovery | Search with keywords, year, and optional open-access filter. Save sources into the project library. | The search log records query, source, filters, date, and result count. Exact ID or DOI matches are deduplicated. Failed requests offer a fallback link. | Screen the library. |
| Screening | Record a reason and inclusion or exclusion for each reference. Inspect reported citation relationships. | Reviewed references require reasons. The stage is blocked before a source is saved. | Extract evidence. |
| Evidence | Compare methods, findings, and limitations. Record evidence locators and a provisional gap. | Included sources need a finding and locator for completion. Excluded sources remain in the library and CSV export. | Review methods. |
| Methods and ethics | Choose an objective and data source. Record design, sampling, instruments, ethics status, and analysis plan. | Design, ethics notes, and analysis plan complete the stage. Guidance varies with the research objective. | Plan data and analysis. |
| Data and analysis | Write a data management plan and record the analysis performed. | A blank template is in progress. Both artifacts need author content. | Draft the manuscript. |
| Writing | Draft sections and insert an author-year citation from the saved library. | An outline is in progress until it has author content. Export Markdown for further editing. | Assess publication venues. |
| Publication | Record journal scope, fees, checks, and evidence. Verify a DOI or find a reported open-access location. | A documented candidate with a check and verification notes completes the stage. DOI metadata identifies a work. Venue assessment is recorded by the researcher. | Review the roadmap or export. |
| My projects | Open a roadmap, export a protocol or evidence CSV, back up, import, or inspect local snapshots. | Import validates v1/v2 backups before restoring copies. Snapshot restore previews and preserves the current saved workspace. Stale-tab conflicts pause saves. | Resume the project or transfer it using the backup. |

Browser regression tests exercise onboarding and resume, backup recovery, failed search, question revision, screening and extraction, reported citation links, writing, venue checks, and keyboard navigation. See [Testing](TESTING.md).
