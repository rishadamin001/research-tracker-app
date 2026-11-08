# Professional standards audit — 0.8 scope

This maps the supplied **Research Atlas Consolidated Professional Standards Audit** to version 0.8 source behavior. The PDF is a product reference. It does not establish that an implementation, provider or academic recommendation has passed independent review. Earlier audit releases remain documented in [0.6 PDF status](PDF-AUDIT-STATUS.md) and [0.7 deep blueprint status](DEEP-BLUEPRINT-STATUS.md).

| Audit direction | Implemented scope | Boundary |
| --- | --- | --- |
| Search and continuation first | OpenAlex, Europe PMC and Crossref choices; explicit loading, additions, retry and end feedback; provider/filter history | Twenty records per page, five manually requested pages per search. Provider availability and relevance differ. No exhaustive search or imported Scholar/ResearchGate results. |
| Guidance that changes the task flow | Step-by-step guidance presents small groups; Focus workspace presents all groups | Same saved fields and reversible mode. Examples remain editorial aids pending independent academic review. |
| Intentional question revisions | Draft autosave, explicit Save question revision, discard draft, versions beside the editor | Navigation and mode changes do not commit. History is bounded and cannot reconstruct missing past edits. |
| Research pathways | Optional quantitative, qualitative, mixed-methods and literature examples | Changing pathway preserves answers; it does not choose or validate a study design. |
| Connected Evidence Desk | Selected source inspection, screening history, extraction, comparison and writing handoff | Up to 20 list/comparison rows per page. Public abstracts only when supplied; no PDF reader, paywall bypass or automatic evidence verification. |
| Traceable writing | Six section drafts, explicit bibliography/located-evidence insertion, snapshots and change prompts | Existing freeform manuscript remains separate. No complete citation-style engine or scientific claim certification. |
| Useful exports | Markdown, minimal DOCX, cited RIS/BibTeX, evidence links and Research Passport | DOCX package integrity is distinct from Word rendering. Passport is not a restore backup. Review private notes before sharing. |
| Readiness and provenance | Recorded-completeness prompts and bounded local history | No research-quality score, ethics approval, novelty determination or tamper-proof audit log. |
| Working space and less repetition | Wider task layouts, optional contextual help and planner introduction | Physical-device, beginner-usability and manual screen-reader review remain separate work. |
| Preserve data and free operation | Existing rank/logo/citation/date/cost fields, backup import and local recovery; no paid runtime or key required | Missing metadata stays unavailable. Browser storage is origin-bound, not cloud synchronization. |

## Storage and upgrade

The **local workspace envelope is 2**, **portable backup format is 2**, **project schema is 1**, and **IndexedDB database version is 1**. Version 0.8 reads earlier workspace envelopes and older v1/v2 backups; changed saves write envelope 2. Reload all older tabs after updating. Version 0.7 refuses the newer local envelope; older app parsers can omit new fields from imported backups, so use the current app for transfer and recovery. Keep downloaded backups. [Migration](BACKUP-MIGRATION.md) · [Recovery](STORAGE-RECOVERY.md)

## Verification status

Release type, lint, unit, build, browser and live-provider checks are pending until recorded in [Testing](../TESTING.md). Historical 0.7 results do not verify 0.8. Test definitions and implemented source behavior are not completed-run evidence. Independent academic review, human usability sessions, manual assistive-technology review, physical-device checks and Word rendering are not claimed. GitHub Pages remains the free hosting target; this release adds no billing account, paid API, required subscription or hosted database.
