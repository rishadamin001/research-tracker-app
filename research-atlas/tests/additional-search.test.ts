import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCrossrefResults, parseEuropePmcResults, runAdditionalSearch } from '../src/lib/additional-search';
import { createProject, parseBackup } from '../src/lib/model';
import { PaperSearchError, searchRunSchema } from '../src/lib/search-provenance';

function medicalRecords(start = 1, count = 20) {
  return Array.from({ length: count }, (_, index) => ({ id: String(start + index), source: 'MED', title: `Thyroid study ${start + index}`, pubYear: '2024', citedByCount: 0, isOpenAccess: 'N' }));
}
function crossrefRecords(start = 1, count = 20) {
  return Array.from({ length: count }, (_, index) => ({ DOI: `10.1234/thyroid-${start + index}`, title: [`Thyroid study ${start + index}`], type: 'journal-article', published: { 'date-parts': [[2024]] }, 'is-referenced-by-count': index === 0 ? 0 : undefined }));
}

test('Europe PMC follows the returned cursor with exact filters and retains provenance in portable backups', async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string, options?: RequestInit) => {
    const url = new URL(input); urls.push(url);
    assert.equal(options?.credentials, 'omit');
    const first = url.searchParams.get('cursorMark') === '*';
    return Response.json({ hitCount: 60, nextCursorMark: first ? 'opaque+cursor/one==' : 'opaque+cursor/two==', resultList: { result: medicalRecords(first ? 1 : 21) } });
  });
  const first = await runAdditionalSearch('Europe PMC', ' Hypothyroidism ', '2020', true);
  const second = await runAdditionalSearch('Europe PMC', first.run.userQuery, '2020', true, undefined, first.run);
  assert.equal(second.run.id, first.run.id);
  assert.equal(second.run.resultIds?.length, 40);
  assert.deepEqual(second.run.pages.map(page => page.page), [1, 2]);
  assert.equal(second.run.provider, 'Europe PMC');
  assert.equal(second.run.userQuery, ' Hypothyroidism ');
  assert.equal(second.run.executedQuery, '(Hypothyroidism) AND FIRST_PDATE:[2020-01-01 TO 3000-12-31] AND OPEN_ACCESS:Y');
  assert.equal(urls[1].searchParams.get('cursorMark'), 'opaque+cursor/one==');
  assert.equal(urls[1].searchParams.get('query'), second.run.executedQuery);
  assert.equal(second.run.pages[1].cursor, 'opaque+cursor/one==');
  assert.equal(urls.every(url => !url.searchParams.has('api_key') && !url.searchParams.has('email')), true);
  assert.equal(searchRunSchema.safeParse(second.run).success, true);
  const project = createProject('Medical literature fixture');
  project.papers = [...first.papers, ...second.papers];
  project.searches = [{ query: second.run.executedQuery, source: second.run.provider, date: second.run.completedAt, filters: second.run.filters.join(','), count: 40, run: second.run }];
  const restored = parseBackup(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] }));
  assert.equal(restored.projects[0].searches[0].run?.nextCursor, second.run.nextCursor);
  assert.equal(restored.projects[0].papers[0].citedByCount, 0);
});

test('Crossref uses bounded offsets, preserves year-only dates, and never invents OA, journal fees or missing citations', async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input); urls.push(url);
    const start = Number(url.searchParams.get('offset')) + 1;
    return Response.json({ message: { 'total-results': 1200, items: crossrefRecords(start) } });
  });
  let result = await runAdditionalSearch('Crossref', 'Hypothyroidism', '2021', false);
  const firstPaper = result.papers[0];
  const missingCount = result.papers[1];
  for (let page = 2; page <= 5; page++) result = await runAdditionalSearch('Crossref', 'Hypothyroidism', '2021', false, undefined, result.run);
  assert.deepEqual(urls.map(url => url.searchParams.get('offset')), ['0', '20', '40', '60', '80']);
  assert.equal(urls.every(url => url.searchParams.get('filter') === 'type:journal-article,from-pub-date:2021-01-01'), true);
  assert.equal(urls.every(url => url.searchParams.get('query.bibliographic') === 'Hypothyroidism' && url.searchParams.get('rows') === '20'), true);
  assert.equal(firstPaper.publicationDate, undefined);
  assert.equal(firstPaper.year, 2024);
  assert.equal(firstPaper.citedByCount, 0);
  assert.equal(missingCount.citedByCount, undefined);
  assert.equal(firstPaper.oa, null);
  assert.equal(firstPaper.journalFee, undefined);
  assert.equal(firstPaper.readingCost, undefined);
  assert.equal(firstPaper.fwci, undefined);
  assert.equal(result.run.resultIds?.length, 100);
  assert.equal(result.run.stopReason, 'app-limit');
  assert.equal(searchRunSchema.safeParse(result.run).success, true);
  await assert.rejects(runAdditionalSearch('Crossref', 'Hypothyroidism', '2021', false, undefined, result.run), /page limit/);
  await assert.rejects(runAdditionalSearch('Crossref', 'Hypothyroidism', '', true), /open-access-only/);
  assert.equal(urls.length, 5);
});

