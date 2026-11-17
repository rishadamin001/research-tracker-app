import assert from 'node:assert/strict';
import { test } from 'node:test';
import { continuePublicationSearch, runPublicationSearch } from '../src/lib/search-publications';
import { PaperSearchError, searchRunSchema } from '../src/lib/search-provenance';

const crossrefPage = (offset = 0) => Response.json({ message: { 'total-results': 100, items: Array.from({ length: 20 }, (_, i) => ({ DOI: `10.1234/study-${offset + i}`, type: 'journal-article', title: [`Study ${offset + i}`] })) } });
const europePmcEmpty = () => Response.json({ hitCount: 0, resultList: { result: [] } });

test('a short retry recovers the same continuation and caches only the validated page in that run', async t => {
  let secondPageRequests = 0;
  const fetch = t.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    const offset = Number(new URL(url).searchParams.get('offset'));
    assert.equal(options.credentials, 'omit');
    if (offset === 20 && ++secondPageRequests === 1) return new Response('', { status: 503, headers: { 'Retry-After': '0' } });
    return crossrefPage(offset);
  });
  const first = await runPublicationSearch('Crossref', 'urban community housing', '', false);
  const [second, cached] = await Promise.all([continuePublicationSearch(first.run), continuePublicationSearch(first.run)]);
  assert.equal(fetch.mock.callCount(), 3);
  assert.deepEqual(second.run.pages.map(page => page.page), [1, 2]);
  assert.equal(second.run.pages[1].requestAttempts, 2);
  assert.equal(second.run.pages[1].responseStatus, 200);
  assert.equal(second.run.pages[1].returnedCount, 20);
  assert.equal(second.run.resultIds?.length, 40);
  assert.equal(second.run.nextPage, 3);
  assert.equal(cached.run.pages[1].servedFromCache, true);
  assert.equal(cached.run.pages[1].requestAttempts, 0);
  assert.equal(cached.run.pages[1].retrievedAt, second.run.pages[1].retrievedAt);
  assert.deepEqual(cached.papers, second.papers);
  assert.equal(searchRunSchema.safeParse(cached.run).success, true);
  cached.papers[0].title = 'Unsaved local edit';
  const reused = await continuePublicationSearch(first.run);
  assert.equal(reused.papers[0].title, 'Study 20');
  assert.equal(reused.run.pages[1].requestAttempts, 0);

  const refresh = await runPublicationSearch('Crossref', 'urban community housing', '', false);
  assert.notEqual(refresh.run.id, first.run.id);
  assert.equal((await continuePublicationSearch(refresh.run)).run.pages[1].servedFromCache, undefined);
  assert.equal(fetch.mock.callCount(), 5);
});

test('cancelling a queued request leaves the active request and following requests intact', async t => {
  let allowFirst = () => {};
  let markFirstStarted = () => {};
  const firstStarted = new Promise<void>(resolve => { markFirstStarted = resolve; });
  const firstCanComplete = new Promise<void>(resolve => { allowFirst = resolve; });
  const requested: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input);
    const query = url.searchParams.get('query.bibliographic') ?? 'independent';
    requested.push(query);
    if (query === 'first search') {
      markFirstStarted();
      await firstCanComplete;
    }
    return query === 'independent' ? europePmcEmpty() : crossrefPage();
  });

  const first = runPublicationSearch('Crossref', 'first search', '', false);
  await firstStarted;
  const controller = new AbortController();
  const cancelled = runPublicationSearch('Crossref', 'cancelled search', '', false, controller.signal);
  const confirmsCancellation = assert.rejects(cancelled, /Search cancelled/);
  const following = runPublicationSearch('Crossref', 'following search', '', false);
  controller.abort();
  try {
    await confirmsCancellation;
    assert.equal((await runPublicationSearch('Europe PMC', 'another search', '', false)).run.stopReason, 'provider-end');
    assert.deepEqual(requested, ['first search', 'independent']);
  } finally {
    allowFirst();
  }
  assert.equal((await first).papers.length, 20);
  assert.equal((await following).papers.length, 20);
  assert.deepEqual(requested, ['first search', 'independent', 'following search']);
});

test('OpenAlex does not guess that an unreadable quota window is transient', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 429 }));
  await assert.rejects(runPublicationSearch('OpenAlex', 'quota diagnostic', '', false), error => {
    assert.ok(error instanceof PaperSearchError);
    assert.equal(error.run?.error?.kind, 'rate-limit');
    assert.equal(error.run?.pages[0].responseStatus, 429);
    assert.equal(error.run?.pages[0].returnedCount, undefined);
    return true;
  });
  assert.equal(fetch.mock.callCount(), 1);
});

test('a short Crossref throttle retries without treating request-window headers as daily credits', async t => {
  const sentAt: number[] = [];
  t.mock.method(globalThis, 'fetch', async () => {
    sentAt.push(performance.now());
    if (sentAt.length === 1) return new Response('', { status: 429, headers: { 'Retry-After': '1', 'X-RateLimit-Remaining': '0' } });
    return crossrefPage();
  });
  const result = await runPublicationSearch('Crossref', 'short provider throttle', '', false);
  assert.equal(result.run.pages[0].requestAttempts, 2);
  assert.equal(result.run.quota?.remainingCredits, undefined);
  assert.equal(sentAt.length, 2);
  assert.ok(sentAt[1] - sentAt[0] >= 1000);
});

test('OpenAlex retries a short explicit wait when credits remain', async t => {
  let requests = 0;
  t.mock.method(globalThis, 'fetch', async () => ++requests === 1
    ? new Response('', { status: 429, headers: { 'Retry-After': '0', 'X-RateLimit-Remaining': '80' } })
    : Response.json({ results: [] }, { headers: { 'X-RateLimit-Remaining': '70' } }));
  const result = await runPublicationSearch('OpenAlex', 'short provider throttle', '', false);
  assert.equal(requests, 2);
  assert.equal(result.run.pages[0].requestAttempts, 2);
  assert.equal(result.run.quota?.remainingCredits, 70);
});

test('a provider deadline permits one recovery attempt and bad filters do not retry', async t => {
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal);
  let deadline: AbortController | undefined;
  let timedOut = false;
  const deadlines: number[] = [];
  t.mock.method(AbortSignal, 'timeout', (ms: number) => {
    deadlines.push(ms);
    if (ms === 8_000 && !timedOut) {
      deadline = new AbortController();
      return deadline.signal;
    }
    return originalTimeout(ms);
  });
  const fetch = t.mock.method(globalThis, 'fetch', async (input: string) => {
    const url = new URL(input);
    if (url.hostname === 'api.crossref.org') return new Response('', { status: 400 });
    if (!timedOut) {
      timedOut = true;
      queueMicrotask(() => deadline?.abort(new DOMException('Timed out in fixture', 'TimeoutError')));
      return new Promise<Response>(() => {});
    }
    return Response.json({ results: [] });
  });
  const search = await runPublicationSearch('OpenAlex', 'timeout example', '', false);
  assert.equal(search.run.pages[0].requestAttempts, 2);
  assert.equal(fetch.mock.callCount(), 2);
  assert.deepEqual(deadlines, [18_000, 8_000, 8_000]);
  await assert.rejects(runPublicationSearch('Crossref', 'bad words', '', false), /could not use these search terms or filters/);
  assert.equal(fetch.mock.callCount(), 3);
  assert.deepEqual(deadlines.slice(-2), [18_000, 10_000]);
});
