import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectLibrary, correctLibraryMetadata, filterLibrary, libraryIdentity, linkLibraryEntry, parseLibraryTags, referenceMetadataFields, updateLibraryEntry } from '../src/lib/atlas-library';
import { createProject, paperSchema, projectSchema } from '../src/lib/model';
import { linkWritingEvidence } from '../src/lib/writing-studio';

function source(id = 'https://openalex.org/W123', doi: string | null = '10.1234/test') {
  return paperSchema.parse({ id, doi, title: 'Housing evidence in urban universities', authors: 'Test Author', year: 2024, journal: 'Fixture journal', source: 'OpenAlex', url: 'https://example.org', oa: null });
}

test('library groups normalized DOI variants and leaves title-only near matches separate', () => {
  const a = createProject('A'), b = createProject('B');
  a.papers = [source()]; b.papers = [source('import-id', 'https://doi.org/10.1234/TEST'), source('another-id', null)];
  const entries = collectLibrary([a, b]);
  assert.equal(entries.length, 2); assert.equal(entries[0].links.length, 2);
  assert.equal(entries[0].key, 'doi:10.1234/test');
  assert.equal(libraryIdentity(source('opaque', 'invalid')), 'id:opaque');
  a.papers = [source('', 'invalid')]; b.papers = [source('', 'invalid')];
  assert.equal(collectLibrary([a, b]).length, 2);
});

test('linking preserves metadata while separating project screening, notes, and evidence', () => {
  const a = createProject('Origin'), b = createProject('Destination');
  a.papers = [{ ...source(), decision: 'include', notes: 'Interpretation private to project A', reason: 'Our eligibility criterion', methods: 'Our extraction', readingStatus: 'read', tags: ['housing'] }];
  const original = structuredClone([a, b]); const entry = collectLibrary([a, b])[0];
  const next = linkLibraryEntry([a, b], entry, b.id); const linked = next[1].papers[0];
  assert.equal(linked.title, a.papers[0].title); assert.equal(linked.citedByCount, a.papers[0].citedByCount);
  assert.equal(linked.decision, 'unreviewed'); assert.equal(linked.notes, ''); assert.equal(linked.reason, ''); assert.equal(linked.methods, ''); assert.equal(linked.evidenceClaims, undefined);
  assert.equal(linked.libraryLinkProvenance?.fromProjectId, a.id); assert.equal(linked.readingStatus, 'read');
  assert.deepEqual([a, b], original); assert.deepEqual(projectSchema.parse(next[1]).papers, next[1].papers);
  assert.equal(linkLibraryEntry(next, collectLibrary(next)[0], b.id), next);
});

test('reading/tag updates preserve project-specific judgments and filters reuse quartile sorting', () => {
  const a = createProject('A'), b = createProject('B');
  const q1 = { quartile: 'Q1' as const, source: 'POSI', year: 2026, category: 'Fixture', url: 'https://example.org/ranking' };
  a.papers = [{ ...source(), notes: 'Project A notes', decision: 'include', journalQuartile: q1 }, source('W2', '10.1234/second')];
  b.papers = [{ ...source('other-id'), notes: 'Project B notes', decision: 'exclude' }];
  const updated = updateLibraryEntry([a, b], 'doi:10.1234/test', { readingStatus: 'read', tags: parseLibraryTags('housing, Bangladesh, housing') });
  assert.equal(updated[0].papers[0].notes, 'Project A notes'); assert.equal(updated[1].papers[0].notes, 'Project B notes'); assert.equal(updated[1].papers[0].decision, 'exclude');
  assert.deepEqual(updated[1].papers[0].tags, ['housing', 'Bangladesh']);
  assert.equal(filterLibrary(collectLibrary(updated), 'Bangladesh', b.id, 'read', 'quartile').length, 1);
  assert.equal(filterLibrary(collectLibrary(updated), '', '', '', 'quartile')[0].key, 'doi:10.1234/test');
  assert.throws(() => updateLibraryEntry(updated, 'doi:10.1234/test', { tags: ['x'.repeat(61)] }));
});

