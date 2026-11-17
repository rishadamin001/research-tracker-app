import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { checkAndroidWebPrerequisites } from '../scripts/check-android-web-prerequisites.mjs';

const app = 'https://atlas.example/research-tracker-app/';
const appPath = '/research-tracker-app/';
const dalPath = '/.well-known/assetlinks.json';
const packageId = 'example.atlas';
const fingerprint = Array(32).fill('AB').join(':');
const association = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: { namespace: 'android_app', package_name: packageId, sha256_cert_fingerprints: [fingerprint] },
}];
const manifest = await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8');
const icons = await Promise.all([192, 512].map(size =>
  readFile(new URL(`../public/app-icon-${size}.png`, import.meta.url))));

function response(body, contentType, status = 200, headers = {}) {
  return () => new Response(body, { status, headers: { 'content-type': contentType, ...headers } });
}

function run({ overrides = {}, identity = [] } = {}) {
  const resources = {
    [appPath]: response('<head><link href="manifest.webmanifest" rel="manifest"></head>', 'text/html'),
    [`${appPath}manifest.webmanifest`]: response(manifest, 'application/manifest+json; charset=utf-8'),
    [`${appPath}app-icon-192.png`]: response(icons[0], 'image/png'),
    [`${appPath}app-icon-512.png`]: response(icons[1], 'image/png'),
    [`${appPath}sw.js`]: response("self.addEventListener('install', () => {});", 'application/javascript'),
    [dalPath]: response('Not found', 'text/html', 404),
    [`${appPath}.well-known/assetlinks.json`]: response(JSON.stringify(association), 'application/json'),
    ...overrides,
  };
  return checkAndroidWebPrerequisites(`${app}#overview`, identity[0], identity[1], async (url, init) => {
    assert.equal(url.hash, '');
    assert.equal(init.method, 'GET');
    assert.equal(init.redirect, 'manual');
    return resources[url.pathname]?.() ?? response('Unrecognized URL', 'text/html', 404)();
  });
}

test('a project subpath cannot supply the origin association and an omitted identity is pending', async () => {
  const results = await run();
  assert.deepEqual(results.map(entry => entry.status), ['PASS', 'PASS', 'PASS', 'PASS', 'PASS', 'FAIL', 'PENDING']);
  assert.match(results.at(-2).detail, /HTTP 404 at https:\/\/atlas\.example\/\.well-known\/assetlinks\.json/);
  assert.match(results.at(-1).detail, /Supply the approved application ID/);
});

test('root Digital Asset Links must match both the package and certificate', async () => {
  const overrides = { [dalPath]: response(JSON.stringify(association), 'application/json') };
  const matched = await run({ overrides, identity: [packageId, fingerprint.toLowerCase()] });
  assert.ok(matched.every(entry => entry.status === 'PASS'));
  for (const identity of [['example.other', fingerprint], [packageId, Array(32).fill('CD').join(':')]]) {
    const results = await run({ overrides, identity });
    assert.equal(results.at(-2).status, 'PASS');
    assert.equal(results.at(-1).status, 'FAIL');
  }
});

test('Digital Asset Links redirects are reported and cannot verify an identity', async () => {
  const results = await run({
    overrides: { [dalPath]: response(null, 'application/json', 302, { location: 'https://other.example/assetlinks.json' }) },
    identity: [packageId, fingerprint],
  });
  assert.match(results.at(-2).detail, /HTTP 302 \(redirect\)/);
  assert.equal(results.at(-1).status, 'PENDING');
});

test('app scope, icon dimensions and service-worker scope have independent failures', async () => {
  const results = await run({
    overrides: {
      [`${appPath}manifest.webmanifest`]: response(manifest.replace('"scope": "./"', '"scope": "/"'), 'application/json'),
      [`${appPath}app-icon-512.png`]: response(icons[0], 'image/png'),
      [`${appPath}sw.js`]: response('/* worker */', 'application/javascript', 200, { 'service-worker-allowed': `${appPath}other/` }),
    },
  });
  assert.deepEqual(results.slice(0, 5).map(entry => entry.status), ['PASS', 'FAIL', 'PASS', 'FAIL', 'FAIL']);
});
