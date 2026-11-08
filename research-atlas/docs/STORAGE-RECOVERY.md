# Local storage, conflicts and recovery

Research Atlas keeps project work in the current browser profile and website origin. There is no server copy or automatic cross-device synchronization. Keep a portable JSON backup outside browser storage.

## Revision protection

The `research-atlas` IndexedDB database stays at database version 1, with the existing `workspace` object store. Version 0.8 accepts local workspace envelopes with `schemaVersion: 1` or `2`. An envelope without revision metadata loads at revision zero; an existing valid revision is preserved. A changed save or snapshot restore writes envelope `schemaVersion: 2` with `revision`, `exportedAt` and `projects`. Opening the app, an unchanged save, or capturing a snapshot does not itself migrate the envelope.

These versions describe different layers: **local workspace envelope 2**, **portable backup format 2**, **project schema 1**, and **IndexedDB database version 1**. The project additions are optional fields validated by the current application; neither a new database nor a manual re-import is required.

The active application uses `loadWorkspace()` and `saveWorkspace(projects, expectedRevision)`. Each write reads and compares the stored revision in the same IndexedDB read/write transaction as the replacement. A mismatched revision raises `WorkspaceConflictError` and aborts without changing the stored projects or snapshots. Writes within one tab are queued by Atlas. Merely opening a workspace does not create a write.

After a committed write, BroadcastChannel and a localStorage-event fallback announce only the revision number, commit time and random tab identifier. They do not broadcast project titles, queries, references, notes or manuscripts. Notifications are advisory; the transaction check still protects updated clients if notifications are unavailable. A tab ignores its own notices.

When another tab saves a newer revision, the current tab pauses writes. It keeps its in-memory work available for a downloadable backup. Reloading loads the latest stored copy. There is no automatic merge of competing drafts.

**Upgrade and downgrade caveat:** close or reload all older Research Atlas tabs after an update, and keep a downloaded backup. The version 2 local envelope makes version 0.7 readers refuse newer workspace records instead of opening and saving them through an older project parser. Still older, already-loaded bundles cannot be retrofitted with these checks and may use older write behavior. Do not import a version 0.8 backup into an older app: its older parser may omit fields such as structured writing and additional-provider search history. Use the current application for recovery and transfer.

The legacy `loadProjects` / `saveProjects` exports remain for compatibility. New application flows must use the explicit revision API to protect the state they actually loaded.

## Rolling snapshots

Snapshots are stored locally under a separate key in the same store. Atlas retains up to eight valid copies within a shared 10,000,000-byte budget. Oldest copies rotate out as new copies are retained. An ordinary changed save captures the prior non-empty workspace at most once per minute. An unchanged save does not increment the revision. An oversized prior workspace cannot receive an automatic snapshot within this budget.

Use **My projects → Save local snapshot now** to explicitly capture the currently saved workspace. Snapshots include projects and their project records; they do not include independent browser preferences, standalone search history or cached app assets. Portable backups remain the transfer and independent recovery mechanism.

**Review local snapshots** lists dates, project/reference counts and capture reasons. **Preview snapshot** shows the project titles before any restore. Restoring replaces the saved project workspace with the selected prior copy and increments the revision. Before replacing anything, Atlas must retain the current workspace as a `before-restore` snapshot. If that current copy cannot fit the local budget, restoration is refused without replacing work. Download a portable backup and review storage size instead.

Snapshot capture and restore use the same revision checks as normal saves. A newer write from another tab makes the requested operation fail rather than overwrite that tab's work. Browser quota or transaction failures abort the mutation. Backups, snapshots and raw recovery files can contain private notes and are not encrypted by Atlas.

## Corrupt project records

When an envelope is readable but an individual project fails schema validation, Atlas opens the valid project records and enters recovery mode. Repeated project IDs also trigger isolation. It preserves the original stored envelope and provides **Download original stored data**; ordinary saves are blocked so omitted records cannot silently disappear.

The raw recovery file is for manual inspection or support through an appropriate private channel. It is not automatically converted into a valid portable backup. Do not post it in public GitHub issues.

A checked earlier snapshot can restore a usable workspace. The original raw data are retained with the pre-restore snapshot when the budget permits, and a raw download is available from that snapshot preview. Unsupported top-level workspace formats and invalid revision metadata currently fail to open rather than being automatically repaired.

## Limits and verification

All of these copies remain inside the same browser origin. Clearing site data, losing a device, browser eviction, disk failure or private-browsing cleanup can remove projects and snapshots together. A local snapshot is not an off-device backup. No encryption, remote synchronization or automatic corruption repair is claimed.

`tests/storage-reliability.test.ts` covers version 1 loading, per-project corruption isolation, duplicate identifiers and snapshot count/byte bounds. `tests/e2e/storage-reliability.spec.ts` covers updated-tab conflicts, actual competing IndexedDB saves, snapshot preview/restore and corrupt-record preservation. Test definitions are not evidence of a completed run; consult [Testing](../TESTING.md) for actual results and browser coverage.

## Deletion and privacy

Deleting a current project does not immediately purge its earlier snapshot copies. Earlier project notes may remain until snapshot rotation, **Review local snapshots → Clear local snapshots**, or browser site-data clearing. Clear local snapshots asks for explicit confirmation and checks the workspace revision in its transaction; it deletes only the local snapshot collection. Current projects and already downloaded backups stay in place. Deleted snapshots are not recoverable through Atlas. Downloaded files must be managed separately on the device.

During local snapshot actions, Atlas temporarily pauses project forms and app navigation while keeping recovery controls mounted. This prevents a concurrent edit or queued save from replacing a workspace that has just been restored. On successful restoration, focus returns to the main workspace. A tab with an unresolved revision conflict must reload the current stored workspace before mutating its snapshots.
