import test from 'node:test';
import assert from 'node:assert/strict';
import { createBackup, parseBackupFile } from '../src/lib/backup';
import { createProject } from '../src/lib/model';
import { defaultPreferences } from '../src/lib/preferences';

test('v3 backup verifies checksum and preserves project decisions, claims and settings across origins', async () => {
  const project = createProject('Portable research');
  const at = '2026-11-07T00:00:00.000Z';
  project.question = 'How do commuters describe study-space access?';
  project.papers = [{ id: 'reference', title: 'A source', authors: 'A. Scholar', year: 2025, doi: null,
    url: 'https://example.org/source', journal: 'A journal', oa: null, source: 'RIS', notes: '', finding: '', methods: '',
    limitations: '', locator: '', decision: 'include', reason: 'Relevant population', researchProblem: '', dataset: '',
    screeningEvents: [{ id: crypto.randomUUID(), stage: 'title_abstract', decision: 'include', reason: 'Relevant population', reviewer: 'Researcher', sourceReference: 'https://example.org/source', at }],
    evidenceClaims: [{ id: crypto.randomUUID(), claimType: 'finding', claimText: 'Travel time shaped access',
      evidenceLevel: 'full_text', locator: 'Page 4', interpretation: '', uncertainty: '', reviewStatus: 'reviewed', reviewedAt: at, createdAt: at, gapRole: 'supports' }] }];
  project.notebookNotes = [{
    id: crypto.randomUUID(), kind: 'question', text: 'Check whether travel time was measured.',
    sources: [{ paperId: 'reference', title: 'A source', doi: null }],
    createdAt: at, updatedAt: at, status: 'open', nextStep: 'Read the methods section',
  }];
  const envelope = await createBackup([project], { sourceOrigin: 'https://rishadamin001.github.io', createdAt: at, preferences: defaultPreferences });
  assert.equal(envelope.backupVersion, 3);
  assert.equal(envelope.sourceOrigin, 'https://rishadamin001.github.io');
  assert.match(envelope.checksum, /^sha256:[a-f0-9]{64}$/);
  const restored = await parseBackupFile(JSON.stringify(envelope));
  assert.deepEqual(restored.projects, [project]);
  assert.deepEqual(restored.preferences, defaultPreferences);
  assert.equal(restored.manifest.integrity, 'verified');
  assert.equal(restored.manifest.screeningEventCount, 1);
  assert.equal(restored.manifest.evidenceClaimCount, 1);
  assert.equal(restored.manifest.notebookNoteCount, 1);
  // Import is deliberately not tied to the source origin or current website.
  const reordered = Object.fromEntries(Object.entries(envelope).reverse());
  assert.deepEqual((await parseBackupFile(JSON.stringify(reordered))).projects, [project]);
});

test('legacy v1 backup migrates with explicit unchecked provenance', async () => {
  const project = createProject('Older project');
  project.question = 'Keep this question';
  const result = await parseBackupFile(JSON.stringify({ schemaVersion: 1, exportedAt: '2026-01-01T00:00:00.000Z', projects: [project] }));
  assert.deepEqual(result.projects, [project]);
  assert.equal(result.manifest.backupVersion, 1);
  assert.equal(result.manifest.integrity, 'legacy-unchecked');
  assert.equal(result.manifest.preferencesIncluded, false);
});

test('changed content, invalid schema and unsupported formats cannot be imported', async () => {
  const envelope = await createBackup([createProject('Original')]);
  await assert.rejects(() => parseBackupFile(JSON.stringify(envelope).replace('Original', 'Changed')), /integrity check failed/);
  await assert.rejects(() => parseBackupFile(JSON.stringify({ ...envelope, backupVersion: 999 })), /not a valid Research Atlas/);
  await assert.rejects(() => parseBackupFile('{not json'), /not a valid Research Atlas/);
  await assert.rejects(() => parseBackupFile(' '.repeat(10_000_001)), /10 MB/);
  assert.equal(envelope.projects[0].title, 'Original');
});

test('backup exports known project/settings fields and omits added secret fields', async () => {
  const project = { ...createProject(), apiKey: 'private-not-for-export' };
  const envelope = await createBackup([project]);
  assert.equal(JSON.stringify(envelope).includes('private-not-for-export'), false);
  assert.equal((await parseBackupFile(JSON.stringify(envelope))).manifest.projectCount, 1);
  assert.equal((await parseBackupFile(JSON.stringify(await createBackup([])))).projects.length, 0);
});
