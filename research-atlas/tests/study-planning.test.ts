import test from 'node:test';
import assert from 'node:assert/strict';
import { appraisalGuidance, dmpFields, dmpMarkdown, methodContextSchema, reportingGuidance, routeMethods, structuredDmpSchema, studyDesignGuidance } from '../src/lib/study-planning';
import { createProject, parseBackup } from '../src/lib/model';

const complete = methodContextSchema.parse({ goal: 'describe', unit: 'Public district records', evidence: 'existing', measurement: 'numbers', causalIntent: 'no', intervention: 'not-applicable', ethics: 'documented', resources: 'Two months, public licensed data and a supervisor.' });

test('methods router abstains for unknown inputs and unavailable evidence without guessing from a topic', () => {
  assert.equal(routeMethods(methodContextSchema.parse({})).status, 'insufficient-information');
  for (const patch of [{ goal: 'uncertain' }, { evidence: 'unavailable' }, { causalIntent: 'unsure' }, { ethics: 'unknown' }, { resources: '' }] as const) {
    const result = routeMethods({ ...complete, ...patch });
    assert.equal(result.status, 'insufficient-information');
    assert.equal(result.candidates.length, 0);
    assert.ok(result.missing.length > 0);
  }
});

test('causal intent with no intervention requires identification review and never becomes an approved trial', () => {
  const observation = routeMethods({ ...complete, causalIntent: 'yes', intervention: 'no', ethics: 'consultation' });
  assert.equal(observation.status, 'conditional-candidates');
  assert.match(observation.candidates[0].title, /requiring methods review/);
  assert.match(observation.candidates[0].conditions.join(' '), /identification strategy/);
  assert.match(observation.cautions.join(' '), /approvals/);
  assert.equal(routeMethods({ ...complete, causalIntent: 'yes' }).status, 'insufficient-information');
});

test('explicit noncausal numeric and qualitative goals produce conditional starting points', () => {
  const numeric = routeMethods(complete);
  assert.match(numeric.candidates[0].title, /observational/);
  assert.match(numeric.candidates[0].conditions.join(' '), /does not establish causation/);
  const qualitative = routeMethods({ ...complete, goal: 'understand', measurement: 'text' });
  assert.match(qualitative.candidates[0].title, /Qualitative/);
  assert.ok(qualitative.candidates[0].conditions.length > 0);
});

test('generic DMP exports every field, unknown prompts and earlier notes without silently overwriting them', () => {
  const dmp = structuredDmpSchema.parse({ types: 'Anonymized interview transcripts', backup: 'Weekly encrypted backup with a restoration check' });
  const output = dmpMarkdown('Interview study', dmp, 'Earlier consent restrictions retained.');
  for (const [, title] of dmpFields) assert.ok(output.includes(`## ${title}`));
  assert.match(output, /Earlier consent restrictions retained/);
  assert.match(output, /Not yet specified/);
  assert.match(output, /Weekly encrypted backup/);
});

test('old backups keep freeform notes and new optional planning fields survive export/import', () => {
  const old = createProject('Existing study');
  old.dataPlan = 'Original plan notes';
  const oldRestored = parseBackup(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [old] })).projects[0];
  assert.equal(oldRestored.dataPlan, 'Original plan notes');
  assert.equal(oldRestored.structuredDmp, undefined);
  const project = { ...old, methodContext: complete, structuredDmp: structuredDmpSchema.parse({ source: 'Public records' }) };
  const restored = parseBackup(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] })).projects[0];
  assert.deepEqual(restored.methodContext, complete);
  assert.equal(restored.structuredDmp?.source, 'Public records');
});

test('design, reporting and appraisal registries are separate and carry editions and checked sources', () => {
  const registryIds = new Set<string>();
  for (const registry of [studyDesignGuidance, reportingGuidance, appraisalGuidance]) {
    assert.ok(registry.length > 0);
    for (const item of registry) {
      assert.ok(!registryIds.has(item.id)); registryIds.add(item.id);
      assert.ok(item.edition.length > 0 && item.scope.length > 0);
      assert.match(item.url, /^https:\/\//);
      assert.match(item.checkedAt, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});
