import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, paperSchema } from '../src/lib/model';
import { researchPassport, researchPassportMarkdown, researchReadiness } from '../src/lib/research-readiness';
import { replaceDeskPaper } from '../src/lib/evidence-desk';

const at = '2026-11-08T00:00:00.000Z';
function source(id = 'source-a') {
  return paperSchema.parse({ id, title: 'Commuter study', authors: 'A. Scholar', year: 2025, doi: '10.1234/commuters', journal: 'Test journal', source: 'RIS', url: 'https://example.org/source', oa: null });
}

test('readiness reports record completeness without mutating a provisional project or imposing participant recruitment', () => {
  const project = createProject('Literature study');
  project.studyType = 'literature';
  project.questionDraft = 'What remains uncertain about commuter study space?';
  const before = JSON.stringify(project);
  const prompts = researchReadiness(project);
  assert.ok(prompts.some(prompt => prompt.id === 'question-draft'));
  assert.match(prompts.find(prompt => prompt.id === 'methods')!.detail, /source selection/);
  assert.ok(!prompts.some(prompt => /must recruit|participant-recruitment workflow/i.test(prompt.detail)));
  assert.ok(prompts.every(prompt => !('score' in prompt)));
  assert.equal(JSON.stringify(project), before);
});

test('readiness distinguishes reviewed located findings from metadata and unresolved draft interpretations', () => {
  const project = createProject();
  project.papers = [{ ...source(), decision: 'include', reason: 'Matches the population', evidenceClaims: [{ id: crypto.randomUUID(), claimType: 'finding', claimText: 'A study exists', evidenceLevel: 'metadata', locator: 'Title', interpretation: '', uncertainty: '', createdAt: at, reviewStatus: 'reviewed', gapRole: 'none' }] }];
  assert.ok(researchReadiness(project).some(prompt => prompt.id === 'located-evidence'));
  project.papers[0].evidenceClaims![0] = { ...project.papers[0].evidenceClaims![0], evidenceLevel: 'full_text', claimText: 'Travel time limited access', locator: 'Results, Table 3', reviewStatus: 'draft' };
  assert.ok(researchReadiness(project).some(prompt => prompt.id === 'claim-review'));
  project.papers[0].evidenceClaims![0].reviewStatus = 'reviewed';
  assert.ok(!researchReadiness(project).some(prompt => prompt.id === 'located-evidence' || prompt.id === 'claim-review'));
});

test('passport retains actual query filters, selection history, source locations and uncertainty while omitting unknown secret fields', () => {
  const project = createProject('Portable review');
  project.question = 'How do commuter students access study spaces?'; project.setting = 'One campus'; project.studyType = 'qualitative';
  project.papers = [{ ...source(), decision: 'exclude', reason: 'Wrong setting', screeningEvents: [{ id: crypto.randomUUID(), at, stage: 'title_abstract', decision: 'exclude', reason: 'Wrong setting', reviewer: 'Local reviewer', sourceReference: 'RIS · 10.1234/commuters' }], evidenceClaims: [{ id: crypto.randomUUID(), claimType: 'finding', claimText: 'Travel time shaped access', evidenceLevel: 'full_text', locator: 'Table 3, page 8', interpretation: 'May matter for commuters', uncertainty: 'One campus only', createdAt: at, reviewStatus: 'reviewed', gapRole: 'challenges' }] }];
  project.searches = [{ query: 'commuter students', source: 'Imported database log', date: at, count: 1, filters: '2024 onward; English' }];
  const exported = researchPassport({ ...project, secretKey: 'do-not-export' } as typeof project, at);
  assert.equal(exported.sources[0].screeningEvents[0].reason, 'Wrong setting');
  assert.equal(exported.sources[0].claims[0].locator, 'Table 3, page 8');
  assert.equal(exported.searches[0].filters, '2024 onward; English');
  assert.equal(JSON.stringify(exported).includes('do-not-export'), false);
  const markdown = researchPassportMarkdown(project, at);
  assert.match(markdown, /Wrong setting/); assert.match(markdown, /Table 3, page 8/); assert.match(markdown, /One campus only/);
  assert.match(markdown, /not a portable restore backup or tamper-proof audit/);
});

test('evidence desk updates exactly one legacy record with a repeated identifier and readiness flags ambiguous identity', () => {
  const project = createProject(); project.papers = [source(''), { ...source(''), title: 'A distinct old source' }];
  const papers = replaceDeskPaper(project, 1, { notes: 'Only the second source' });
  assert.equal(papers[0].notes, ''); assert.equal(papers[1].notes, 'Only the second source');
  assert.notEqual(papers[1], project.papers[1]); assert.equal(project.papers[1].notes, '');
  assert.ok(researchReadiness(project).some(prompt => prompt.id === 'source-identity'));
});

test('readiness includes writing support review when an unsupported authored paragraph is present', () => {
  const project = createProject(); project.manuscript = '## Discussion\n\nA substantive claim without a located source.';
  assert.ok(researchReadiness(project).some(prompt => prompt.id === 'writing-support'));
});
