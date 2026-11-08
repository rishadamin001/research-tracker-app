import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, paperSchema, projectSchema } from '../src/lib/model';
import { createBackup, parseBackupFile } from '../src/lib/backup';
import { changeWritingBody, currentCitationPaper, currentWritingStudio, draftBibliography, linkWritingEvidence, manuscriptMarkdown, manuscriptReferencePapers, refreshWritingCitation, writingEvidenceState, writingReviewPrompts, writingSections, writingStudioSchema } from '../src/lib/writing-studio';
import { manuscriptDocx } from '../src/lib/writing-docx';

const at = '2026-11-08T03:00:00.000Z';
function fixture() {
  const project = createProject('Commuter study');
  project.studyType = 'qualitative';
  project.manuscript = 'Earlier argument and unparsed citations remain verbatim.';
  project.papers = [paperSchema.parse({ id: 'paper-a', doi: '10.1234/commuters', title: 'Commuter access', authors: 'Ada Example', year: 2025,
    journal: 'Journal of Examples', url: 'https://example.org/source', oa: null, source: 'RIS', decision: 'include', reason: 'Relevant setting',
    evidenceClaims: [{ id: crypto.randomUUID(), claimType: 'finding', claimText: 'Travel time shaped access.', evidenceLevel: 'full_text', locator: 'Results, page 4',
      interpretation: 'May affect available study time.', uncertainty: 'One campus only.', reviewStatus: 'reviewed', reviewedAt: at, createdAt: at, gapRole: 'supports' }] })];
  return project;
}

test('located insertion retains legacy text and exports numbered bibliography plus inspectable support', async () => {
  let project = fixture();
  project = { ...project, ...changeWritingBody(project, 'results', 'Observed pattern: ') };
  const result = linkWritingEvidence(project, 'results', 'paper-a', project.papers[0].evidenceClaims![0].id, undefined, undefined, at);
  project = { ...project, ...result.patch };
  assert.equal(project.manuscript, 'Earlier argument and unparsed citations remain verbatim.');
  assert.match(project.writingStudio!.sections[0].body, /Travel time shaped access\. \[1\] \(Results, page 4\)/);
  assert.equal(project.writingStudio!.evidenceLinks[0].interpretation, 'May affect available study time.');
  assert.equal(project.writingStudio!.citations[0].sourceSnapshot.authors, 'Ada Example');
  assert.equal(writingReviewPrompts(project).some(prompt => prompt.sectionId === 'results'), false);
  const markdown = manuscriptMarkdown(project);
  for (const phrase of ['Findings and themes', 'Ada Example', '10.1234/commuters', 'Results, page 4', 'One campus only.', project.manuscript]) assert.ok(markdown.includes(phrase));
  assert.equal(manuscriptReferencePapers(project)[0].notes, '');
  const restored = await parseBackupFile(JSON.stringify(await createBackup([project])));
  assert.deepEqual(restored.projects[0].writingStudio, project.writingStudio);
  assert.equal(restored.projects[0].manuscript, project.manuscript);
});

test('changed, removed and excluded evidence stays exportable and produces review prompts', () => {
  let project = fixture();
  project = { ...project, ...linkWritingEvidence(project, 'discussion', 'paper-a', project.papers[0].evidenceClaims![0].id, undefined, undefined, at).patch };
  const snapshot = project.writingStudio!.evidenceLinks[0];
  project.papers[0] = { ...project.papers[0], decision: 'exclude', isRetracted: true,
    evidenceClaims: [{ ...project.papers[0].evidenceClaims![0], locator: 'Corrected page 5', reviewStatus: 'needs_review' }] };
  const issues = writingEvidenceState(project, snapshot).issues.join(' ');
  assert.match(issues, /excluded/); assert.match(issues, /retracted/); assert.match(issues, /changed after insertion/); assert.match(issues, /not been marked reviewed/);
  project.papers = [];
  assert.match(writingReviewPrompts(project).map(item => item.detail).join(' '), /no longer saved/);
  assert.match(draftBibliography(project), /Ada Example/);
  assert.match(manuscriptMarkdown(project), /Results, page 4/);
  assert.equal(manuscriptReferencePapers(project)[0].title, 'Commuter access');
});

test('pathway changes preserve section bodies and missing metadata/markers remain explicit', () => {
  let project = fixture();
  project.papers[0] = { ...project.papers[0], authors: '', year: null, journal: '' };
  project = { ...project, ...linkWritingEvidence(project, 'introduction', 'paper-a', undefined, undefined, undefined, at).patch };
  project = { ...project, ...changeWritingBody(project, 'results', 'A comparison across records. [99]') };
  project.studyType = 'literature';
  assert.equal(writingSections(project).find(item => item.id === 'results')?.title, 'Included evidence and synthesis');
  assert.equal(project.writingStudio!.sections.find(item => item.id === 'results')?.body, 'A comparison across records. [99]');
  const prompts = writingReviewPrompts(project).map(item => item.detail).join(' ');
  assert.match(prompts, /\[99\]/); assert.match(prompts, /incomplete author, year or venue/); assert.match(prompts, /No located source evidence/);
  assert.match(draftBibliography(project), /Author not supplied \(n\.d\.\)/);
  assert.match(draftBibliography(project), /Venue not supplied/);
});

