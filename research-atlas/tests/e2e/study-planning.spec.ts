import { expect, test } from '@playwright/test';

test('design routing can abstain, gives conditional drafts, and exports a persistent structured DMP', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Public records study');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByLabel('Guidance mode', { exact: true }).selectOption('expert');
  await page.goto('/#methods');
  await expect(page.getByRole('heading', { name: 'More information is needed' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use as a draft starting point' })).toHaveCount(0);
  await page.getByText('Work through the design questions', { exact: true }).click();
  await page.getByLabel('Knowledge goal').selectOption('describe');
  await page.getByLabel('Unit of analysis').fill('District-level public library records');
  await page.getByLabel('Evidence access').selectOption('existing');
  await page.getByLabel('Measurement or interpretation').selectOption('numbers');
  await page.getByLabel('Do you intend to claim cause and effect?').selectOption('no');
  await page.getByLabel('Can you assign an intervention or controlled comparison?').selectOption('not-applicable');
  await page.getByLabel('Ethics and access assessment').selectOption('consultation');
  await page.getByLabel('Time and resource limits').fill('Eight weeks, licensed public data, and methods consultation.');
  await expect(page.getByRole('heading', { name: 'Possible approaches to review' })).toBeVisible();
  await expect(page.getByText(/Ethics or access consultation remains unresolved/)).toBeVisible();
  await page.getByRole('button', { name: 'Use as a draft starting point' }).click();
  await expect(page.getByLabel('Chosen design and justification')).toHaveValue(/Conditions to resolve/);
  await page.goto('/#data');
  await page.getByLabel('Data or evidence types').fill('Public aggregate records');
  await page.getByLabel('Backup and recovery').fill('Weekly backup and restoration check');
  await page.getByRole('textbox', { name: 'Data management plan', exact: true }).fill('Earlier freeform plan retained.');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();
  await expect(page.getByLabel('Backup and recovery')).toHaveValue('Weekly backup and restoration check');
  await expect(page.getByRole('textbox', { name: 'Data management plan', exact: true })).toHaveValue('Earlier freeform plan retained.');
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data management plan', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('data-management-plan.md');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

