import assert from 'node:assert/strict';
import test from 'node:test';
import { createProject, parseBackup, projectSchema } from '../src/lib/model';
import { dmpExampleFor, pathwayFor } from '../src/lib/research-pathway';

test('a pathway is an explicit optional choice and changing it preserves recorded work', () => {
  const legacy = createProject('Existing study');
  legacy.design = 'Author-defined design'; legacy.sampling = 'Earlier selection rationale';
  legacy.questionDraft = 'Provisional wording'; legacy.dataPlan = 'Earlier material-management notes';
  assert.equal(pathwayFor(legacy), undefined);
  const selected = projectSchema.parse({ ...legacy, studyType: 'literature' });
  const changed = projectSchema.parse({ ...selected, studyType: 'qualitative' });
  const restored = parseBackup(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [changed] })).projects[0];
  assert.equal(restored.studyType, 'qualitative');
  assert.equal(restored.design, legacy.design); assert.equal(restored.sampling, legacy.sampling);
  assert.equal(restored.questionDraft, legacy.questionDraft); assert.equal(restored.dataPlan, legacy.dataPlan);
  assert.equal(pathwayFor(selected)?.id, 'literature');
  assert.equal(pathwayFor(legacy), undefined, 'reading prompts never mutates an older project');
});

test('literature and qualitative examples distinguish source reuse and identification risks', () => {
  assert.match(pathwayFor({ studyType: 'literature' })!.samplingPrompt, /eligible studies or documents/);
  assert.match(pathwayFor({ studyType: 'literature' })!.ethicsPrompt, /not automatically exempt/);
  assert.match(dmpExampleFor({ studyType: 'literature' }, 'sharing'), /copyright/);
  assert.match(dmpExampleFor({ studyType: 'qualitative' }, 'sensitivity'), /even after removing names/);
  assert.match(dmpExampleFor({}, 'backup'), /restoration check/);
});