test('repeated DOI citations share a bibliography number while each evidence link retains its actual record', () => {
  let project = fixture();
  const second = { ...project.papers[0], id: 'paper-b', doi: 'https://doi.org/10.1234/COMMUTERS', evidenceClaims: [{ ...project.papers[0].evidenceClaims![0], id: crypto.randomUUID(), claimText: 'Another retained note.', locator: 'Page 6' }] };
  project.papers.push(second);
  project = { ...project, ...linkWritingEvidence(project, 'results', 'paper-a', project.papers[0].evidenceClaims![0].id, undefined, undefined, at).patch };
  project = { ...project, ...linkWritingEvidence(project, 'discussion', 'paper-b', second.evidenceClaims[0].id, undefined, undefined, at).patch };
  assert.equal(project.writingStudio!.citations.length, 1);
  assert.equal(project.writingStudio!.evidenceLinks[1].paperId, 'paper-b');
  assert.deepEqual(writingEvidenceState(project, project.writingStudio!.evidenceLinks[1]).issues, []);
  assert.equal(project.writingStudio!.citations[0].number, 1);
});

test('length, missing-claim and duplicate-identifier guards do not mutate draft or references', () => {
  const project = fixture();
  const before = JSON.stringify(project);
  assert.throws(() => linkWritingEvidence(project, 'results', 'paper-a', crypto.randomUUID()), /no longer available/);
  const long = { ...project, ...changeWritingBody(project, 'results', 'x'.repeat(20000)) };
  assert.throws(() => linkWritingEvidence(long, 'results', 'paper-a', undefined), /too long/);
  assert.equal(JSON.stringify(project), before);
  const once = linkWritingEvidence(project, 'results', 'paper-a', undefined, undefined, undefined, at).patch.writingStudio!;
  assert.equal(writingStudioSchema.safeParse({ ...once, citations: [once.citations[0], once.citations[0]] }).success, false);
  assert.equal(projectSchema.parse(project).writingStudio, undefined);
  assert.deepEqual(currentWritingStudio(project), { sections: [], citations: [], evidenceLinks: [] });
});

test('DOCX export is a local OOXML package with escaped Unicode text and draft citation content', () => {
  const bytes = manuscriptDocx('Draft <&>', '# Draft <&>\n\n## Findings\nCafé α [1] <source> & evidence.\uFFFE\uFFFF\n\n## Draft bibliography\n[1] Example (2025).');
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50);
  const text = new TextDecoder().decode(bytes);
  for (const part of ['[Content_Types].xml', '_rels/.rels', 'word/document.xml', 'word/styles.xml', 'docProps/core.xml']) assert.ok(text.includes(part));
  assert.match(text, /Café α \[1\] &lt;source&gt; &amp; evidence\./);
  assert.match(text, /w:pStyle w:val="Heading1"/);
  assert.match(text, /Draft &lt;&amp;&gt;/);
  assert.equal(text.includes('\uFFFE'), false);
  assert.equal(text.includes('\uFFFF'), false);
  assert.equal(new DataView(bytes.buffer).getUint32(bytes.length - 22, true), 0x06054b50);
});

test('ambiguous source and claim identifiers cannot insert the wrong record or change the draft', () => {
  const project = fixture();
  const claimId = project.papers[0].evidenceClaims![0].id;
  project.papers.push({ ...project.papers[0], title: 'Unrelated legacy record', doi: '10.1234/another' });
  const original = JSON.stringify(project);
  assert.throws(() => linkWritingEvidence(project, 'results', 'paper-a', claimId), /More than one saved source/);
  assert.equal(JSON.stringify(project), original);
  project.papers.pop();
  project.papers[0].evidenceClaims!.push({ ...project.papers[0].evidenceClaims![0], claimText: 'Conflicting duplicate note.' });
  const beforeDuplicateClaim = JSON.stringify(project);
  assert.throws(() => linkWritingEvidence(project, 'results', 'paper-a', claimId), /More than one evidence note/);
  assert.equal(JSON.stringify(project), beforeDuplicateClaim);
});

test('reused source IDs do not silently replace bibliography identity and citation prompts target their section', () => {
  let project = fixture();
  project = { ...project, ...linkWritingEvidence(project, 'introduction', 'paper-a', undefined, undefined, undefined, at).patch };
  const citation = project.writingStudio!.citations[0];
  project.papers = [{ ...project.papers[0], doi: '10.1234/different-work', title: 'Different work' }];
  assert.equal(currentCitationPaper(project, citation), undefined);
  assert.throws(() => refreshWritingCitation(project, citation.id), /no longer saved/);
  const sourcePrompt = writingReviewPrompts(project).find(prompt => prompt.id === `${citation.id}-source`);
  assert.equal(sourcePrompt?.sectionId, 'introduction');
  assert.match(draftBibliography(project), /Commuter access/);
  let located = fixture();
  located = { ...located, ...linkWritingEvidence(located, 'results', 'paper-a', located.papers[0].evidenceClaims![0].id, undefined, undefined, at).patch };
  located.papers = [{ ...located.papers[0], doi: '10.1234/different-work' }];
  const state = writingEvidenceState(located, located.writingStudio!.evidenceLinks[0]);
  assert.equal(state.paper, undefined);
  assert.match(state.issues.join(' '), /no longer saved/);
});