test('linking blocks identifier collisions and full destination projects', () => {
  const a = createProject(), b = createProject(); a.papers = [source()]; b.papers = [source(undefined, '10.1234/different')];
  assert.throws(() => linkLibraryEntry([a, b], collectLibrary([a, b])[0], b.id), /record identifier/);
  b.papers = Array.from({ length: 2000 }, (_, i) => source(`record-${i}`, `10.9999/${i}`));
  assert.throws(() => linkLibraryEntry([a, b], collectLibrary([a, b])[0], b.id), /2,000/);
});

test('project/status filters use the same linked copy and search includes retained metadata variants', () => {
  const a = createProject('Unread project'), b = createProject('Read project');
  a.papers = [{ ...source(), readingStatus: 'unread' }];
  b.papers = [{ ...source('second-id'), title: 'An alternate deposited housing title', readingStatus: 'read' }];
  const entries = collectLibrary([a, b]);
  assert.equal(filterLibrary(entries, '', a.id, 'read', 'quartile').length, 0);
  assert.equal(filterLibrary(entries, '', b.id, 'read', 'quartile').length, 1);
  assert.equal(filterLibrary(entries, 'alternate deposited', '', '', 'quartile').length, 1);
});

test('unidentified references can be organized individually without false linking and normalized tags survive backups', () => {
  const a = createProject(), b = createProject(); a.papers = [source('', 'invalid')]; b.papers = [source('', 'invalid')];
  const entry = collectLibrary([a, b])[0];
  assert.throws(() => linkLibraryEntry([a, b], entry, b.id), /usable DOI/);
  const next = updateLibraryEntry([a, b], entry.key, { tags: ['  housing  '], readingStatus: 'read' });
  assert.deepEqual(next[0].papers[0].tags, ['housing']); assert.equal(next[1].papers[0].readingStatus, undefined);
  assert.deepEqual(projectSchema.parse(next[0]).papers[0].tags, ['housing']);
  assert.throws(() => updateLibraryEntry(next, 'missing', { tags: [] }), /reference changed/);
});

test('metadata correction updates only the selected project and its linked citations', () => {
  const a = createProject('First study'), b = createProject('Second study');
  const at = '2026-11-17T00:00:00.000Z';
  const original = { ...source(), decision: 'include' as const, notes: 'Local research note', publicationDate: '2024-02-15', issns: ['1111-2222'],
    evidenceClaims: [{ id: crypto.randomUUID(), claimType: 'finding' as const, claimText: 'Library opening hours restricted access.',
      evidenceLevel: 'full_text' as const, locator: 'Page 4', interpretation: '', uncertainty: '', reviewStatus: 'reviewed' as const,
      createdAt: at, gapRole: 'supports' as const }] };
  a.papers = [original];
  b.papers = [source('other-copy')];
  const project = { ...a, ...linkWritingEvidence(a, 'results', original.id, original.evidenceClaims[0].id).patch };
  const [link] = collectLibrary([project, b])[0].links;
  const draft = { ...referenceMetadataFields(original), title: 'Corrected study title', authors: 'Ada Example\nBruno Example', journal: 'Correct venue', year: '2025' };
  const updated = correctLibraryMetadata([project, b], link, draft, true, at);
  const next = updated[0];
  assert.equal(updated[1], b);
  assert.equal(next.papers[0].id, original.id);
  assert.equal(next.papers[0].doi, original.doi);
  assert.equal(next.papers[0].publicationDate, undefined);
  assert.equal(next.papers[0].issns, undefined);
  assert.equal(next.papers[0].decision, 'include');
  assert.equal(next.papers[0].notes, original.notes);
  assert.equal(next.papers[0].evidenceClaims, original.evidenceClaims);
  assert.deepEqual(next.papers[0].referenceAuthors, ['Ada Example', 'Bruno Example']);
  assert.deepEqual(next.writingStudio?.sections, project.writingStudio?.sections);
  assert.deepEqual(next.writingStudio?.evidenceLinks, project.writingStudio?.evidenceLinks);
  assert.equal(next.writingStudio?.citations[0].id, project.writingStudio?.citations[0].id);
  assert.equal(next.writingStudio?.citations[0].sourceSnapshot.title, draft.title);
  assert.equal(next.writingStudio?.citations[0].metadataRefreshedAt, at);
  assert.equal(correctLibraryMetadata([project, b], link, draft, false)[0].writingStudio, project.writingStudio);
  assert.throws(() => correctLibraryMetadata(updated, link, draft, true), /changed while you were editing/);
});
