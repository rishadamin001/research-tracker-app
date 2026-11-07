import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject, paperSchema, projectSchema } from '../src/lib/model';
import { createBackup, parseBackupFile } from '../src/lib/backup';
import { updateProject } from '../src/lib/workflow';
import { projectHistory, questionVersionLimit } from '../src/lib/research-trail';

test('question drafts persist without versioning each keystroke, then one commit records reason and affected work', async () => {
  let project = createProject('Question trail');
  project = updateProject(project, { question: 'How do students choose study spaces?' });
  const paper = paperSchema.parse({ id: 'source', title: 'Located evidence', authors: 'A', year: 2026, doi: null, journal: 'J', url: '', oa: null, source: 'manual', decision: 'include', reason: 'Fits scope', evidenceClaims: [{
    id: crypto.randomUUID(), claimType: 'finding', claimText: 'Commuters prioritize access.', evidenceLevel: 'full_text', locator: 'Page 9', interpretation: '', uncertainty: '', createdAt: new Date().toISOString(), reviewStatus: 'reviewed', gapRole: 'none',
  }] });
  project = updateProject(project, { papers: [paper], design: 'Interviews with students' });
  for (const questionDraft of ['How', 'How do', 'How do commuter students choose study spaces?']) project = updateProject(project, { questionDraft });
  assert.equal(project.questionVersions?.length, 1);
  const restored = (await parseBackupFile(JSON.stringify(await createBackup([project])))).projects[0];
  assert.equal(restored.questionDraft, 'How do commuter students choose study spaces?');
  assert.equal(restored.question, 'How do students choose study spaces?');
  project = updateProject(restored, { question: restored.questionDraft!, questionDraft: undefined, questionChangeReason: 'Narrow to the population included in the evidence.' });
  assert.equal(project.questionVersions?.length, 2);
  const revision = project.questionVersions!.at(-1)!;
  assert.match(revision.reason, /population/); assert.equal(revision.affectedClaimCount, 1);
  assert.deepEqual(revision.affectedPaperIds, ['source']); assert.ok(revision.affectedStages.includes('methods'));
  assert.equal(project.papers[0].evidenceClaims![0].reviewStatus, 'needs_review');
  assert.ok(project.needsReview.includes('extract'));
  assert.equal(project.projectEvents?.filter(event => event.kind === 'QUESTION_CHANGED').length, 1);
  assert.doesNotThrow(() => projectSchema.parse(project));
});

test('legacy question baseline records capture time honestly and version limit never silently commits', () => {
  let project = createProject(); project.question = 'Legacy wording';
  project = updateProject(project, { question: 'A revised question' }, '2026-11-07T12:00:00.000Z');
  assert.equal(project.questionVersions?.[0].origin, 'legacy-baseline');
  assert.match(project.questionVersions![0].reason, /original edit time was not recorded/);
  assert.equal(project.questionVersions![0].recordedAt, '2026-11-07T12:00:00.000Z');
  const base = project.questionVersions![1];
  project.questionVersions = Array.from({ length: questionVersionLimit }, (_, index) => ({ ...base, id: crypto.randomUUID(), version: index + 1 }));
  const next = updateProject(project, { question: 'Over limit', questionDraft: undefined });
  assert.equal(next.question, project.question); assert.equal(next.questionDraft, 'Over limit');
  assert.equal(next.questionVersions?.length, questionVersionLimit);
});

test('project history coalesces consecutive draft editing but preserves individual decisions and source IDs', () => {
  let project = createProject();
  project = updateProject(project, { design: 'First draft' }, '2026-11-07T12:00:00.000Z');
  project = updateProject(project, { design: 'Improved draft' }, '2026-11-07T12:00:05.000Z');
  assert.equal(project.projectEvents?.filter(event => event.kind === 'METHOD_CHANGED').length, 1);
  project = updateProject(project, { decisions: [{ at: '2026-11-07T12:00:10.000Z', note: '=Private decision' }] }, '2026-11-07T12:00:10.000Z');
  project = updateProject(project, { decisions: [...project.decisions, { at: '2026-11-07T12:00:11.000Z', note: 'Another decision' }] }, '2026-11-07T12:00:11.000Z');
  assert.equal(project.projectEvents?.filter(event => event.kind === 'DECISION_RECORDED').length, 2);
  assert.equal(projectHistory(project).filter(event => event.kind === 'DECISION_RECORDED').length, 2);
  const envelope = projectSchema.parse(project); assert.equal(envelope.projectEvents?.length, project.projectEvents?.length);
});

test('a question revision flags an existing sampling-only plan for review', () => {
  const original = createProject(); original.question = 'Which students use the library?'; original.sampling = 'Sample all enrolled students.';
  const changed = updateProject(original, { question: 'Which first-year commuters use the library?' });
  assert.ok(changed.needsReview.includes('methods'));
  assert.ok(changed.questionVersions!.at(-1)!.affectedStages.includes('methods'));
  assert.equal(changed.sampling, original.sampling);
});
