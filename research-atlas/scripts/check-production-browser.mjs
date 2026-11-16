import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const url = 'http://127.0.0.1:4173/';
const preview = spawn(process.execPath, ['scripts/preview.mjs'], { stdio: 'inherit' });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (preview.exitCode !== null) throw new Error('The production preview exited during startup');
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok && (await response.text()).includes('http-equiv="Content-Security-Policy"')) {
        ready = true;
        break;
      }
    } catch { /* The static preview is starting. */ }
    await delay(250);
  }
  assert.ok(ready, 'The production preview started');
  browser = await chromium.launch({ executablePath: process.env.ATLAS_BROWSER_EXECUTABLE });
  const page = await browser.newPage();
  const errors = [];
  let offline = false;
  await page.addInitScript(() => {
    window.addEventListener('securitypolicyviolation', event => {
      console.error('Atlas CSP violation', event.violatedDirective, event.blockedURI, event.sourceFile, event.lineNumber);
    });
  });
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    const resource = message.location().url;
    const expectedOfflineIcon = offline && resource === `${url}app-icon-192.png`
      && message.text().includes('ERR_INTERNET_DISCONNECTED');
    if (message.type() === 'error' && !expectedOfflineIcon) errors.push(`${message.text()} (${resource})`);
  });
  const providers = [
    ['OpenAlex', 'https://api.openalex.org/works?**', { meta: { count: 0 }, results: [] }],
    ['Europe PMC', 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?**', { hitCount: 0, resultList: { result: [] } }],
    ['Crossref', 'https://api.crossref.org/works?**', { message: { 'total-results': 0, items: [] } }],
  ];
  for (const [name, endpoint, fixture] of providers) {
    await page.route(endpoint, route => route.fulfill({ json: fixture }));
    await page.goto(`${url}#paper-search`);
    const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    assert.ok(policy?.includes("script-src 'self'"));
    await page.getByLabel('Search source', { exact: true }).selectOption(name);
    await page.getByRole('textbox', { name: 'Search literature' }).fill('campus study space');
    await page.getByRole('button', { name: 'Search papers', exact: true }).click();
    await page.getByText(`${name} reported 0 matches.`, { exact: false }).first().waitFor({ timeout: 10000 });
    await page.unroute(endpoint);
  }
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  offline = true;
  await page.context().setOffline(true);
  await page.reload();
  await page.getByRole('heading', { name: 'Paper search', exact: true }).waitFor();
  assert.deepEqual(errors, []);
  console.log('Production policy permits all three search fixtures and offline reopening.');
} finally {
  await browser?.close();
  preview.kill();
}

