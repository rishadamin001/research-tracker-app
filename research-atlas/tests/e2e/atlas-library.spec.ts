import { expect, test } from '@playwright/test';
import { createProject, paperSchema } from '../../src/lib/model';
import { linkWritingEvidence } from '../../src/lib/writing-studio';

test('an empty Library offers paper search and resumes reference import after project creation', async ({ page }) => {
  await page.goto('/#paper-search');
  await page.getByRole('button', { name: 'Search history', exact: true }).click();
  await page.goto('/#library');
  const start = page.getByRole('region', { name: 'Your Library starts with a source' });
  await start.getByRole('link', { name: 'Find papers', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Search literature' })).toBeVisible();
  await page.goto('/#library');

  const create = start.getByRole('button', { name: 'Create project', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Start a research project' });
  await create.click();
  await expect(dialog.getByLabel('Working title')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(create).toBeFocused();

  await start.getByRole('button', { name: 'Import references', exact: true }).click();
  await dialog.getByLabel('Working title').fill('Housing sources');
  await dialog.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page).toHaveURL(/#library$/);
  const exchange = page.getByRole('region', { name: 'Reference exchange' });
  const file = exchange.getByLabel('RIS or BibTeX file');
  await expect(exchange.getByRole('heading', { name: 'Import references into Housing sources' })).toBeVisible();
  await expect(file).toBeFocused();
  await expect(page.getByRole('button', { name: 'Import reference file', exact: true })).toHaveCount(0);
  await file.setInputFiles({ name: 'housing.ris', mimeType: 'text/plain', buffer: Buffer.from('TY  - JOUR\nTI  - Housing library fixture\nDO  - 10.1234/library-fixture\nER  -\n') });
  await exchange.getByRole('button', { name: 'Add references to project' }).click();
  await expect(exchange.getByText('1 reference added to Housing sources.')).toBeVisible();
  await expect(page.getByRole('article', { name: 'Library reference: Housing library fixture' })).toBeVisible();
  await expect(start).toHaveCount(0);
  await expect(exchange.getByRole('button', { name: 'Import reference file', exact: true })).toBeVisible();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();
  await expect(page.getByRole('article', { name: 'Library reference: Housing library fixture' })).toBeVisible();
});

test('an empty Library opens and closes reference import in the active project', async ({ page }) => {
  await page.goto('/#library');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Start a research project' });
  await dialog.getByLabel('Working title').fill('Existing project');
  await dialog.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#library');
  const openImport = page.getByRole('button', { name: 'Import references', exact: true });
  await expect(openImport).toHaveAttribute('aria-expanded', 'false');
  await openImport.click();
  await expect(openImport).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Import references into Existing project' })).toBeVisible();
  await expect(page.getByLabel('RIS or BibTeX file')).toBeFocused();
  await openImport.click();
  await expect(openImport).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByLabel('RIS or BibTeX file')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('Library links a source across projects without copying project judgments and keeps organization after reload', async ({ page }) => {
  const a = createProject('Housing thesis'), b = createProject('Course project');
  a.papers = [paperSchema.parse({ id: 'https://openalex.org/W123', doi: '10.1234/housing', title: 'Urban housing evidence', authors: 'Test Author', year: 2024, journal: 'Fixture journal', publisher: 'Elsevier', venueType: 'journal', source: 'OpenAlex', url: 'https://example.org', oa: null, notes: 'Origin-only interpretation', decision: 'include', reason: 'Origin selection rule', journalQuartile: { quartile: 'Q1', source: 'POSI', year: 2026, category: 'Fixture category', url: 'https://example.org/rank' }, citedByCount: 17 })];
  await page.goto('/#projects');
  await page.getByLabel('Import backup', { exact: true }).setInputFiles({ name: 'library.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [a, b] })) });
  await page.getByRole('button', { name: 'Import as new copies' }).click();
  await page.getByText('Saved on this device', { exact: true }).waitFor({ state: 'attached' });
  await page.goto('/#library');
  await expect(page.getByRole('heading', { name: 'Atlas Library', exact: true })).toBeVisible();
  const record = page.getByRole('article', { name: 'Library reference: Urban housing evidence' });
  await expect(record.getByText('POSI Q1 · 2026', { exact: true })).toBeVisible();
  await expect(record.getByText('17', { exact: true })).toBeVisible();
  await record.getByText('Organize this reference', { exact: true }).click();
  await record.getByLabel('Link reference to project').selectOption({ label: 'Course project (imported)' });
  await record.getByRole('button', { name: 'Link reference', exact: true }).click();
  await expect(record.getByText('2 projects', { exact: true })).toBeVisible();
  await expect(record.getByText(/Course project \(imported\): unreviewed/)).toBeVisible();
  await record.getByLabel('Reading status').selectOption('read');
  await record.getByLabel('Tags, separated by commas').fill('housing, methods');
  await record.getByRole('button', { name: 'Save tags' }).click();
  await page.getByText('Saved on this device', { exact: true }).waitFor({ state: 'attached' });
  await page.reload();
  await page.getByLabel('Search your Library').fill('methods');
  await page.getByLabel('Filter by reading status').selectOption('read');
  await expect(page.getByRole('heading', { name: 'Urban housing evidence', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('a Library metadata correction reaches the existing Writing Studio citation', async ({ page }) => {
  const project = createProject('Corrections fixture');
  const paper = paperSchema.parse({ id: 'housing-reference', title: 'Deposited housing title', authors: 'Original name', year: 2024,
    doi: '10.1234/housing-correction', journal: 'Fixture Journal', source: 'RIS', url: 'https://example.org/housing', oa: null });
  project.papers = [paper];
  Object.assign(project, linkWritingEvidence(project, 'results', paper.id, undefined).patch);
  await page.goto('/#projects');
  await page.getByLabel('Import backup', { exact: true }).setInputFiles({ name: 'correction-fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] })) });
  await page.getByRole('button', { name: 'Import as new copies', exact: true }).click();
  await page.goto('/#library');
  const record = page.getByRole('article', { name: 'Library reference: Deposited housing title', exact: true });
  await record.getByText('Edit reference details', { exact: true }).click();
  await record.getByRole('button', { name: 'Edit in Corrections fixture (imported)', exact: true }).click();
  const editor = record.getByRole('form', { name: 'Edit reference in Corrections fixture (imported)', exact: true });
  await expect(editor.getByRole('textbox', { name: 'Reference title', exact: true })).toBeFocused();
  await editor.getByLabel('Reference title', { exact: true }).fill('Corrected housing title');
  await editor.getByLabel('Authors, one name per line', { exact: true }).fill('Ada Corrected\nBruno Test');
  await editor.getByRole('button', { name: 'Save reference details', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Corrected housing title', exact: true })).toBeVisible();
  await page.getByText('Saved on this device', { exact: true }).waitFor({ state: 'attached' });
  await page.goto('/#writing');
  await expect(page.getByRole('heading', { name: 'Writing Studio', exact: true })).toBeVisible();
  await expect(page.locator('.writing-bibliography')).toContainText('Ada Corrected, Bruno Test (2024). Corrected housing title');
  await expect(page.getByRole('button', { name: 'Refresh reference [1] metadata', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.writing-bibliography')).toContainText('Corrected housing title');
});
