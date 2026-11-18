import assert from 'node:assert/strict';
import { test } from 'node:test';
import worker from '../gateway/worker';

const allowedOrigin = 'https://atlas.example';
const workerOrigin = 'https://gateway.example';
const environment = { ALLOWED_ORIGIN: allowedOrigin };

function request(path: string, method = 'GET', origin = allowedOrigin) {
  return new Request(new URL(path, workerOrigin), { method, headers: { Origin: origin } });
}

async function assertError(response: Response, status: number, error: string) {
  assert.equal(response.status, status);
  assert.deepEqual(await response.json(), { error });
}

test('the Worker checks the origin before the method and keeps its CORS response contract', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}));
  const rejected = await worker.fetch(request('/crossref', 'OPTIONS', 'https://unapproved.example'), environment);
  assert.equal(rejected.headers.get('Access-Control-Allow-Origin'), allowedOrigin);
  await assertError(rejected, 403, 'Origin not allowed');

  const preflight = await worker.fetch(request('/unknown', 'OPTIONS'), environment);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.body, null);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), allowedOrigin);
  assert.equal(preflight.headers.get('Access-Control-Allow-Methods'), 'GET');
  assert.equal(preflight.headers.get('Access-Control-Max-Age'), '86400');
  assert.equal(preflight.headers.get('Access-Control-Expose-Headers'), 'Retry-After');
  assert.equal(preflight.headers.get('Vary'), 'Origin');
  assert.equal(preflight.headers.get('Cache-Control'), 'no-store');

  await assertError(await worker.fetch(request('/crossref', 'POST'), environment), 405, 'GET only');
  assert.equal(fetch.mock.callCount(), 0);
});

test('the Worker validates routes before contacting scholarly providers', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json({}));
  for (const [path, status, error] of [
    ['/openalex?search=a&page=6', 400, 'Unsupported keyword query'],
    ['/openalex?search=student+AND+housing', 400, 'Unsupported keyword query'],
    ['/openalex?search=student+housing&page=6', 400, 'Page must be between 1 and 5'],
    ['/openalex?search=student+housing&filter=unsupported', 400, 'Unsupported filter'],
    ['/crossref?doi=not-a-doi', 400, 'Invalid DOI'],
    ['/unpaywall?doi=not-a-doi', 400, 'Invalid DOI'],
    ['/unpaywall?doi=10.1234%2Fpaper', 503, 'Operator contact not configured'],
    ['/unknown', 404, 'Unknown endpoint'],
  ] as const) {
    await assertError(await worker.fetch(request(path), environment), status, error);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('the Worker forwards only each provider’s supported parameters and keeps response bytes', async t => {
  const requests: { url: URL; options: RequestInit }[] = [];
  const body = '{"message":"Text with spaces ✓"}\n';
  t.mock.method(globalThis, 'fetch', async (url: URL, options: RequestInit) => {
    requests.push({ url, options });
    return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
  });
  const operatorEmail = 'operator@example.org';
  for (const path of [
    '/openalex?search=student+housing&page=1&mode=unused',
    '/openalex?search=student+housing&page=5&filter=from_publication_date%3A2021-01-01%2Cis_oa%3Atrue',
    '/crossref?doi=10.1234%2FPaper%2FPart&email=ignored',
    '/unpaywall?doi=10.1234%2FPaper%2FPart&email=ignored',
  ]) {
    const response = await worker.fetch(request(path), { ...environment, OPERATOR_EMAIL: operatorEmail });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('Content-Type'), 'application/json');
    assert.equal(await response.text(), body);
  }
  assert.deepEqual(requests.map(({ url }) => url.href), [
    'https://api.openalex.org/works?search=student+housing&per_page=20',
    'https://api.openalex.org/works?search=student+housing&per_page=20&page=5&filter=from_publication_date%3A2021-01-01%2Cis_oa%3Atrue',
    'https://api.crossref.org/works/10.1234%2FPaper%2FPart',
    'https://api.unpaywall.org/v2/10.1234%2FPaper%2FPart?email=operator%40example.org',
  ]);
  for (const { options } of requests) {
    assert.equal(new Headers(options.headers).get('Accept'), 'application/json');
    assert.ok(options.signal instanceof AbortSignal);
  }
});

test('the Worker preserves upstream error mapping and optional Retry-After', async t => {
  const replies = [
    new Response(null, { status: 429, headers: { 'Retry-After': '15' } }),
    new Response(null, { status: 429 }),
    new Response(null, { status: 404 }),
    new Response(null, { status: 500 }),
    new Response(null, { status: 204 }),
  ];
  t.mock.method(globalThis, 'fetch', async () => {
    const response = replies.shift();
    if (response) return response;
    throw new Error('Network failure');
  });
  const getPaper = () => worker.fetch(request('/crossref?doi=10.1234%2Fpaper'), environment);
  const throttled = await getPaper();
  assert.equal(throttled.headers.get('Retry-After'), '15');
  await assertError(throttled, 429, 'Free quota reached');
  const noRetry = await getPaper();
  assert.equal(noRetry.headers.get('Retry-After'), null);
  await assertError(noRetry, 429, 'Free quota reached');
  await assertError(await getPaper(), 404, 'Upstream unavailable');
  await assertError(await getPaper(), 502, 'Upstream unavailable');
  await assertError(await getPaper(), 502, 'Empty upstream response');
  await assertError(await getPaper(), 503, 'Research provider unavailable. Try its official website.');
});

test('the Worker enforces the existing byte cap and cancels an oversized upstream stream', async t => {
  let cancelled = false;
  const bodies = [
    new Uint8Array(2_000_000),
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1_500_000));
        controller.enqueue(new Uint8Array(500_001));
      },
      cancel() { cancelled = true; },
    }),
  ];
  t.mock.method(globalThis, 'fetch', async () => new Response(bodies.shift()));
  const getPaper = () => worker.fetch(request('/crossref?doi=10.1234%2Fpaper'), environment);
  assert.equal((await (await getPaper()).arrayBuffer()).byteLength, 2_000_000);
  await assertError(await getPaper(), 502, 'Response too large');
  assert.equal(cancelled, true);
});
