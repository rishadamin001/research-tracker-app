import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium, devices } from 'playwright';

const url = new URL(process.argv[2] || 'http://127.0.0.1:4173/');
const local = ['127.0.0.1', 'localhost'].includes(url.hostname);
const label = local ? 'local' : 'production';
const packageVersion = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')).version;
const report = { commitSha: process.argv[3] ?? process.env.GITHUB_SHA ?? null, packageVersion, deploymentUrl: url.href,
  checkedAt: new Date().toISOString(), appLoaded: false, projectPersistence: false, openAlexMode: 'anonymous bounded basic pages',
  openAlexSearchResultCount: 0, crossrefLookup: false, unpaywallLookupIfConfigured: null, backupRestore: false,
  offlineProjectOpen: false, mobileOverflow: null, consoleErrors: [] };

const browser = await chromium.launch();
function observe(page) {
  page.on('pageerror', error => report.consoleErrors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1020 } });
  const page = await desktop.newPage();
  observe(page);
  assert.equal((await page.goto(new URL('#paper-search', url).href)).status(), 200);
  await page.getByRole('heading', { name: 'Paper search', exact: true }).waitFor();
  report.appLoaded = true;
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  await page.getByRole('region', { name: 'Search result controls' }).waitFor({ timeout: 20000 });
  report.openAlexSearchResultCount = await page.locator('article.paper').count();
  assert.ok(report.openAlexSearchResultCount > 0);
  const firstPageCount = report.openAlexSearchResultCount;
  await page.getByRole('button', { name: 'Load next page', exact: true }).click();
  await page.getByText(/2 pages retrieved/).waitFor({ timeout: 20000 });
  report.openAlexSearchResultCount = await page.locator('article.paper').count();
  report.openAlexSecondPage = report.openAlexSearchResultCount > firstPageCount;
  assert.ok(report.openAlexSecondPage);
  assert.equal(await page.getByLabel('Sort papers').inputValue(), 'quartile');
  await page.getByText('POSI Q1 · 2026', { exact: true }).first().waitFor();
  await page.getByRole('region', { name: 'Search result controls' }).evaluate(element => {
    window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 95);
  });
  await page.screenshot({ path: `../atlas-${label}-paper-search.png` });
  await page.getByLabel('Sort papers').selectOption('journalFee');
  await page.locator('article.paper').first().getByText('Listed open access APC').waitFor();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Student housing smoke project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByText('Saved on this device', { exact: true }).waitFor({ state: 'attached' });
  await page.reload();
  await page.getByText('Student housing smoke project', { exact: true }).first().waitFor();
  report.projectPersistence = true;

  await page.goto(new URL('#publication', url).href);
  await page.getByLabel('Article DOI').fill('10.1038/nature12373');
  await page.getByRole('button', { name: 'Check DOI metadata' }).click();
  await page.getByText('VERIFIED METADATA · CROSSREF', { exact: true }).waitFor({ timeout: 20000 });
  report.crossrefLookup = true;

  await page.goto(new URL('#projects', url).href);
  const backup = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup', exact: true }).click();
  await page.locator('input[accept=".json,application/json"]').setInputFiles(await (await backup).path());
  await page.getByRole('button', { name: 'Import as new copies' }).click();
  await page.getByRole('heading', { name: 'Student housing smoke project (imported)', exact: true }).waitFor();
  await page.getByText('Saved on this device', { exact: true }).waitFor({ state: 'attached' });
  report.backupRestore = true;

  await page.goto(new URL('#overview', url).href);
  await page.getByRole('heading', { name: 'Your research today', exact: true }).waitFor();
  report.returningDashboard = true;
  await page.screenshot({ path: `../atlas-${label}-home-desktop.png` });

  await page.getByLabel('Guidance mode').selectOption('expert');
  await page.reload();
  assert.equal(await page.getByLabel('Guidance mode').inputValue(), 'expert');
  await page.getByLabel('Guidance mode').selectOption('guided');
  report.guidanceModePersists = true;
  await page.goto(new URL('#library', url).href);
  await page.getByRole('heading', { name: 'Atlas Library', exact: true }).waitFor();
  report.libraryOpens = true;
  await page.screenshot({ path: `../atlas-${label}-library.png` });
  await page.goto(new URL('#history', url).href);
  await page.getByRole('heading', { name: 'Project history', exact: true }).waitFor();
  report.projectHistoryOpens = true;

  await page.goto(new URL('#guide', url).href);
  await page.getByRole('button', { name: 'Data, surveys & analysis', exact: true }).click();
  await page.screenshot({ path: `../atlas-${label}-planner.png` });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await desktop.setOffline(true);
  await page.goto(new URL('#projects', url).href);
  await page.reload();
  await page.getByRole('heading', { name: 'Student housing smoke project (imported)', exact: true }).waitFor();
  report.offlineProjectOpen = true;
  await desktop.close();

  const mobile = await browser.newPage(devices['Pixel 7']);
  observe(mobile);
  await mobile.goto(new URL('#guide', url).href);
  await mobile.getByRole('button', { name: 'Toolkit', exact: true }).click();
  report.mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await mobile.screenshot({ path: `../atlas-${label}-mobile.png` });
  await mobile.goto(new URL('#overview', url).href);
  await mobile.getByRole('heading', { name: /Turn curiosity/ }).waitFor();
  await mobile.screenshot({ path: `../atlas-${label}-home.png` });
  assert.equal(report.mobileOverflow, false);
  assert.deepEqual(report.consoleErrors, []);
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await browser.close();
  await mkdir('docs/smoke', { recursive: true });
  await writeFile(`docs/smoke/${label}-latest.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
