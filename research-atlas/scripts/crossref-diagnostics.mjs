import { chromium, firefox, webkit } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

// Diagnostic observations, not a claim that an intermittent provider outage is fixed.
const urls = process.argv.slice(2);
if (!urls.length) throw Error('Provide preview and/or published app URLs.');
const report = { checkedAt: new Date().toISOString(), observations: [] };
for (const url of urls) for (const [engine, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const observation = { url, engine, requests: [], firstPage: [], afterPaging: [], errors: [] };
  report.observations.push(observation);
  let browser;
  try {
    browser = await launcher.launch();
    const page = await browser.newPage();
    page.on('response', response => { if (response.url().startsWith('https://api.crossref.org/works?')) observation.requests.push({ url: response.url(), status: response.status(), kind: 'response' }); });
    page.on('requestfailed', request => { if (request.url().startsWith('https://api.crossref.org/works?')) observation.requests.push({ url: request.url(), kind: 'request-failed', failure: request.failure()?.errorText, status: null }); });
    page.on('pageerror', error => observation.errors.push(error.message));
    await page.goto(new URL('#paper-search', url).href);
    await page.getByLabel('Search source', { exact: true }).selectOption('Crossref');
    await page.getByRole('textbox', { name: 'Search literature' }).fill('Hypothyroidism');
    await page.getByRole('button', { name: 'Search papers', exact: true }).click();
    await page.getByRole('region', { name: 'Search result controls' }).waitFor({ timeout: 25000 });
    observation.firstPage = await page.locator('article.paper h3').allTextContents();
    await page.getByRole('button', { name: 'Load next page', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('button[disabled]')?.textContent?.includes('Loading next'));
    await Promise.race([
      page.getByText(/2 pages retrieved/).waitFor({ timeout: 25000 }),
      page.getByRole('button', { name: /Retry/ }).first().waitFor({ timeout: 25000 }),
    ]);
    observation.afterPaging = await page.locator('article.paper h3').allTextContents();
    observation.firstPageRetained = observation.firstPage.every(title => observation.afterPaging.includes(title));
    observation.addedRecords = observation.afterPaging.length > observation.firstPage.length;
    observation.visibleStatus = await page.getByRole('region', { name: 'Search result controls' }).innerText();
    observation.retryVisible = await page.getByRole('button', { name: /Retry/ }).first().isVisible();
    await mkdir('docs/smoke', { recursive: true });
    await page.screenshot({ path: `docs/smoke/crossref-${new URL(url).hostname}-${engine}.png` });
    if (!observation.firstPageRetained) process.exitCode = 1;
  } catch (error) { observation.unverified = error.message; }
  finally { await browser?.close(); }
}
await mkdir('docs/smoke', { recursive: true });
await writeFile('docs/smoke/crossref-diagnostics.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
