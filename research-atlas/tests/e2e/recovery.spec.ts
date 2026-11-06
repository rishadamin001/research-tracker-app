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
