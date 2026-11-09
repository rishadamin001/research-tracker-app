import test from 'node:test';
import assert from 'node:assert/strict';
import { officialPublicationSearchUrl, providerSearchFilterTokens, searchOptionsFromRun } from '../src/lib/search-options';
import { runPublicationSearch, continuePublicationSearch } from '../src/lib/search-publications';
import { PaperSearchError, searchRunSchema } from '../src/lib/search-provenance';

test('supported provider-specific document and source filters survive history and continuation', async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input); urls.push(url);
    const page = Number(url.searchParams.get('page') ?? 1);
    return Response.json({ meta: { count: 200 }, results: Array.from({ length: 20 }, (_, i) => ({ id: `https://openalex.org/W${page * 100 + i}`, display_name: `Study ${i}`, publication_year: 2025, doi: null, type: 'review' })) });
  });
  const first = await runPublicationSearch('OpenAlex', 'commuter students', '2020', true, undefined, { documentType: 'review', sourceType: 'journal' });
  assert.deepEqual(first.run.filters, ['from_publication_date:2020-01-01', 'is_oa:true', 'type:review', 'primary_location.source.type:journal']);
  assert.equal(searchRunSchema.safeParse(first.run).success, true);
  assert.deepEqual(searchOptionsFromRun(first.run), { documentType: 'review', sourceType: 'journal' });
  const second = await continuePublicationSearch(first.run);
  assert.equal(urls[1].searchParams.get('filter'), urls[0].searchParams.get('filter'));
  assert.equal(urls[1].searchParams.get('page'), '2');
  assert.equal(second.run.resultIds?.length, 40);
  assert.equal(second.run.pages[1].responseStatus, 200);
  assert.equal(new URL(second.run.pages[1].requestUrl!).searchParams.get('page'), '2');
});

test('Europe PMC records its publication-type and collection syntax; Crossref refuses unsupported subtypes', async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string) => { urls.push(new URL(input)); return Response.json({ hitCount: 0, resultList: { result: [] } }); });
  const result = await runPublicationSearch('Europe PMC', 'Hypothyroidism', '2021', true, undefined, { documentType: 'review', sourceType: 'medline' });
  assert.equal(urls[0].searchParams.get('query'), '(Hypothyroidism) AND FIRST_PDATE:[2021-01-01 TO 3000-12-31] AND OPEN_ACCESS:Y AND PUB_TYPE:"Review" AND SRC:MED');
  assert.deepEqual(searchOptionsFromRun(result.run), { documentType: 'review', sourceType: 'medline' });
  assert.equal(searchRunSchema.safeParse(result.run).success, true);
  await assert.rejects(runPublicationSearch('Crossref', 'Hypothyroidism', '', false, undefined, { documentType: 'review' }), /does not support.*document-type/);
  await assert.rejects(runPublicationSearch('Europe PMC', 'Hypothyroidism', '', false, undefined, { sourceType: 'repository' }), /does not support.*source/);
  assert.equal(urls.length, 1);
  assert.deepEqual(providerSearchFilterTokens('Crossref'), []);
});

test('official fallbacks encode only the keywords and stay on the selected scholarly provider', () => {
  for (const [provider, host, key] of [['OpenAlex', 'openalex.org', 'search'], ['Europe PMC', 'europepmc.org', 'query'], ['Crossref', 'search.crossref.org', 'q']] as const) {
    const url = new URL(officialPublicationSearchUrl(provider, 'Hypothyroidism & pregnancy'));
    assert.equal(url.protocol, 'https:'); assert.equal(url.hostname, host); assert.equal(url.searchParams.get(key), 'Hypothyroidism & pregnancy');
  }
});

test('a browser-unreadable Crossref second page retains first-page IDs, unknown HTTP status and retryable provenance', async t => {
  const records = (start: number) => Array.from({ length: 20 }, (_, i) => ({ DOI: `10.1234/source-${start + i}`, title: [`Study ${start + i}`], type: 'journal-article' }));
  let blocked = false;
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input);
    if (url.searchParams.get('offset') === '20' && blocked) throw new TypeError('Failed to fetch');
    return Response.json({ message: { 'total-results': 100, items: records(Number(url.searchParams.get('offset'))) } });
  });
  const first = await runPublicationSearch('Crossref', 'Hypothyroidism', '', false);
  blocked = true;
  let failed = first.run;
  await assert.rejects(continuePublicationSearch(first.run), error => {
    assert.ok(error instanceof PaperSearchError); assert.ok(error.run); failed = error.run;
    assert.equal(failed.pages[1].networkFailure, 'network-or-cors');
    assert.equal(failed.pages[1].responseStatus, undefined);
    assert.equal(failed.pages[1].returnedCount, undefined);
    assert.equal(new URL(failed.pages[1].requestUrl!).searchParams.get('offset'), '20');
    assert.equal(failed.pages.filter(page => page.returnedCount !== undefined).length, 1);
    assert.equal(failed.resultIds?.length, 20); assert.equal(failed.nextPage, 2);
    assert.match(error.message, /HTTP status is not exposed/);
    assert.equal(searchRunSchema.safeParse(failed).success, true);
    return true;
  });
  blocked = false;
  const resumed = await continuePublicationSearch(failed);
  assert.equal(resumed.run.id, first.run.id); assert.equal(resumed.run.resultIds?.length, 40);
  assert.equal(resumed.run.pages.filter(page => page.returnedCount !== undefined).length, 2);
  assert.equal(resumed.run.pages[1].networkFailure, 'network-or-cors');
  assert.equal(resumed.run.pages[2].responseStatus, 200);
});
