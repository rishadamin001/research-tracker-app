# Data model

Backup: schemaVersion=1, exportedAt ISO string, projects[] (max 100; max 10 MB import).
Project: id, title, discipline, domain, problem, question, setting, purpose, data source, design, ethics, analysis, gap, gapStatus, papers[], searches[], lessons[], timestamps.
Paper: id, bibliographic fields, DOI, source, legal-link candidate, user finding/locator/notes, screening decision and reason. Paper cap on imported projects: 2,000. Search log cap: 1,000. Text fields cap: 20,000 characters.

Imported projects get new IDs and an imported suffix; no existing project is replaced. Zod validates imported and persisted records. Unknown JSON fields are stripped. React renders notes as text. URL rendering permits only HTTP(S). CSV cells that could be formulas receive an apostrophe prefix. Exact DOI or provider-ID matches prevent repeated additions. No fuzzy deduplication is claimed.

Institutional unit and program catalogues are intentionally deferred; six disciplinary families must not be presented as official departments.
