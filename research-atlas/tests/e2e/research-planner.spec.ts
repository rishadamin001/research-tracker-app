import { expect, test } from '@playwright/test';

test('project planner schedules, budgets and exports submission notes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Housing study plan');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('button', { name: 'Back to roadmap', exact: true }).click();
  await page.getByText('My plan — timeline, budget & submission', { exact: true }).click();

  await page.getByLabel('Submission deadline').fill('2027-03-01');
  await page.getByLabel('Check submission files and leave a buffer days before deadline').fill('1');
  await expect(page.getByText('Feb 28, 2027')).toBeVisible();
  await page.getByLabel('Check submission files and leave a buffer days before deadline').clear();

  await page.getByRole('button', { name: 'Budget', exact: true }).click();
  await page.getByLabel('Budget currency').selectOption('USD');
  await page.getByLabel('Reading and library access').fill('0');
  await page.getByLabel('Conference registration').fill('25.50');
  await expect(page.getByText('Estimated total for 2 of 6 entries')).toBeVisible();
  await expect(page.getByText(/USD\s+25\.50/)).toBeVisible();
  await page.getByLabel('Conference registration').clear();

  await page.getByRole('button', { name: 'Venue checks', exact: true }).click();
  await page.getByLabel('Target venue', { exact: true }).fill('Example methods conference');
  await page.getByLabel('The venue’s scope and article type fit the study.').check();
  await page.getByRole('button', { name: 'Submission pack', exact: true }).click();
  await page.getByLabel(/Cover letter to the editor/).fill('Dear editor, we measured housing costs.');
  const pack = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download pack' }).click();
  expect((await pack).suggestedFilename()).toBe('submission-pack.md');

  await page.getByRole('button', { name: 'Reviewer replies', exact: true }).click();
  await page.getByRole('button', { name: 'Add reviewer comment' }).click();
  await page.getByRole('textbox', { name: 'Reviewer comment', exact: true }).fill('Clarify the sampling frame.');
  await page.getByLabel('Reply or action taken').fill('Added eligibility and sampling details.');
  await page.getByLabel('Page, line or section').fill('Page 4, lines 38–42');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();

  await page.getByText('My plan — timeline, budget & submission', { exact: true }).click();
  await expect(page.getByLabel('Submission deadline')).toHaveValue('2027-03-01');
  await expect(page.getByLabel('Check submission files and leave a buffer days before deadline')).toHaveValue('');
  await page.getByRole('button', { name: 'Budget', exact: true }).click();
  await expect(page.getByLabel('Conference registration')).toHaveValue('');
  await page.getByRole('button', { name: 'Reviewer replies', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Reviewer comment', exact: true })).toHaveValue('Clarify the sampling frame.');
  await expect(page.getByLabel('Page, line or section')).toHaveValue('Page 4, lines 38–42');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
