import { expect, test } from '@playwright/test';
import { createProject, paperSchema } from '../../src/lib/model';

test('beginner explores actual records before explicitly creating an uncommitted project', async ({ page }) => {
  let queries = 0;
  await page.route('https://api.openalex.org/works?**', async route => {
    queries++;
    await route.fulfill({ json: { meta: { count: 1 }, results: [{ id: 'https://openalex.org/W123', display_name: 'Commuter study spaces', publication_year: 2024, doi: null, authorships: [], primary_location: null }] } });
  });
  await page.goto('/#primer');
  await page.getByLabel('Your interest', { exact: true }).fill('student housing');
  expect(queries).toBe(0);
  await page.getByRole('button', { name: 'Choose how to explore' }).click();
  await page.getByRole('button', { name: 'Show real papers' }).click();
  await expect(page.getByRole('heading', { name: 'Commuter study spaces' })).toBeVisible();
  await page.getByLabel('Keep for my project').check();
  await page.getByLabel('Working project title (optional)', { exact: true }).fill('Commuter project');
  await page.getByLabel('A question to explore (optional draft)', { exact: true }).fill('How do commuters choose spaces?');
  await page.getByRole('button', { name: 'Create project from this exploration' }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /^Frame your question/ }).click();
  await page.getByRole('button', { name: 'Question wording', exact: true }).click();
  await expect(page.getByLabel('Your research question')).toHaveValue('How do commuters choose spaces?');
  expect(queries).toBe(2);
});

test('duplicate merge is auditable and reversible in a project after reload', async ({ page }) => {
  const project = createProject('Duplicate review fixture');
  const source = { title: 'Student housing evidence review', authors: 'Test Author', year: 2024, doi: '10.1234/test', journal: 'Fixture Journal', url: 'https://example.org', oa: null, source: 'RIS import' };
  project.papers = [paperSchema.parse({ ...source, id: 'record-a', notes: 'First notes' }), paperSchema.parse({ ...source, id: 'record-b', notes: 'Second notes' })];
  await page.goto('/#projects');
  await page.getByLabel('Import backup', { exact: true }).setInputFiles({ name: 'fixture.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] })) });
  await page.getByRole('button', { name: 'Import as new copies' }).click();
  await page.getByRole('button', { name: 'Open roadmap', exact: true }).click();
  await page.getByRole('button', { name: /^Screen your references/ }).click();
  await page.getByText('Exact DOI: Student housing evidence review').click();
  await page.getByRole('button', { name: 'Merge into A' }).click();
  await expect(page.getByText('No unreviewed duplicate candidates')).toBeVisible();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByText('Duplicate review history (1)').click();
  await page.getByRole('button', { name: 'Undo review' }).click();
  await expect(page.getByText('Exact DOI: Student housing evidence review')).toBeVisible();
});