test('medical metadata uses exact ISSNs for bundled quartiles and only marks verified OA locations free', async t => {
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    assert.equal(input.includes('journal-quartiles-'), true);
    return Response.json({ source: 'POSI', year: 2026, categories: ['Clinical medicine'], rows: '2049363001' });
  });
  const result = await parseEuropePmcResults({ hitCount: 2, resultList: { result: [
    { ...medicalRecords(1, 1)[0], title: 'Hypothyroidism &amp; evidence', journalInfo: { journal: { title: 'Clinical journal', issn: '2049-3630' } }, abstractText: '<h4>Background</h4><p>Thyroid &amp; health.</p>', isOpenAccess: 'Y', fullTextUrlList: { fullTextUrl: [{ availabilityCode: 'S', url: 'https://example.org/subscription' }, { availabilityCode: 'OA', url: 'javascript:alert(1)' }, { availabilityCode: 'OA', url: 'https://example.org/open.pdf' }] } },
    { ...medicalRecords(2, 1)[0], isOpenAccess: 'N', fullTextUrlList: { fullTextUrl: [{ availabilityCode: 'OA', url: 'https://example.org/unconfirmed.pdf' }] } },
  ] } });
  assert.equal(result.papers[0].journalQuartile?.quartile, 'Q1');
  assert.equal(result.papers[0].journalQuartile?.source, 'POSI');
  assert.equal(result.papers[0].title, 'Hypothyroidism & evidence');
  assert.equal(result.papers[0].abstract, 'Background Thyroid & health.');
  assert.equal(result.papers[0].oa, 'https://example.org/open.pdf');
  assert.equal(result.papers[0].readingCost?.amount, 0);
  assert.equal(result.papers[0].publisher, undefined);
  assert.equal(result.papers[0].journalFee, undefined);
  assert.equal(result.papers[1].oa, null);
  assert.equal(result.papers[1].readingCost, undefined);
});

test('a failed Europe PMC page preserves earlier IDs and retry cursor without counting it as a successful page', async t => {
  let response = Response.json({ hitCount: 100, nextCursorMark: 'next-page-cursor', resultList: { result: medicalRecords() } });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return response; });
  const first = await runAdditionalSearch('Europe PMC', 'Hypothyroidism', '', false);
  response = new Response('', { status: 503 });
  let failed: typeof first.run | undefined;
  await assert.rejects(runAdditionalSearch('Europe PMC', 'Hypothyroidism', '', false, undefined, first.run), error => {
    assert.ok(error instanceof PaperSearchError); failed = error.run;
    assert.equal(error.run?.id, first.run.id);
    assert.equal(error.run?.resultIds?.length, 20);
    assert.equal(error.run?.nextCursor, 'next-page-cursor');
    assert.equal(error.run?.nextPage, 2);
    assert.equal(error.run?.pages[1].returnedCount, undefined);
    assert.equal(error.run?.error?.kind, 'http');
    return true;
  });
  response = Response.json({ hitCount: 100, nextCursorMark: 'third-page-cursor', resultList: { result: medicalRecords(21) } });
  const resumed = await runAdditionalSearch('Europe PMC', 'Hypothyroidism', '', false, undefined, failed);
  assert.equal(resumed.run.pages.filter(page => page.returnedCount !== undefined).length, 2);
  assert.equal(resumed.run.resultIds?.length, 40);
  assert.equal(resumed.run.error, undefined);
  assert.equal(calls, 3);
});

