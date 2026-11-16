import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium, devices } from 'playwright';

const args = process.argv.slice(2);
const [site, expectedCommit = null] = args.filter(arg => arg !== '--serve');
const url = new URL(site || 'http://127.0.0.1:4173/');
const label = ['127.0.0.1', 'localhost'].includes(url.hostname) ? 'local' : 'production';
const startPreview = args.includes('--serve');
const report = {
  runnerCommit: process.env.GITHUB_SHA ?? null,
  expectedCommit: expectedCommit || null,
  servedBuild: null,
  deploymentUrl: url.href,
  checkedAt: new Date().toISOString(),
  checks: [],
  errors: [],
};
const draft = 'How do commuter students choose campus study spaces?';
const note = 'Compare access before and after evening classes.';
const route = name => new URL('#' + name, url).href;
const checked = name => report.checks.push(name);
let browser;
let preview;
let offline = false;

function observe(page) {
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    const expectedOfflineIcon = offline && message.location().url === new URL('app-icon-192.png', url).href
      && message.text().includes('ERR_INTERNET_DISCONNECTED');
    if (message.type() === 'error' && !expectedOfflineIcon) report.errors.push(message.text());
  });
}

try {
  assert.ok(!expectedCommit || /^[0-9a-f]{40}$/.test(expectedCommit), 'Supply a full Git commit SHA.');
  if (startPreview) {
    assert.equal(url.origin, 'http://127.0.0.1:4173', 'The preview uses http://127.0.0.1:4173.');
    preview = spawn(process.execPath, ['scripts/preview.mjs'], { stdio: 'inherit' });
    let ready = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (preview.exitCode !== null) throw new Error('The production preview exited during startup');
      try { if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } }
      catch { /* The static preview is starting. */ }
      await delay(250);
    }
    assert.ok(ready, 'The production preview started');
  }
  browser = await chromium.launch({ executablePath: process.env.ATLAS_BROWSER_EXECUTABLE });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  observe(page);
  assert.equal((await page.goto(route('guide')))?.status(), 200);
  report.servedBuild = await page.evaluate(() => ({
    commit: document.querySelector('meta[name="atlas-build-commit"]')?.content ?? null,
    version: document.querySelector('meta[name="atlas-build-version"]')?.content ?? null,
  }));
  if (expectedCommit) assert.equal(report.servedBuild.commit, expectedCommit, 'Published build must match the expected commit.');
  await page.getByRole('heading', { name: 'Practice research skills' }).waitFor();
  assert.equal(await page.getByRole('list', { name: 'Practice lessons' }).getByRole('button').count(), 6);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Check answer', exact: true }).click();
  await page.locator('.practice-feedback').waitFor();
  await page.screenshot({ path: `../atlas-${label}-learn.png` });
  checked('Learn offers six practice lessons with feedback');

  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Release verification fixture');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto(route('question'));
  await page.getByRole('button', { name: 'Question wording', exact: true }).click();
  await page.getByLabel('Your research question', { exact: true }).fill(draft);
  await page.getByLabel('Guidance mode', { exact: true }).selectOption('expert');
  await page.getByLabel('Guidance mode', { exact: true }).selectOption('guided');
  await page.getByText('Uncommitted question draft saved locally.', { exact: true }).waitFor();
  await page.reload();
  assert.equal(await page.getByLabel('Your research question', { exact: true }).inputValue(), draft);
  checked('Question draft persists through guidance changes and reload');

  await page.getByRole('navigation', { name: 'Project workspace' }).getByRole('button', { name: 'Notebook' }).click();
  await page.getByLabel('My note', { exact: true }).fill(note);
  await page.getByRole('button', { name: 'Save my note', exact: true }).click();
  await page.getByText(note, { exact: true }).waitFor();
  await page.getByText('Saved on this device', { exact: true }).waitFor({ state: 'attached' });
  await page.goto(route('projects'));
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup', exact: true }).click();
  const backup = JSON.parse(await readFile(await (await download).path(), 'utf8'));
  assert.equal(backup.backupVersion, 3);
  assert.equal(backup.projects[0].questionDraft, draft);
  assert.equal(backup.projects[0].notebookNotes[0].text, note);
  await desktop.close();
  checked('Portable backup includes the question draft and notebook');

  const restored = await browser.newContext();
  const restoredPage = await restored.newPage();
  observe(restoredPage);
  await restoredPage.goto(route('projects'));
  await restoredPage.getByRole('button', { name: 'Download backup', exact: true }).waitFor();
  await restoredPage.getByLabel('Import backup', { exact: true }).setInputFiles({
    name: 'release-backup.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup)),
  });
  await restoredPage.getByRole('button', { name: 'Import as new copies', exact: true }).click();
  const imported = restoredPage.getByRole('heading', { name: 'Release verification fixture (imported)', exact: true });
  await imported.waitFor();
  await restoredPage.getByText('Saved on this device', { exact: true }).waitFor({ state: 'attached' });
  const copied = restoredPage.waitForEvent('download');
  await restoredPage.getByRole('button', { name: 'Download backup', exact: true }).click();
  const actual = JSON.parse(await readFile(await (await copied).path(), 'utf8')).projects[0];
  const original = backup.projects[0];
  assert.notEqual(actual.id, original.id);
  assert.equal(actual.title, original.title + ' (imported)');
  assert.deepEqual({ ...actual, id: original.id, title: original.title }, original);
  checked('Fresh browser context restores every project field');

  await restoredPage.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  offline = true;
  await restored.setOffline(true);
  await restoredPage.reload();
  await imported.waitFor();
  await restored.close();
  offline = false;
  checked('Restored project reopens offline');

  const mobile = await browser.newPage(devices['Pixel 7']);
  observe(mobile);
  await mobile.goto(route('guide'));
  await mobile.getByRole('heading', { name: 'Practice research skills' }).waitFor();
  assert.ok(await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await mobile.screenshot({ path: `../atlas-${label}-learn-mobile.png` });
  checked('Learn fits Pixel 7 emulation');
  assert.deepEqual(report.errors, []);
} catch (error) {
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  await browser?.close();
  preview?.kill();
  await mkdir('docs/smoke', { recursive: true });
  await writeFile(`docs/smoke/${label}-latest.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}
