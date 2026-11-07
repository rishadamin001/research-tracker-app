import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createProject, paperSchema, projectSchema } from '../src/lib/model';
import { duplicatePairs, resolveDuplicate, undoDuplicate } from '../src/lib/duplicates';
const paper = (id: string, doi: string | null) => paperSchema.parse({ id, title: 'Student housing and wellbeing in urban universities', authors: 'A Scholar', year: 2024, doi, journal: 'Test', url: '', oa: null, source: 'fixture' });
test('normalized DOI variants match, while similar titles require author and year', () => {
  const p = createProject(); p.papers = [paper('a', '10.1234/ABC'), paper('b', 'https://doi.org/10.1234/abc')];
  assert.equal(duplicatePairs(p)[0].kind, 'Exact DOI'); p.papers[1].doi = null;
  assert.equal(duplicatePairs(p)[0].kind, 'Possible match'); p.papers[1].authors = 'B Scholar'; assert.equal(duplicatePairs(p).length, 0);
});
test('merge preserves history in backup schema and undo restores original records', () => {
  const p = createProject(); p.papers = [paper('a', '10.1234/a'), paper('b', '10.1234/a')]; p.papers[0].notes = 'First'; p.papers[1].notes = 'Second'; p.papers[1].decision = 'include';
  const patch = resolveDuplicate(p, duplicatePairs(p)[0], 'merge'); const merged = projectSchema.parse({ ...p, ...patch });
  assert.equal(merged.papers.length, 1); assert.equal(merged.papers[0].decision, 'maybe'); assert.match(merged.papers[0].notes, /Second/);
  const restored = { ...merged, ...undoDuplicate(merged, merged.duplicateReviews![0].id) }; assert.deepEqual(restored.papers, p.papers); assert.ok(restored.duplicateReviews![0].undoneAt);
});
test('keep both suppresses only that pair and undo retains newer edits', () => {
  const p = createProject(); p.papers = [paper('a', null), paper('b', null)];
  const kept = { ...p, ...resolveDuplicate(p, duplicatePairs(p)[0], 'both') }; assert.equal(duplicatePairs(kept).length, 0); assert.equal(kept.papers.length, 2);
  const merged = { ...p, ...resolveDuplicate(p, duplicatePairs(p)[0], 'merge') }; merged.papers[0] = { ...merged.papers[0], notes: 'Newer note' };
  const undone = { ...merged, ...undoDuplicate(merged, merged.duplicateReviews![0].id) }; assert.equal(undone.papers[0].notes, 'Newer note'); assert.equal(undone.papers.length, 2);
});

test('merge rejects excess combined reference IDs and shared record IDs without changing originals', () => {
  const p = createProject(); p.papers = [paper('a', null), paper('b', null)];
  p.papers[0].referenceIds = Array.from({ length: 300 }, (_, i) => `https://openalex.org/W${i}`);
  p.papers[1].referenceIds = Array.from({ length: 300 }, (_, i) => `https://openalex.org/W${i + 300}`);
  assert.throws(() => resolveDuplicate(p, duplicatePairs(p)[0], 'merge'), /reference limit/);
  assert.equal(p.papers.length, 2);
  p.papers[1].id = 'a';
  assert.throws(() => resolveDuplicate(p, duplicatePairs(p)[0], 'merge'), /share an identifier/);
  assert.equal(p.papers.length, 2);
});

test('different screening events sharing an ID both survive a merge', () => {
  const p = createProject(); p.papers = [paper('a', null), paper('b', null)];
  const event = { id: crypto.randomUUID(), at: '2026-11-07T00:00:00.000Z', stage: 'title_abstract' as const, decision: 'include' as const, reason: 'Matches criteria', reviewer: 'Researcher', sourceReference: '' };
  p.papers[0].screeningEvents = [event];
  p.papers[1].screeningEvents = [{ ...event, reason: 'Another rationale' }];
  const result = resolveDuplicate(p, duplicatePairs(p)[0], 'merge');
  assert.equal(result.papers![0].screeningEvents!.length, 2);
  assert.notEqual(result.papers![0].screeningEvents![0].id, result.papers![0].screeningEvents![1].id);
  assert.equal(result.duplicateReviews![0].archived!.screeningEvents![0].reason, 'Another rationale');
});
