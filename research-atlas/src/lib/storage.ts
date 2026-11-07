import { backupSchema, projectSchema, type Project } from './model';
export const snapshotLimit = 8;
export const snapshotBudgetBytes = 10_000_000;
const snapshotInterval = 60_000;
const noticeKey = 'atlas-workspace-revision';
const channelName = 'atlas-workspace-changes';
const tabId = crypto.randomUUID();
export type WorkspaceNotice = { revision: number; updatedAt: string; tabId: string };
export type WorkspaceRecovery = { invalidProjectCount: number; message: string; rawJson: string };
export type WorkspaceState = { projects: Project[]; revision: number; recovery?: WorkspaceRecovery };
export type WorkspaceSnapshot = { id: string; createdAt: string; revision: number; projects: Project[]; reason: 'automatic' | 'manual' | 'before-restore'; rawRecovery?: string };
export type SnapshotSummary = Omit<WorkspaceSnapshot, 'projects' | 'rawRecovery'> & { projectCount: number; referenceCount: number; recoveryIncluded: boolean };
export class WorkspaceConflictError extends Error {
  constructor(readonly currentRevision: number) { super('Another tab saved a newer workspace. Download your current work before loading the latest saved copy.'); this.name = 'WorkspaceConflictError'; }
}
export class WorkspaceRecoveryRequiredError extends Error {
  constructor() { super('Some saved projects need recovery. Automatic saving is paused to preserve the original records.'); this.name = 'WorkspaceRecoveryRequiredError'; }
}
export function decodeWorkspace(raw: unknown): WorkspaceState {
  if (raw === undefined) return { projects: [], revision: 0 };
  if (!raw || typeof raw !== 'object' || !('schemaVersion' in raw) || raw.schemaVersion !== 1 || !('projects' in raw) || !Array.isArray(raw.projects) || raw.projects.length > 100) throw Error('Saved workspace format could not be read. No stored records have been changed.');
  const revision = 'revision' in raw ? raw.revision : 0;
  if (!Number.isSafeInteger(revision) || Number(revision) < 0) throw Error('Saved workspace revision is invalid. No stored records have been changed.');
  const projects: Project[] = [], ids = new Set<string>();
  let invalidProjectCount = 0;
  for (const item of raw.projects) {
    const parsed = projectSchema.safeParse(item);
    if (!parsed.success || ids.has(parsed.data.id)) { invalidProjectCount++; continue; }
    projects.push(parsed.data); ids.add(parsed.data.id);
  }
  return { projects, revision: Number(revision), ...(invalidProjectCount ? { recovery: { invalidProjectCount, message: `${invalidProjectCount} saved project records could not be opened. Valid projects remain available; saving is paused so the original records are preserved. Download the original recovery file or restore a checked snapshot.`, rawJson: JSON.stringify(raw, null, 2) } } : {}) };
}
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('research-atlas', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('workspace');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(Error('Another Research Atlas tab is blocking local storage. Close that tab and retry.'));
  });
}
async function readRecord(key: string): Promise<unknown> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', 'readonly');
    const request = tx.objectStore('workspace').get(key);
    let result: unknown;
    request.onsuccess = () => { result = request.result; };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onabort = () => { db.close(); reject(tx.error ?? request.error); };
  });
}
export async function loadWorkspace(): Promise<WorkspaceState> { return decodeWorkspace(await readRecord('projects')); }
export async function loadProjects(): Promise<Project[]> { const result = await loadWorkspace(); if (result.recovery) throw new WorkspaceRecoveryRequiredError(); return result.projects; }
function notifyWorkspace(revision: number) {
  const notice: WorkspaceNotice = { revision, updatedAt: new Date().toISOString(), tabId };
  if (typeof window === 'undefined') return;
  try { if (typeof BroadcastChannel !== 'undefined') { const channel = new BroadcastChannel(channelName); channel.postMessage(notice); channel.close(); } } catch { /* Notifications must never invalidate a committed save. */ }
  try { localStorage.setItem(noticeKey, JSON.stringify(notice)); } catch { /* Atomic revision checks still prevent overwrites. */ }
}
export function subscribeWorkspace(listener: (notice: WorkspaceNotice) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const receive = (raw: unknown) => {
    if (!raw || typeof raw !== 'object' || !('revision' in raw) || !Number.isSafeInteger(raw.revision) || Number(raw.revision) < 0 || !('tabId' in raw) || typeof raw.tabId !== 'string' || raw.tabId === tabId || !('updatedAt' in raw) || typeof raw.updatedAt !== 'string') return;
    listener(raw as WorkspaceNotice);
  };
  let channel: BroadcastChannel | undefined;
  try { if (typeof BroadcastChannel !== 'undefined') channel = new BroadcastChannel(channelName); } catch { /* Fall back to storage events and atomic revision checks. */ }
  if (channel) channel.onmessage = event => receive(event.data);
  const storage = (event: StorageEvent) => {
    if (event.key !== noticeKey || !event.newValue || event.newValue.length > 1000) return;
    try { receive(JSON.parse(event.newValue)); } catch { /* Ignore unrelated or malformed notifications. */ }
  };
  window.addEventListener('storage', storage);
  return () => { channel?.close(); window.removeEventListener('storage', storage); };
}
function readSnapshots(raw: unknown): WorkspaceSnapshot[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap(item => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.createdAt !== 'string' || !Number.isFinite(Date.parse(item.createdAt)) || !Number.isSafeInteger(item.revision) || item.revision < 0 || !['automatic', 'manual', 'before-restore'].includes(item.reason)) return [];
    const parsed = backupSchema.safeParse({ schemaVersion: 1, exportedAt: item.createdAt, projects: item.projects });
    return parsed.success ? [{ id: item.id, createdAt: item.createdAt, revision: item.revision, reason: item.reason, projects: parsed.data.projects, ...(typeof item.rawRecovery === 'string' ? { rawRecovery: item.rawRecovery } : {}) } as WorkspaceSnapshot] : [];
  });
}
export function boundedSnapshots(snapshots: WorkspaceSnapshot[]): WorkspaceSnapshot[] {
  const selected: WorkspaceSnapshot[] = [];
  let bytes = 0;
  for (const snapshot of snapshots.slice().reverse()) {
    const size = new TextEncoder().encode(JSON.stringify(snapshot)).length;
    if (size > snapshotBudgetBytes || selected.length >= snapshotLimit || bytes + size > snapshotBudgetBytes) continue;
    selected.push(snapshot); bytes += size;
  }
  return selected.reverse();
}
function snapshotOf(state: WorkspaceState, reason: WorkspaceSnapshot['reason']): WorkspaceSnapshot {
  return { id: crypto.randomUUID(), createdAt: new Date().toISOString(), revision: state.revision, projects: state.projects, reason, ...(state.recovery ? { rawRecovery: state.recovery.rawJson } : {}) };
}
export function appendSnapshot(snapshots: WorkspaceSnapshot[], snapshot: WorkspaceSnapshot, requireRetention: boolean) {
  const next = boundedSnapshots([...snapshots, snapshot]);
  if (requireRetention && !next.some(item => item.id === snapshot.id)) throw Error('The current workspace exceeds the local snapshot budget. Download a portable backup before reducing its size or restoring through import. Nothing was replaced.');
  return next;
}
type Mutation = { projects?: Project[]; expectedRevision: number; snapshotOnly?: boolean; restoreId?: string; clearSnapshots?: boolean };
async function writeWorkspace({ projects, expectedRevision, snapshotOnly, restoreId, clearSnapshots }: Mutation): Promise<{ revision: number; projects: Project[] }> {
  const validated = projects === undefined ? undefined : backupSchema.parse({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects }).projects;
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', 'readwrite'), store = tx.objectStore('workspace');
    const currentRequest = store.get('projects'), snapshotsRequest = store.get('snapshots');
    let failure: unknown, result: { revision: number; projects: Project[] }, changed = false, applied = false;
    const apply = () => {
      if (applied || currentRequest.readyState !== 'done' || snapshotsRequest.readyState !== 'done') return;
      applied = true;
      try {
        const current = decodeWorkspace(currentRequest.result);
        if (current.revision !== expectedRevision) throw new WorkspaceConflictError(current.revision);
        if (clearSnapshots) { store.delete('snapshots'); result = { revision: current.revision, projects: current.projects }; return; }
        const snapshots = readSnapshots(snapshotsRequest.result), restored = restoreId ? snapshots.find(item => item.id === restoreId) : undefined;
        if (restoreId && !restored) throw Error('That snapshot is no longer available. Refresh the snapshot list.');
        if (current.recovery && !restoreId && !snapshotOnly) throw new WorkspaceRecoveryRequiredError();
        const nextProjects = restored?.projects ?? validated ?? current.projects;
        if (snapshotOnly) {
          const snapshot = snapshotOf(current, 'manual'), next = appendSnapshot(snapshots, snapshot, true);
          store.put(next, 'snapshots'); result = { revision: current.revision, projects: current.projects }; return;
        }
        if (!restoreId && JSON.stringify(current.projects) === JSON.stringify(nextProjects)) { result = { revision: current.revision, projects: current.projects }; return; }
        const last = snapshots.at(-1);
        const shouldSnapshot = !!restoreId || (current.projects.length > 0 && (!last || Date.now() - Date.parse(last.createdAt) >= snapshotInterval));
        if (shouldSnapshot) store.put(appendSnapshot(snapshots, snapshotOf(current, restoreId ? 'before-restore' : 'automatic'), !!restoreId), 'snapshots');
        if (current.revision >= Number.MAX_SAFE_INTEGER) throw Error('The workspace revision limit was reached. Export a portable backup before continuing.');
        const revision = current.revision + 1;
        store.put({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: nextProjects, revision }, 'projects');
        changed = true; result = { revision, projects: nextProjects };
      } catch (error) { failure = error; tx.abort(); }
    };
    currentRequest.onsuccess = apply; snapshotsRequest.onsuccess = apply;
    tx.oncomplete = () => { db.close(); if (changed) notifyWorkspace(result.revision); resolve(result); };
    tx.onabort = () => { db.close(); reject(failure ?? tx.error ?? Error('Local save failed. Keep this tab open and download a recovery backup.')); };
  });
}
export async function saveWorkspace(projects: Project[], expectedRevision: number): Promise<number> { return (await writeWorkspace({ projects, expectedRevision })).revision; }
export async function saveProjects(projects: Project[]) { const current = await loadWorkspace(); await saveWorkspace(projects, current.revision); }
export async function captureWorkspaceSnapshot(expectedRevision: number): Promise<void> { await writeWorkspace({ expectedRevision, snapshotOnly: true }); }
export async function clearWorkspaceSnapshots(expectedRevision: number): Promise<void> { await writeWorkspace({ expectedRevision, clearSnapshots: true }); }
export async function listWorkspaceSnapshots(): Promise<SnapshotSummary[]> {
  return readSnapshots(await readRecord('snapshots')).map(({ projects, rawRecovery, ...summary }) => ({ ...summary, projectCount: projects.length, referenceCount: projects.reduce((sum, item) => sum + item.papers.length, 0), recoveryIncluded: !!rawRecovery })).reverse();
}
export async function loadWorkspaceSnapshot(id: string): Promise<WorkspaceSnapshot> { const snapshot = readSnapshots(await readRecord('snapshots')).find(item => item.id === id); if (!snapshot) throw Error('That snapshot is unavailable or could not be validated.'); return snapshot; }
export async function restoreWorkspaceSnapshot(id: string, expectedRevision: number): Promise<{ projects: Project[]; revision: number }> { return writeWorkspace({ expectedRevision, restoreId: id }); }
export function download(name: string, body: string, type = 'text/plain') { const url = URL.createObjectURL(new Blob([body], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
