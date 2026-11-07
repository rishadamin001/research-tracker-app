import { expect, test } from '@playwright/test';
import { createProject, paperSchema } from '../../src/lib/model';

test('three starting intentions lead to a personalized saved beginner project', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Choose a starting point' }).getByRole('button')).toHaveCount(3);
  await page.getByRole('button', { name: /I’m new to research/ }).click();
  await expect(page.getByRole('list', { name: 'The research journey' })).toBeVisible();
  await page.getByLabel('Try your own research question').fill('How do commuter students choose study spaces?');
  await page.getByRole('button', { name: 'Start a project with this question' }).click();
  await page.getByLabel('Working title').fill('Commuter study spaces');
  await page.getByLabel('Broad discipline').selectOption('Social sciences & humanities');
  await page.getByLabel('What are you trying to understand?').fill('Understand student experiences');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByLabel('Research experience')).toHaveValue('Beginner');
  await expect(page.getByLabel('Research goal')).toHaveValue('Understand student experiences');
  await page.getByRole('button', { name: 'Back to roadmap' }).click();
  await expect(page.getByText('YOUR NEXT USEFUL STEP')).toBeVisible();
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

