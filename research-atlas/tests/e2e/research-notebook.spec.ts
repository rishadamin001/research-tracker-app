import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { createProject, paperSchema } from '../../src/lib/model';

async function importProject(page: Page, filename: string, buffer: Buffer, expectedTitle: string) {
  await page.goto('/#projects');
  const input = page.getByLabel('Import backup', { exact: true });
  await expect(input).toBeEnabled();
  await input.setInputFiles({ name: filename, mimeType: 'application/json', buffer });
  await page.getByRole('button', { name: 'Import as new copies', exact: true }).click();
  await expect(page.getByRole('heading', { name: expectedTitle, exact: true })).toBeVisible();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
}

test('source notes keep their context through writing, export and restoration on a fresh workspace', async ({ page, browser, baseURL }) => {
  test.setTimeout(90_000);
  const project = createProject('Notebook project');
  const paperId = 'commuter-source';
  const paperTitle = 'Campus commute survey';
  const originalNote = 'Earlier working note about the sampling frame.';
  const note = 'Check whether timetable variation explains commute differences.';
  const finding = 'Commute times differed between campuses.';
  const finalAction = 'Compare the timetable data by campus.';
  const time = new Date().toISOString();
  project.papers = [paperSchema.parse({
    id: paperId, title: paperTitle, authors: 'A. Scholar', year: 2025, journal: 'Transport Studies',
    doi: '10.1234/commutes', url: 'https://example.org/commutes', oa: null, source: 'Fixture',
    notes: originalNote,
    evidenceClaims: [{
      id: '86937d2b-0990-4c4f-a379-4c1f0a61697c', claimType: 'finding', claimText: finding,
      evidenceLevel: 'full_text', locator: 'Table 3, p. 9', interpretation: '',
      uncertainty: 'Two campuses.', reviewStatus: 'draft', createdAt: time,
    }],
  })];
  const backupFixture = Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: time, projects: [project] }));
  await importProject(page, 'notebook-fixture.json', backupFixture, 'Notebook project (imported)');
  await page.goto(`/#extract?paper=${paperId}`);
  await page.getByRole('button', { name: 'Add my note', exact: true }).click();
  await expect(page).toHaveURL(/#notebook\?paper=commuter-source$/);
  await expect(page.getByRole('list', { name: 'Sources linked to this note' })).toContainText(paperTitle);
  await expect(page.getByText(originalNote, { exact: true })).toBeVisible();
  await expect(page.getByText(finding, { exact: true })).toBeVisible();
  await expect(page.getByText('Location: Table 3, p. 9', { exact: true })).toBeVisible();

  await page.getByLabel('Note type', { exact: true }).selectOption('question');
  await page.getByLabel('My note', { exact: true }).fill(note);
  await page.getByLabel('Next step (optional)', { exact: true }).fill('Look up timetables.');
  await page.getByLabel('Guidance mode', { exact: true }).selectOption('expert');
  await expect(page.getByLabel('My note', { exact: true })).toHaveValue(note);
  await page.getByRole('button', { name: 'Save my note', exact: true }).click();
  await expect(page.getByText(note, { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Edit note', exact: true }).click();
  await page.getByLabel('Next step (optional)', { exact: true }).fill(finalAction);
  await page.getByLabel('Action status', { exact: true }).selectOption('done');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  await expect(page.getByText(`Next step: ${finalAction}`, { exact: true })).toBeVisible();
  await page.getByLabel('Find notebook entries', { exact: true }).fill('timetable');
  await expect(page.getByText('1 entry', { exact: true })).toBeVisible();
  await expect(page.getByText('Status: Done', { exact: true })).toBeVisible();
  const exportPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export notebook', exact: true }).click();
  const exported = await readFile((await (await exportPending).path())!, 'utf8');
  expect(exported).toContain('Source finding');
  expect(exported).toContain('Question / next action');
  expect(exported).toContain('Earlier working note');
  expect(exported).toContain('DOI: 10.1234/commutes');
  expect(exported).toContain(`Next step: ${finalAction}`);

  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.goto(`/#writing?paper=${paperId}`);
  await page.getByRole('button', { name: 'Add my note', exact: true }).click();
  await expect(page).toHaveURL(/#notebook\?paper=commuter-source$/);
  await expect(page.getByText(note, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.goto('/#projects');
  const backupPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup', exact: true }).click();
  const backup = await readFile((await (await backupPending).path())!);
  const restoreContext = await browser.newContext({ baseURL, viewport: page.viewportSize() ?? undefined });
  try {
    const restored = await restoreContext.newPage();
    await importProject(restored, 'portable-notebook.json', backup, 'Notebook project (imported) (imported)');
    await restored.goto(`/#notebook?paper=${paperId}`);
    await expect(restored.getByText(note, { exact: true })).toBeVisible();
    await expect(restored.getByText(`Next step: ${finalAction}`, { exact: true })).toBeVisible();
    await expect(restored.getByText('Status: Done', { exact: true })).toBeVisible();
    await expect(restored.getByText(originalNote, { exact: true })).toBeVisible();
    await expect(restored.getByText(finding, { exact: true })).toBeVisible();
  } finally {
    await restoreContext.close();
  }
});
