import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [html, headers, manifest] = await Promise.all([
  readFile(new URL('../out/index.html', import.meta.url), 'utf8'),
  readFile(new URL('../out/_headers', import.meta.url), 'utf8'),
  readFile(new URL('../package.json', import.meta.url), 'utf8').then(JSON.parse),
]);
const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/);
assert.ok(policy, 'The production HTML must carry its Content Security Policy');
assert.ok(policy.index < html.indexOf('<script'), 'The policy must precede app scripts');
const csp = policy[1].replaceAll('&#39;', "'");
const directives = new Map(csp.split('; ').map(value => {
  const [name, ...sources] = value.split(' ');
  return [name, sources];
}));
assert.deepEqual(directives.get('default-src'), ["'none'"]);
assert.deepEqual(directives.get('script-src'), ["'self'"]);
assert.deepEqual(directives.get('worker-src'), ["'self'"]);
assert.deepEqual(directives.get('base-uri'), ["'none'"]);
assert.ok(!directives.has('frame-ancestors'), 'Frame protection belongs in the HTTP policy');
for (const source of ["'self'", 'https://api.openalex.org', 'https://api.crossref.org', 'https://www.ebi.ac.uk']) {
  assert.ok(directives.get('connect-src')?.includes(source), `Expected connection source ${source}`);
}
assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin">/);
const marker = name => html.match(new RegExp(`<meta name="atlas-build-${name}" content="([^"]+)">`))?.[1];
assert.equal(marker('version'), manifest.version);
assert.equal(marker('commit'), process.env.GITHUB_SHA || undefined);
assert.equal(headers.split(/\r?\n/).find(line => line.startsWith('  Content-Security-Policy: ')),
  `  Content-Security-Policy: ${csp}; frame-ancestors 'none'`);
for (const header of ['X-Content-Type-Options: nosniff', 'Referrer-Policy: strict-origin-when-cross-origin', 'X-Frame-Options: DENY']) {
  assert.ok(headers.includes(`  ${header}\n`));
}
console.log('Production HTML policy, static host headers and build identity verified.');
