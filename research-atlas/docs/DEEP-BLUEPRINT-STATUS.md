# Deep research blueprint — 0.7 scope

The November 2026 deep research blueprint calls for an evolutionary sequence. Version 0.7 reorganizes the existing app and adds traceability and local recovery. It is not the completed 1.0 product or an independently validated research system.

## Available in 0.7

| Blueprint direction | Delivered behavior | Boundary |
| --- | --- | --- |
| Six destinations | Home, My Research, Discover, Library, Learn, Publish; project stages share Overview, Question, Literature, Study, Evidence, Write and Publish tabs | Existing links still open their original stages. My projects, Preferences and Privacy remain utilities. |
| Returning dashboard | Current question, actual saved/screening/evidence counts, recorded stage states, recent decisions and backup status | Counts describe records, not research quality. No invented quality percentage. |
| Adaptive guidance | Guided/Expert preference collapses contextual step explanations; three short visual lessons link back to work | Expert mode does not add a new command palette or bulk actions. Existing help remains available. |
| Next useful action | State-based action for upstream changes, question, screening, evidence and study planning | A deterministic suggestion, not an academic assessment. |
| Question versions | Separately saved draft; committed wording, reason, date and affected downstream work; project history and exports | Changes are user decisions. No semantic claim that a particular wording change is scientifically substantial. |
| Search notebook | Original/executed queries, provider, filters, time, pages, coverage, current matching saved/screened counts, CSV/JSON and query reuse | Existing bounded histories remain. Counts can change as records change. Reuse runs the query again; inspect recorded filters separately. Not an exhaustive or immutable search archive. |
| Atlas Library foundation | Unified view across projects grouped by normalized DOI or exact record ID, tag/read-state controls, project links, ranking and related discovery | Bibliographic records still reside in projects. This is a derived view, not a completed normalized global database. Linking copies bibliography and separates project judgments. See [Library behavior](ATLAS-LIBRARY.md). |
| Research trail | Bounded events for question, search, reference, screening, evidence, study, writing, venue and decision changes; CSV/JSON; links to current sources | Draft events are coalesced. It is an editable local audit aid, not an immutable institutional audit log. See [Research trail](RESEARCH-TRAIL.md). |
| Save safety | Revision-checked writes, stale-tab warning, rolling local snapshots, explicit restore and corrupted-record isolation/raw export | Browser-origin storage only; no sync service. Downloaded backups are still necessary. Reload older app tabs after updating. |
| Existing literature information | POSI quartile default, publisher marks, citations with provider retrieval time, newest/oldest and cost sorting | POSI is not SJR/JCR. Missing rank, price or count is unavailable; article access and author APC remain separate. |

## Preserved foundations

Screening reasons and history, duplicate review and undo, located evidence claims, gap support/challenge records, manuscript drafts, conditional methods, sourced reporting registries, DMP export, RIS/BibTeX exchange, conference sources/calendar copies, deadline/budget planning, submission declarations and reviewer replies continue to use the project records. Publish groups the venue, conference and submission work; My plan is under the project Overview.

## Later work

- A canonical global reference table with migrated project links, independent library import and managed attachments.
- A dedicated high-volume screening queue and additional keyboard/batch controls.
- Richer evidence cards, study deviations, manuscript-section links and traceable writing exports.
- Local PDF reading/annotation and page-linked excerpts; a richer literature map.
- Command palette, universal inbox and opt-in monitoring with a viable free operating model.
- Any AI features only after reliable document provenance, with explicit user control and an appropriate free option. No AI API is configured here.
- Independent discipline review, beginner usability sessions, manual screen-reader testing and physical-device evaluation. Automated checks cannot substitute for these.

The app remains static on GitHub Pages. This release adds no hosted database, paid API, billing integration, analytics or subscription. Optional external tools can have their own terms and prices; opening one does not purchase a service.
