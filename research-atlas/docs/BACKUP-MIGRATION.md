# Backup v2 and origin migration

Release 0.6.0 exports `research-atlas-backup` format, `backupVersion: 2`, and project `schemaVersion: 1`. The envelope records application version, creation time, source origin, project count, projects, validated display preferences, and a SHA-256 checksum. The checksum covers canonical JSON with sorted object keys, excluding the checksum itself. It detects accidental changes; it is not a signature, authentication mechanism, or encryption.

Exports use known validated fields, excluding added keys or provider credentials. Imports enforce a 10 MB limit, parse JSON, validate the envelope and project schema, verify the checksum and project count, reject duplicate project IDs, and present a preview. Version 1 backups remain supported, with absent origin/version/checksum described explicitly. Current preferences are not automatically overwritten. Projects are added with new IDs, preserving their reference, screening-event, evidence-claim, and decision records.

The local IndexedDB workspace remains schema version 1 with additive project fields. Backup format version and browser database version are independent. The existing transactional workspace write continues to be used; invalid input never enters it. A failed persistence write leaves the session's data available for recovery export.

## Move between addresses or devices

1. At the original address, select My projects → Download backup. Verify the download exists.
2. Keep the original site accessible and leave the original browser data intact.
3. At the destination, select My projects → Import backup and choose the file.
4. Verify source origin, version, timestamp, project count, reference count, screening-event count, and evidence-claim count in the preview.
5. Import as new copies and check representative projects and evidence.
6. Export a fresh backup from the destination before retiring the old browser profile.

No new domain or automatic redirect is configured by this release. A future domain move should display an old-origin export banner only after the destination and migration period are known, keep the old application available for at least the announced grace period, and add a destination-specific import panel. Do not redirect old users away from their only export route.

## Technical sources

Verified 7 November 2026:

- [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API): browser databases are subject to same-origin rules.
- [MDN StorageManager estimate](https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate): storage usage and quota are estimates.
- [MDN SubtleCrypto digest](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest): HTTPS/secure-context SHA-256 implementation.

Unit fixtures verify v1 preservation, v2 integrity, malformed/oversize/changed payload rejection, empty backups, preference capture, and stripping extra export fields. The browser fixture imports a backup declaring a different source origin and checks that the destination preserves its existing workspace. This simulates origin transfer; it does not serve the source address or verify an unconfigured custom domain or physical device.
