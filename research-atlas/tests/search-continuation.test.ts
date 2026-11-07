import assert from 'node:assert/strict';
import { test } from 'node:test';
import { continuePaperSearch, PaperSearchError, relatedPapers, runPaperSearch } from '../src/lib/providers';
import { searchRunSchema } from '../src/lib/search-provenance';

function records(start = 1, count = 20) {
  return Array.from({ length: count }, (_, index) => ({ id: `https://openalex.org/W${start + index}`, display_name: `Paper ${start + index}`, publication_year: 2025, doi: null }));
}

test('basic continuation retains query, filters and every page and stops at 100 records without a key', async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input); urls.push(url);
    const page = Number(url.searchParams.get('page') ?? 1);
    return Response.json({ meta: { count: 800 }, results: records((page - 1) * 20 + 1) });
  });
  let result = await runPaperSearch('student housing', '2023', true);
  const firstId = result.run.id;
  for (let page = 2; page <= 5; page++) result = await continuePaperSearch(result.run);
  assert.equal(result.run.id, firstId);
  assert.deepEqual(result.run.pages.map(page => page.page), [1, 2, 3, 4, 5]);
  assert.equal(result.run.resultIds?.length, 100);
  assert.equal(result.run.stopReason, 'app-limit');
  assert.equal(result.run.nextPage, undefined);
  assert.equal(searchRunSchema.safeParse(result.run).success, true);
  await assert.rejects(continuePaperSearch(result.run), /page limit/);
  assert.equal(urls.length, 5);
  for (const url of urls) {
    assert.equal(url.searchParams.get('search'), 'student housing');
    assert.equal(url.searchParams.get('filter'), 'from_publication_date:2023-01-01,is_oa:true');
    assert.equal(url.searchParams.has('api_key'), false);
    assert.equal(url.searchParams.has('cursor'), false);
  }
});

test('provider end and changed-query continuation cannot make extra requests', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ meta: { count: 1 }, results: records(1, 1) }));
  const result = await runPaperSearch('student housing', '', false);
  assert.equal(result.run.stopReason, 'provider-end');
  await assert.rejects(continuePaperSearch(result.run), /page limit/);
  await assert.rejects(runPaperSearch('changed query', '', false, undefined, { ...result.run, nextPage: 2 }), /query changed/);
  assert.equal(fetch.mock.callCount(), 1);
});

test('failed continuation preserves successful page provenance and received record IDs', async t => {
  let response = Response.json({ meta: { count: 200 }, results: records() });
  t.mock.method(globalThis, 'fetch', async () => response);
  const result = await runPaperSearch('student housing', '', false);
  response = new Response('', { status: 503 });
  await assert.rejects(continuePaperSearch(result.run), error => {
    assert.ok(error instanceof PaperSearchError);
    assert.deepEqual(error.run?.pages.map(page => page.page), [1, 2]);
    assert.equal(error.run?.pages[1].returnedCount, undefined);
    assert.equal(error.run?.resultIds?.length, 20);
    assert.equal(error.run?.nextPage, 2);
    assert.equal(searchRunSchema.safeParse(error.run).success, true);
    return true;
  });
});

test('related discovery uses allowlisted citation and reference IDs without sending private notes', async t => {
  const urls: URL[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string) => { urls.push(new URL(input)); return Response.json({ results: records(2, 1) }); });
  const paper = { id: 'https://openalex.org/W1', title: 'Private title', notes: 'Private notes', referenceIds: ['https://openalex.org/W2', 'javascript:bad'] } as Parameters<typeof relatedPapers>[0];
  assert.equal((await relatedPapers(paper, 'citations')).length, 1);
  assert.equal((await relatedPapers(paper, 'references')).length, 1);
  assert.equal(urls[0].searchParams.get('filter'), 'cites:W1');
  assert.equal(urls[1].searchParams.get('filter'), 'openalex:W2');
  assert.equal(urls.some(url => url.href.includes('Private')), false);
});

test('known exhausted allowance prevents new and related requests until the reported reset', async t => {
  let now = Date.parse('2026-11-07T10:00:00Z');
  t.mock.method(Date, 'now', () => now);
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({ meta: { count: 80 }, results: records() }, { headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': '30' } }));
  const result = await runPaperSearch('student housing', '', false);
  await assert.rejects(runPaperSearch('another research topic', '', false), /free research service is at its limit/);
  await assert.rejects(relatedPapers(result.papers[0], 'citations'), /free research service is at its limit/);
  assert.equal(fetch.mock.callCount(), 1);
  now += 30_001;
  await runPaperSearch('another research topic', '', false);
  assert.equal(fetch.mock.callCount(), 2);
});
