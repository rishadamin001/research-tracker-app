import assert from 'node:assert/strict';
import test from 'node:test';
import { evidenceClaimSchema } from '../src/lib/evidence-ledger';
import { paperSchema } from '../src/lib/model';
import { notebookEntries, notebookNoteSchema, notebookSource, notebookText } from '../src/lib/research-notebook';

const createdAt = '2026-11-11T12:00:00.000Z';
const paper = paperSchema.parse({
  id: 'source-1',
  title: 'Campus travel survey',
  authors: 'A. Example',
  year: 2025,
  journal: 'Transport Review',
  doi: '10.1234/example',
  url: 'https://example.org/survey',
  oa: null,
  source: 'Imported',
  finding: 'Older extraction wording',
  notes: 'Earlier personal notes',
  evidenceClaims: [
    evidenceClaimSchema.parse({
      id: '60d41c4a-6d4e-452e-8339-d2f56921318d', claimType: 'finding', claimText: 'Commute times varied by campus.',
      evidenceLevel: 'full_text', locator: 'Table 2', interpretation: 'Might reflect different timetables.',
      uncertainty: 'One institution only.', createdAt, reviewStatus: 'draft',
    }),
    evidenceClaimSchema.parse({
      id: 'f89df188-bee8-439a-a36e-c7db11c916c1', claimType: 'finding', claimText: 'Title-based assumption',
      evidenceLevel: 'metadata', locator: 'Title', interpretation: '', uncertainty: '', createdAt, reviewStatus: 'draft',
    }),
  ],
});

test('notebook presents located findings separately from interpretation and earlier extractions', () => {
  const entries = notebookEntries({ title: 'Campus travel', papers: [paper] });
  const findings = entries.filter(entry => entry.kind === 'finding');
  assert.equal(findings.length, 1);
  assert.equal(findings[0].text, 'Commute times varied by campus.');
  assert.equal(findings[0].locator, 'Table 2');
  assert.equal(findings[0].basis, 'Full text');
  assert.equal(entries.find(entry => entry.kind === 'interpretation')?.text, 'Might reflect different timetables.');
  assert.deepEqual(entries.filter(entry => entry.kind === 'earlier').map(entry => entry.text),
    ['Earlier personal notes', 'Older extraction wording']);
});

test('an exported next action retains source identity after the original paper leaves the project', () => {
  const note = notebookNoteSchema.parse({
    id: '79e22f8d-790c-483f-9055-fd0c4e82e9ac', kind: 'question',
    text: 'Could timetable differences explain this?', sources: [notebookSource(paper)],
    createdAt, updatedAt: createdAt, status: 'open', nextStep: 'Check published campus timetables.',
  });
  const exported = notebookText({ title: 'Campus travel', papers: [], notebookNotes: [note] });
  assert.match(exported, /Question \/ next action/);
  assert.match(exported, /Campus travel survey \(DOI: 10\.1234\/example\)/);
  assert.match(exported, /Status: Open/);
  assert.match(exported, /Next step: Check published campus timetables\./);
});
