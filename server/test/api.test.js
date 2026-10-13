import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../src/app.js';

const paperInput = {
  title: 'A study of student research habits',
  authors: 'Amina Khan, Gabriel Chen',
  journal: 'Journal of Learning Sciences',
  publicationYear: 2025,
  status: 'reading',
};

async function startApi(databasePath = ':memory:') {
  const app = createApp({ databasePath, serveClient: false });
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  return {
    async request(path, options = {}) {
      const { body, rawBody, ...fetchOptions } = options;
      const response = await fetch(`${baseUrl}${path}`, {
        ...fetchOptions,
        headers: { 'Content-Type': 'application/json', ...options.headers },
        body: rawBody === undefined ? (body === undefined ? undefined : JSON.stringify(body)) : rawBody,
      });
      return { status: response.status, body: response.status === 204 ? null : await response.json() };
    },
    async close() {
      await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      app.locals.closeDatabase();
    },
  };
}

test('paper CRUD operations keep status metrics accurate', async (t) => {
  const api = await startApi();
  t.after(() => api.close());
  assert.deepEqual((await api.request('/api/health')).body, { status: 'ok' });
  assert.deepEqual((await api.request('/api/metrics')).body, { total: 0, reading: 0, read: 0, published: 0 });

  const createdPapers = [];
  for (const status of ['reading', 'read', 'published']) {
    const created = await api.request('/api/papers', { method: 'POST', body: { ...paperInput, status, title: `  ${status} paper  ` } });
    assert.equal(created.status, 201);
    assert.equal(created.body.paper.title, `${status} paper`);
    assert.equal(created.body.paper.status, status);
    assert.match(created.body.paper.createdAt, /^\d{4}-\d{2}-\d{2}T/);
    createdPapers.push(created.body.paper);
  }
  assert.equal((await api.request('/api/papers')).body.papers.length, 3);
  assert.deepEqual((await api.request('/api/metrics')).body, { total: 3, reading: 1, read: 1, published: 1 });

  const id = createdPapers[0].id;
  const updated = await api.request(`/api/papers/${id}`, { method: 'PATCH', body: { status: 'read', title: 'Finished paper' } });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.paper.title, 'Finished paper');
  assert.equal(updated.body.paper.authors, paperInput.authors);
  assert.equal(updated.body.paper.createdAt, createdPapers[0].createdAt);
  assert.deepEqual((await api.request('/api/metrics')).body, { total: 3, reading: 0, read: 2, published: 1 });

  const replaced = await api.request(`/api/papers/${id}`, { method: 'PUT', body: { ...paperInput, publicationYear: 2026, status: 'published' } });
  assert.equal(replaced.status, 200);
  assert.equal(replaced.body.paper.publicationYear, 2026);
  assert.deepEqual((await api.request(`/api/papers/${id}`)).body.paper, replaced.body.paper);

  assert.equal((await api.request(`/api/papers/${id}`, { method: 'DELETE' })).status, 204);
  assert.equal((await api.request(`/api/papers/${id}`)).status, 404);
  assert.equal((await api.request(`/api/papers/${id}`, { method: 'DELETE' })).status, 404);
  assert.deepEqual((await api.request('/api/metrics')).body, { total: 2, reading: 0, read: 1, published: 1 });
});

test('invalid input is rejected without changing stored papers', async (t) => {
  const api = await startApi();
  t.after(() => api.close());
  const created = await api.request('/api/papers', { method: 'POST', body: paperInput });
  const id = created.body.paper.id;

  const invalidBodies = [
    { ...paperInput, title: '   ' },
    { ...paperInput, authors: null },
    { ...paperInput, journal: 'x'.repeat(301) },
    { ...paperInput, publicationYear: '2025' },
    { ...paperInput, publicationYear: 0 },
    { ...paperInput, publicationYear: 2025.5 },
    { ...paperInput, publicationYear: 10000 },
    { ...paperInput, status: 'unknown' },
    { ...paperInput, id: 100 },
    {},
    null,
    [],
  ];
  for (const body of invalidBodies) {
    const result = await api.request('/api/papers', { method: 'POST', body });
    assert.equal(result.status, 400);
    assert.equal(typeof result.body.error, 'string');
  }
  assert.equal((await api.request(`/api/papers/${id}`, { method: 'PATCH', body: {} })).status, 400);
  assert.equal((await api.request(`/api/papers/${id}`, { method: 'PATCH', body: { status: 'invalid' } })).status, 400);
  assert.equal((await api.request(`/api/papers/${id}`, { method: 'PUT', body: { title: 'Incomplete' } })).status, 400);
  const malformed = await api.request('/api/papers', { method: 'POST', rawBody: '{"title":' });
  assert.equal(malformed.status, 400);
  assert.match(malformed.body.error, /valid JSON/);
  const oversized = await api.request('/api/papers', { method: 'POST', body: { ...paperInput, title: 'x'.repeat(40_000) } });
  assert.equal(oversized.status, 413);
  assert.match(oversized.body.error, /too large/);
  assert.equal((await api.request('/api/papers/not-an-id')).status, 400);
  assert.equal((await api.request('/api/papers/99999')).status, 404);
  assert.equal((await api.request('/api/no-such-route')).status, 404);
  assert.deepEqual((await api.request(`/api/papers/${id}`)).body.paper, created.body.paper);
  assert.deepEqual((await api.request('/api/metrics')).body, { total: 1, reading: 1, read: 0, published: 0 });
});

test('papers persist after the SQLite database is closed and reopened', async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'research-tracker-'));
  let runningApi;
  t.after(async () => {
    if (runningApi) await runningApi.close();
    await rm(directory, { recursive: true, force: true });
  });
  const databasePath = join(directory, 'papers.db');
  const firstApi = await startApi(databasePath);
  runningApi = firstApi;
  const created = await firstApi.request('/api/papers', { method: 'POST', body: paperInput });
  await firstApi.close();
  runningApi = undefined;

  const secondApi = await startApi(databasePath);
  runningApi = secondApi;
  assert.deepEqual((await secondApi.request(`/api/papers/${created.body.paper.id}`)).body.paper, created.body.paper);
  assert.deepEqual((await secondApi.request('/api/metrics')).body, { total: 1, reading: 1, read: 0, published: 0 });
});