test('alternative provider rate limits honor Retry-After without automatic retries or paid fallback', async t => {
  let now = Date.now();
  t.mock.method(Date, 'now', () => now);
  let response = Response.json({ message: { 'total-results': 100, items: crossrefRecords() } });
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return response; });
  const first = await runAdditionalSearch('Crossref', 'Hypothyroidism', '', false);
  response = new Response('', { status: 429, headers: { 'Retry-After': '30', 'X-Rate-Limit-Limit': '5', 'X-Rate-Limit-Interval': '1s', 'X-RateLimit-Limit': '5', 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '86400' } });
  let failed: typeof first.run | undefined;
  await assert.rejects(runAdditionalSearch('Crossref', 'Hypothyroidism', '', false, undefined, first.run), error => { assert.ok(error instanceof PaperSearchError); failed = error.run; assert.equal(error.run?.error?.kind, 'rate-limit'); assert.equal(error.run?.quota?.dailyCredits, undefined); assert.equal(error.run?.quota?.remainingCredits, undefined); assert.equal(error.run?.quota?.resetsAt, undefined); return true; });
  await assert.rejects(runAdditionalSearch('Crossref', 'Hypothyroidism', '', false, undefined, failed), /asks you to wait/);
  assert.equal(calls, 2);
  now += 30_001;
  response = Response.json({ message: { 'total-results': 100, items: crossrefRecords(21) } });
  const resumed = await runAdditionalSearch('Crossref', 'Hypothyroidism', '', false, undefined, failed);
  assert.equal(resumed.run.resultIds?.length, 40);
  assert.equal(calls, 3);
});

test('a missing continuation cursor is an explicit provider failure, not a false end-of-results claim', async t => {
  let response = Response.json({ hitCount: 100, nextCursorMark: 'next-page-cursor', resultList: { result: medicalRecords() } });
  t.mock.method(globalThis, 'fetch', async () => response);
  const first = await runAdditionalSearch('Europe PMC', 'Hypothyroidism', '', false);
  response = Response.json({ hitCount: 100, resultList: { result: medicalRecords(21) } });
  await assert.rejects(runAdditionalSearch('Europe PMC', 'Hypothyroidism', '', false, undefined, first.run), error => {
    assert.ok(error instanceof PaperSearchError);
    assert.match(error.message, /continuation cursor/);
    assert.equal(error.run?.stopReason, undefined);
    assert.equal(error.run?.resultIds?.length, 20);
    assert.equal(error.run?.pages[1].returnedCount, undefined);
    assert.equal(error.run?.error?.kind, 'invalid-response');
    return true;
  });
});

test('malformed, cancelled and changed-provider searches remain explicit without corrupting saved identities', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ message: { 'total-results': 100, items: crossrefRecords() } }));
  const first = await runAdditionalSearch('Crossref', 'Hypothyroidism', '', false);
  await assert.rejects(runAdditionalSearch('Europe PMC', 'Hypothyroidism', '', false, undefined, first.run), /provider changed/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(runAdditionalSearch('Crossref', 'Hypothyroidism', '', false, controller.signal), /cancelled/);
  assert.equal(fetch.mock.callCount(), 1);
  t.mock.method(globalThis, 'fetch', async () => Response.json({ message: { items: 'not a collection' } }));
  await assert.rejects(runAdditionalSearch('Crossref', 'Hypothyroidism', '', false, undefined, first.run), error => {
    assert.ok(error instanceof PaperSearchError);
    assert.equal(error.run?.error?.kind, 'invalid-response');
    assert.equal(error.run?.resultIds?.length, 20);
    return true;
  });
  const metadata = await parseCrossrefResults({ message: { 'total-results': 1, items: [{ DOI: 'https://doi.org/10.1234/ABC', type: 'journal-article', published: { 'date-parts': [[2024, 2, 30]] }, abstract: '<jats:p>Metadata only &lt; full text.</jats:p>' }] } });
  assert.equal(metadata.papers[0].doi, '10.1234/abc');
  assert.equal(metadata.papers[0].publicationDate, undefined);
  assert.equal(metadata.papers[0].citedByCount, undefined);
  assert.equal(metadata.papers[0].abstract, 'Metadata only < full text.');
});
