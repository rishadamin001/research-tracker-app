# Version 0.10 migration

Version 0.10 reads workspace envelopes 1 through 4 and writes envelope 4 on the next changed save. Backups export as version 3, with the same integrity checksum and origin metadata as version 2. The new version prevents older importers from silently dropping notebook entries. Existing version 1 and 2 backups still import. Project schema and IndexedDB stay at version 1. Reload older tabs and keep a downloaded backup somewhere you can reach from another device.

The notes below describe earlier release behavior.

# Version 0.9 migration

Version 0.9 writes local workspace envelope 3 and reads envelopes 1, 2 and 3. This protects new Journal Match provenance and expanded provider filters from being silently removed by a version 0.8 tab. Reload older tabs before continuing; keep a downloaded backup. Portable backup version remains 2, project schema remains 1, and IndexedDB remains version 1. The export app version is 0.9.0. Import newer backups only into the current app.

Journal Match drafts and supporting-article provenance are optional project fields. Existing manual shortlists, evidence, question versions and manuscript drafts are preserved. Starter exploration choices use separate tab-local session storage and are not a project until explicitly created.

## Earlier release details

# Backup v2 and origin migration

Releases 0.6 through 0.8 export `research-atlas-backup` format, `backupVersion: 2`, and project `schemaVersion: 1`. Version 0.8 exports identify `appVersion: 0.8.0`. The envelope records application version, creation time, source origin, project count, projects, validated display preferences, and a SHA-256 checksum. The checksum covers canonical JSON with sorted object keys, excluding the checksum itself. It detects accidental changes; it is not a signature, authentication mechanism, or encryption.

Version 0.7 added optional question drafts/versions, project history and Library organization fields. Version 0.8 adds an optional research pathway, public abstract metadata, additional-provider search history and structured writing with citation/evidence snapshots. These recognized optional fields travel with project backups. The browser workspace revision and local recovery snapshots are storage metadata and are not included in portable exports. Downloading a backup captures the current tab’s in-memory records even if saving was paused by a conflict. [Local recovery behavior](STORAGE-RECOVERY.md)

Exports use known validated fields, excluding added keys or provider credentials. Imports enforce a 10 MB limit, parse JSON, validate the envelope and project schema, verify the checksum and project count, reject duplicate project IDs, and present a preview. Version 1 backups remain supported, with absent origin/version/checksum described explicitly. Current preferences are not automatically overwritten. Projects are added with new IDs, preserving their reference, screening-event, evidence-claim, and decision records.

The local workspace envelope is now version 2, while portable backup format remains 2, project schema remains 1 and the IndexedDB database remains version 1. Version 0.8 reads local envelopes 1 and 2 and writes 2 on a changed save or snapshot restore. The existing transactional workspace write continues to be used; invalid input never enters it. A failed persistence write leaves the session's data available for recovery export.

**After updating:** close or reload older tabs, verify the footer shows version 0.8.0, and keep a downloaded backup. A version 0.7 reader refuses a version 2 local envelope; still older loaded clients cannot gain new protections without reloading. Import older v1/v2 backups using the current app. Do not import a newer backup into an older app, whose parser can omit newly added optional fields. Keep the original file when testing any transfer. Research Passport and manuscript exports are sharing formats, not restore backups.

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
