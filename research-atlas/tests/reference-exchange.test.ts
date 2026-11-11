import assert from 'node:assert/strict';
import test from 'node:test';
import { exportReferences, parseReferenceFile, reviewReferenceImport } from '../src/lib/reference-exchange';

const ris = `TY  - JOUR
T1  - Housing satisfaction across
      two urban campuses
AU  - Ahmed, Rupa
AU  - John Lee
PY  - 2024/09/18/
JF  - Journal of Housing Research
SN  - 0272-4944
DO  - https://doi.org/10.1234/HOUSE_1
UR  - https://example.test/papers/housing
ID  - https://openalex.org/W12345
ER  -
`;

test('RIS and BibTeX exchange preserve bibliographic metadata and exact identifiers', () => {
  const { papers: [paper], skipped } = parseReferenceFile(ris, 'ris');
  assert.equal(skipped, 0);
  assert.equal(paper.title, 'Housing satisfaction across two urban campuses');
  assert.deepEqual(paper.referenceAuthors, ['Rupa Ahmed', 'John Lee']);
  assert.equal(paper.doi, '10.1234/house_1');
  assert.equal(paper.publicationDate, '2024-09-18');
  assert.deepEqual(paper.issns, ['0272-4944']);
  assert.equal(paper.id, 'https://openalex.org/W12345');
  for (const format of ['ris', 'bibtex'] as const) {
    const [returned] = parseReferenceFile(exportReferences([paper], format), format).papers;
    assert.equal(returned.id, paper.id);
    assert.equal(returned.doi, paper.doi);
    assert.equal(returned.url, paper.url);
    assert.deepEqual(returned.referenceAuthors, paper.referenceAuthors);
    assert.equal(returned.publicationDate, paper.publicationDate);
    assert.equal(returned.journal, paper.journal);
    assert.equal(returned.year, paper.year);
  }
});

test('BibTeX supports nested braces, quotes, macros, and literal TeX input', () => {
  const source = String.raw`% export comments
@string{venue = "Journal of " # {Urban Studies}}
@article(housing_2024,
  title = {{Urban} affordability \& access},
  author = "Ahmed, Rupa and {Lab for Housing and Access}",
  year = 2024,
  journal = venue,
  isbn = {978-1-4028-9462-6},
  doi = {10.1234/ABC\_9},
  url = {javascript:alert(1)}
)`;
  const [paper] = parseReferenceFile(source, 'bibtex').papers;
  assert.equal(paper.title, 'Urban affordability & access');
  assert.deepEqual(paper.referenceAuthors, ['Rupa Ahmed', 'Lab for Housing and Access']);
  assert.equal(paper.journal, 'Journal of Urban Studies');
  assert.equal(paper.referenceKey, 'housing_2024');
  assert.equal(paper.isbn, '978-1-4028-9462-6');
  assert.equal(paper.url, 'https://doi.org/10.1234/abc_9');
  const dangerous = { ...paper, title: String.raw`{Study} \input{secrets} & <script>` };
  const bib = exportReferences([dangerous], 'bibtex');
  assert.doesNotMatch(bib, /\\input\{/);
  assert.equal(parseReferenceFile(bib, 'bibtex').papers[0].title, dangerous.title);
});

test('review skips exact IDs and DOIs but keeps near matches available for separate import', () => {
  const existing = parseReferenceFile(ris, 'ris').papers;
  const related = ris.replace('https://openalex.org/W12345', 'local-id').replace('https://doi.org/10.1234/HOUSE_1', '10.1234/house_2').replace('2024/09/18/', '2025');
  const repeatId = ris.replace('https://doi.org/10.1234/HOUSE_1', '10.1234/house_3');
  const repeatDoi = ris.replace('https://openalex.org/W12345', 'library-1');
  const incoming = parseReferenceFile(repeatId + repeatDoi + related, 'ris').papers;
  const review = reviewReferenceImport(incoming, existing);
  assert.equal(review.duplicates, 2);
  assert.equal(review.additions.length, 1);
  assert.equal(review.additions[0].paper.doi, '10.1234/house_2');
  assert.equal(review.additions[0].similar?.id, existing[0].id);
  assert.equal(review.additions[0].similarOrigin, 'project');
  assert.deepEqual(review.exactMatches.map(({ by, match }) => [by, match.origin]), [['record ID', 'project'], ['DOI', 'project']]);
});

test('Europe PMC identifiers and reported database survive both exchange formats', () => {
  const source = ris
    .replace(/^DO  - .*\r?\n/m, '')
    .replace('https://example.test/papers/housing', 'https://pubmed.ncbi.nlm.nih.gov/12345/')
    .replace('ID  - https://openalex.org/W12345', 'ID  - local-library-key\r\nDB  - Europe PMC');
  const [paper] = parseReferenceFile(source, 'ris').papers;
  assert.equal(paper.id, 'https://europepmc.org/article/MED/12345');
  assert.equal(paper.doi, null);
  assert.equal(paper.source, 'RIS import · Database reported in file: Europe PMC');

  for (const format of ['ris', 'bibtex'] as const) {
    const [returned] = parseReferenceFile(exportReferences([{ ...paper, url: 'https://example.test/publisher-copy' }], format), format).papers;
    assert.equal(returned.id, paper.id);
    assert.equal(returned.referenceKey, 'local-library-key');
    assert.equal(returned.url, 'https://example.test/publisher-copy');
    assert.match(returned.source, /Database reported in file: Europe PMC$/);
  }

  const review = reviewReferenceImport([paper, { ...paper, url: paper.id }], []);
  assert.equal(review.additions.length, 1);
  assert.deepEqual(review.exactMatches.map(({ by, match }) => [by, match.origin]), [['record ID', 'file']]);
});

test('malformed references and disproportionate macro expansion are rejected', () => {
  assert.throws(() => parseReferenceFile('TY  - JOUR\nTI  - A title', 'ris'), /ER end tag/);
  assert.throws(() => parseReferenceFile('@article{demo, title = {open', 'bibtex'), /closing delimiter/);
  const expansions = ['@string{macro0 = {text}}'];
  for (let n = 1; n < 25; n++) expansions.push(`@string{macro${n} = macro${n - 1} # macro${n - 1}}`);
  assert.throws(() => parseReferenceFile(expansions.join('\n'), 'bibtex'), /expanded fields exceed/);
});
