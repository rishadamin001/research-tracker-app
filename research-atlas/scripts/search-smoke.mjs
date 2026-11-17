import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, devices } from 'playwright';

// Uses public scholarly APIs in a real browser, with independent sessions and no credentials.
const url = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
const startServer = process.argv.includes('--serve');
const providerHosts = { 'Europe PMC': 'www.ebi.ac.uk', Crossref: 'api.crossref.org', OpenAlex: 'api.openalex.org' };
const resultTimeout = 25000;
const report = {
  runnerCommit: process.env.GITHUB_SHA ?? null,
  servedBuild: null,
  url: url.href,
  checkedAt: new Date().toISOString(),
  query: 'Hypothyroidism',
  providers: [],
  providerHttpErrors: [],
  providerNetworkErrors: [],
  consoleErrors: [],
};
await mkdir('docs/smoke', { recursive: true });

function checkEvents(page, outcome) {
  function recordConsoleError(message) {
    outcome.consoleErrors.push(message);
    report.consoleErrors.push({ provider: outcome.provider, device: outcome.device, message });
  }

  function endpoint(requestUrl) {
    const { hostname, pathname } = new URL(requestUrl);
    if (hostname !== providerHosts[outcome.provider]) return null;
    return { provider: outcome.provider, device: outcome.device, stage: outcome.stage, hostname, pathname };
  }

  page.on('pageerror', error => recordConsoleError(error.message));
  page.on('console', message => { if (message.type() === 'error') recordConsoleError(message.text()); });
  page.on('response', response => {
    const info = endpoint(response.url());
    if (!info || response.status() < 400) return;
    report.providerHttpErrors.push({ ...info, status: response.status(), retryAfter: response.headers()['retry-after'] ?? null });
  });
  page.on('requestfailed', request => {
    const info = endpoint(request.url());
    if (info) report.providerNetworkErrors.push({ ...info, failure: request.failure()?.errorText ?? null });
  });
}

async function checkProvider(browser, provider, mobile = false) {
  const device = mobile ? 'mobile' : 'desktop';
  const slug = mobile ? 'mobile' : provider.toLowerCase().replaceAll(' ', '-');
  const outcome = { provider, device, status: 'failed', stage: 'opening search', consoleErrors: [] };
  let page;

  try {
    page = await browser.newPage(mobile ? devices['Pixel 7'] : { viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(10000);
    checkEvents(page, outcome);
    await page.goto(new URL('#paper-search', url).href, { waitUntil: 'domcontentloaded' });
    report.servedBuild ??= await page.evaluate(() => ({
      commit: document.querySelector('meta[name="atlas-build-commit"]')?.content ?? null,
      version: document.querySelector('meta[name="atlas-build-version"]')?.content ?? null,
    }));

    const controls = page.getByRole('region', { name: 'Search result controls', exact: true });
    const searchError = page.getByRole('region', { name: 'Search error', exact: true });
    const articles = page.locator('article.paper');

    async function waitForResult(expected) {
      await expected.or(searchError).first().waitFor({ timeout: resultTimeout });
      if (await searchError.isVisible()) throw Error(await searchError.getByRole('alert').innerText());
    }

    outcome.stage = 'first page';
    await page.getByLabel('Search source', { exact: true }).selectOption(provider);
    await page.getByRole('textbox', { name: 'Search literature' }).fill(report.query);
    await page.getByRole('button', { name: 'Search papers', exact: true }).click();
    await waitForResult(controls);
    outcome.firstPageCount = await articles.count();
    assert.ok(outcome.firstPageCount > 0, `${provider}: first page has records`);
    assert.equal(await page.getByLabel('Sort papers').inputValue(), 'original');

    if (mobile) {
      outcome.stage = 'mobile layout';
      outcome.overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(outcome.overflow, false);
    } else {
      outcome.stage = 'second page';
      await controls.getByRole('button', { name: 'Load next page', exact: true }).click();
      await waitForResult(controls.getByText(/2 pages retrieved/));
      const showAll = controls.getByRole('button', { name: 'Show all retrieved papers', exact: true });
      if (await showAll.isVisible()) {
        outcome.newPageCount = await page.getByText('New in the latest loaded page', { exact: true }).count();
        assert.ok(outcome.newPageCount > 0, `${provider}: the latest page contains new papers`);
        assert.equal(await articles.count(), outcome.newPageCount, `${provider}: only the latest papers are shown`);
        await showAll.click();
      }
      outcome.twoPageCount = await articles.count();
      assert.ok(outcome.twoPageCount > outcome.firstPageCount, `${provider}: second page adds records`);
      outcome.titles = (await articles.locator('h3').allTextContents()).slice(0, 5);
      await controls.scrollIntoViewIfNeeded();
    }
    assert.deepEqual(outcome.consoleErrors, []);
    outcome.status = 'passed';
  } catch (error) {
    outcome.failure = error.message;
    if (page && !page.isClosed()) {
      try {
        const panel = page.getByRole('region', { name: 'Search error', exact: true });
        const retry = panel.getByRole('button', { name: /^Retry this (page|search)$/ });
        outcome.visiblePaperCount = await page.locator('article.paper').count();
        outcome.errorNotice = await panel.isVisible() ? await panel.innerText() : null;
        outcome.retry = await retry.isVisible() ? { label: await retry.innerText(), enabled: await retry.isEnabled() } : null;
      } catch (diagnosticError) { outcome.diagnosticFailure = diagnosticError.message; }
    }
  } finally {
    if (page && !page.isClosed()) {
      const path = `docs/smoke/search-${slug}.png`;
      try {
        await page.screenshot({ path, timeout: 5000 });
        outcome.screenshot = path;
      } catch (error) { outcome.screenshotFailure = error.message; }
      await page.close().catch(error => {
        outcome.cleanupFailure = error.message;
        outcome.status = 'failed';
      });
    }
  }
  return outcome;
}

let server;
let browser;
try {
  if (startServer) {
    server = spawn(process.execPath, ['scripts/preview.mjs'], { stdio: 'inherit' });
    let ready = false;
    for (let i = 0; i < 40; i++) {
      if (server.exitCode !== null) throw Error('Preview server exited before it was ready.');
      try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } }
      catch { /* Server starting. */ }
      await delay(250);
    }
    assert.ok(ready, 'Preview server started');
  }
  browser = await chromium.launch({ executablePath: process.env.ATLAS_BROWSER_EXECUTABLE, timeout: 20000 });
  for (const provider of Object.keys(providerHosts)) report.providers.push(await checkProvider(browser, provider));
  report.mobile = await checkProvider(browser, 'Europe PMC', true);
  const failed = [...report.providers, report.mobile].filter(outcome => outcome.status === 'failed');
  if (failed.length) throw Error(`Search checks failed: ${failed.map(outcome => `${outcome.provider} (${outcome.device}, ${outcome.stage})`).join(', ')}`);
  assert.deepEqual(report.consoleErrors, []);
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  server?.kill();
  await browser?.close().catch(error => {
    report.cleanupFailure = error.message;
    process.exitCode = 1;
  });
  await writeFile('docs/smoke/search-live.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
