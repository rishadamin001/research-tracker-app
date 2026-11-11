import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('a failed browser write leaves a downloadable recovery copy', async ({ page }) => {
  await page.addInitScript(() => {
    IDBObjectStore.prototype.put = () => { throw new DOMException('Test quota failure', 'QuotaExceededError'); };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Recoverable project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('alert').getByText('Changes are still available in this tab.', { exact: false })).toBeVisible();
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery backup' }).click();
  const file = await (await saved).path();
  expect(JSON.parse(await readFile(file!, 'utf8')).projects[0].title).toBe('Recoverable project');
});

test('a failed draft save is reported and its backup preserves the draft and committed wording', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Question recovery fixture');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#question');
  await page.getByRole('button', { name: 'Question wording', exact: true }).click();
  const question = page.getByLabel('Your research question', { exact: true });
  await question.fill('How do students use campus study space?');
  await page.getByRole('button', { name: 'Save question revision', exact: true }).click();
  await expect(page.getByText('Question v1', { exact: true })).toBeVisible();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = () => { throw new DOMException('Test quota failure', 'QuotaExceededError'); };
  });
  await question.fill('What limits access to campus study space?');
  await expect(page.getByText('Could not save. Download a backup.', { exact: true })).toBeAttached();
  await expect(page.getByText('Uncommitted question draft saved locally.', { exact: true })).toHaveCount(0);
  const saved = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download recovery backup' }).click();
  const { projects } = JSON.parse(await readFile((await (await saved).path())!, 'utf8'));
  expect(projects[0]).toMatchObject({
    question: 'How do students use campus study space?',
    questionDraft: 'What limits access to campus study space?',
    questionVersions: [{ version: 1 }],
  });
});
