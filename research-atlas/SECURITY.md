# Security and recovery

The public build contains no provider credentials and has no project upload endpoint. GitHub Pages serves static assets. Use the public app through its HTTPS URL.

See the [security assessment](docs/SECURITY-ASSESSMENT-0103.md) for the measured production headers, dependency review and owner settings. The 0.10.3 candidate applies a browser policy through its generated HTML and supplies HTTP header configuration for hosts that support it. The [encrypted backup design](docs/ENCRYPTED-BACKUP-DESIGN.md) describes the next phase.

Import a backup or reference library only from a source you trust. The app validates file sizes and record shapes, previews imports before saving, and renders record text without interpreting it as HTML. DOI and source links use HTTP or HTTPS. CSV exports neutralize spreadsheet formulas at the start of cells.

Use **Privacy & data** to request persistent browser storage and download regular backups. If a write fails, keep the tab open and download the recovery backup. Browser storage and exported files rely on the protections of your device and browser profile.
