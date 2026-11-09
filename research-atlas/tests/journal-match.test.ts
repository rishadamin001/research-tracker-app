import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, paperSchema, projectSchema } from '../src/lib/model';
import { decodeWorkspace } from '../src/lib/storage';
import { journalSuggestions, parseJournalIdentity, prepareJournalQuery, suggestionCandidate } from '../src/lib/journal-match';
import type { SearchRun } from '../src/lib/search-provenance';

const run: SearchRun = { id: crypto.randomUUID(), provider: 'OpenAlex', mode: 'public-api', userQuery: 'student housing', executedQuery: 'student housing', filters: [], supportedOperators: [], unsupportedOperators: [], startedAt: '2026-11-09T00:00:00.000Z', completedAt: '2026-11-09T00:00:00.000Z', pageSize: 20, cursorState: 'not-requested', pages: [{ page: 1, requestedAt: '2026-11-09T00:00:00.000Z' }], providerDocsDate: '2026-11-09' };
const paper = (id: string, issns: string[], doi = `10.1234/${id}`) => paperSchema.parse({ id, title: `Article ${id}`, authors: '', year: 2025, doi, journal: 'Example journal', publisher: 'Example publisher', venueType: 'journal', issns, url: `https://doi.org/${doi}`, oa: null, source: 'OpenAlex' });
test('journal suggestions deduplicate DOI variants and group only overlapping supplied ISSNs', () => {
  const papers = [paper('1', ['0028-0836']), paper('2', ['0028-0836'], '10.1234/1'), paper('3', ['1476-4687']), paper('4', ['0028-0836', '1476-4687']), paper('5', ['1234-5679'])];
  const result = journalSuggestions(papers, run);
  assert.equal(result.length, 2); assert.equal(result[0].papers.length, 3); assert.equal(result[1].papers.length, 1);
  assert.equal(result[0].papers.some(item => item.paper.id === '2'), false);
  assert.equal(journalSuggestions([{ ...paper('unknown', []), publisher: undefined }], run).length, 0);
});
test('identity verification rejects mismatched ISSNs and never turns missing APC into zero', () => {
  const raw = { id: 'https://openalex.org/S1', display_name: 'Example journal', type: 'journal', issn: ['0028-0836'], homepage_url: 'javascript:alert(1)' };
  const result = parseJournalIdentity(raw, '0028-0836');
  assert.equal(result.fee, undefined); assert.equal(result.homepage, undefined);
  assert.throws(() => parseJournalIdentity(raw, '1476-4687'), /does not match/);
});
test('suggestion provenance and local manuscript draft survive validation and workspace migration', () => {
  const project = createProject('Journal choices');
  project.journalCandidates = [suggestionCandidate(journalSuggestions([paper('1', ['0028-0836'])], run)[0])];
  project.journalMatchDraft = { title: 'Housing study', abstract: 'Private local wording', keywords: '', query: 'student housing' };
  assert.equal(project.journalCandidates[0].checks.length, 0);
  assert.match(project.journalCandidates[0].cost, /unknown/);
  assert.deepEqual(projectSchema.parse(project), project);
  assert.deepEqual(decodeWorkspace({ schemaVersion: 3, projects: [project] }).projects[0], project);
  assert.equal(decodeWorkspace({ schemaVersion: 2, projects: [createProject('Legacy')] }).projects[0].title, 'Legacy');
  assert.equal(prepareJournalQuery('Ignored title', 'Private abstract', 'housing; students'), 'housing students');
});
