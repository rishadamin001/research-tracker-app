import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, devices } from 'playwright';

// Uses public scholarly APIs in a real browser; no key, proxy or paid service.
const url = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
const startServer = process.argv.includes('--serve');
const server = startServer ? spawn(process.execPath, ['scripts/preview.mjs'], { stdio: 'inherit' }) : undefined;
const report = { commitSha: process.env.GITHUB_SHA ?? null, url: url.href, checkedAt: new Date().toISOString(), query: 'Hypothyroidism', providers: [], consoleErrors: [] };
await mkdir('docs/smoke', { recursive: true });
let browser;
try {
  if (startServer) {
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch(url)).ok) { ready = true; break; } } catch { /* Server starting. */ }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, 'Preview server started');
  }
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => report.consoleErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  for (const provider of ['Europe PMC', 'Crossref', 'OpenAlex']) {
    await page.goto(new URL('#paper-search', url).href);
    await page.getByLabel('Search source', { exact: true }).selectOption(provider);
    await page.getByRole('textbox', { name: 'Search literature' }).fill(report.query);
    await page.getByRole('button', { name: 'Search papers', exact: true }).click();
    await page.getByRole('region', { name: 'Search result controls' }).waitFor({ timeout: 25000 });
    const before = await page.locator('article.paper').count();
    assert.ok(before > 0, `${provider}: first page has records`);
    assert.equal(await page.getByLabel('Sort papers').inputValue(), 'original');
    await page.getByRole('button', { name: 'Load next page', exact: true }).click();
    await page.getByText(/2 pages retrieved/).waitFor({ timeout: 25000 });
    const after = await page.locator('article.paper').count();
    assert.ok(after > before, `${provider}: second page adds records`);
    const titles = await page.locator('article.paper h3').allTextContents();
    report.providers.push({ provider, firstPageCount: before, twoPageCount: after, titles: titles.slice(0, 5) });
    await page.getByRole('region', { name: 'Search result controls' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `docs/smoke/search-${provider.toLowerCase().replace(/ /g, '-')}.png` });
  }
  const mobile = await browser.newPage(devices['Pixel 7']);
  await mobile.goto(new URL('#paper-search', url).href);
  await mobile.getByLabel('Search source', { exact: true }).selectOption('Europe PMC');
  await mobile.getByRole('textbox', { name: 'Search literature' }).fill(report.query);
  await mobile.getByRole('button', { name: 'Search papers', exact: true }).click();
  await mobile.getByRole('region', { name: 'Search result controls' }).waitFor({ timeout: 25000 });
  report.mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(report.mobileOverflow, false);
  await mobile.screenshot({ path: 'docs/smoke/search-mobile.png', fullPage: false });
  assert.deepEqual(report.consoleErrors, []);
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
  await writeFile('docs/smoke/search-live.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
}
