import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProject } from '../src/lib/model';
import { appendSnapshot, boundedSnapshots, decodeWorkspace, snapshotBudgetBytes, snapshotLimit, workspaceFormatVersion, type WorkspaceSnapshot } from '../src/lib/storage';

test('legacy workspace loads at revision zero without losing valid project content', () => {
  const project = createProject('Existing research'); project.question = 'What changes?';
  const loaded = decodeWorkspace({ schemaVersion: 1, exportedAt: '2026-11-07', projects: [project] });
  assert.equal(loaded.revision, 0); assert.deepEqual(loaded.projects, [project]); assert.equal(loaded.recovery, undefined);
});

test('new workspace envelopes preserve structured writing and refuse unknown future formats', () => {
  const project = createProject('Structured work');
  project.manuscript = 'Original manuscript remains available.';
  project.studyType = 'literature';
  project.writingStudio = { sections: [{ id: 'introduction', body: 'A traceable structured draft.' }], citations: [], evidenceLinks: [] };
  const loaded = decodeWorkspace({ schemaVersion: workspaceFormatVersion, revision: 4, projects: [project] });
  assert.equal(workspaceFormatVersion, 4);
  assert.deepEqual(loaded.projects, [project]);
  assert.throws(() => decodeWorkspace({ schemaVersion: 99, revision: 4, projects: [project] }), /No stored records have been changed/);
});
test('one invalid project is isolated while original raw records remain recoverable', () => {
  const valid = createProject('Valid research'); const raw = { schemaVersion: 1, revision: 9, projects: [valid, { id: 'broken', title: 'Irreplaceable title', papers: 'bad' }] };
  const loaded = decodeWorkspace(raw);
  assert.equal(loaded.projects.length, 1); assert.equal(loaded.projects[0].title, 'Valid research'); assert.equal(loaded.revision, 9);
  assert.equal(loaded.recovery?.invalidProjectCount, 1); assert.deepEqual(JSON.parse(loaded.recovery!.rawJson), raw);
});
test('duplicate project IDs trigger recovery rather than silently collapsing records', () => {
  const a = createProject('First'); const b = { ...a, title: 'Second same ID' };
  const loaded = decodeWorkspace({ schemaVersion: 1, projects: [a, b] });
  assert.equal(loaded.projects.length, 1); assert.equal(loaded.recovery?.invalidProjectCount, 1); assert.match(loaded.recovery!.rawJson, /Second same ID/);
});
test('rolling local snapshots respect count and byte bounds while retaining newest copies', () => {
  const snapshots: WorkspaceSnapshot[] = Array.from({ length: 12 }, (_, index) => ({ id: String(index), createdAt: new Date(index * 60000).toISOString(), revision: index, projects: [createProject('Snapshot ' + index)], reason: 'automatic' }));
  const kept = boundedSnapshots(snapshots);
  assert.equal(kept.length, snapshotLimit); assert.equal(kept[0].id, '4'); assert.equal(kept.at(-1)!.id, '11');
  assert.ok(new TextEncoder().encode(JSON.stringify(kept)).length < snapshotBudgetBytes);
  const tooLarge: WorkspaceSnapshot = { ...snapshots[0], rawRecovery: 'x'.repeat(snapshotBudgetBytes + 1) };
  assert.deepEqual(boundedSnapshots([tooLarge]), []); assert.equal(snapshots.length, 12);
  assert.throws(() => appendSnapshot(snapshots, tooLarge, true), /Nothing was replaced/);
  assert.equal(appendSnapshot([], tooLarge, false).length, 0);
});
