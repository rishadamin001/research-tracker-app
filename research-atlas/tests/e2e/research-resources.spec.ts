import { expect, test } from '@playwright/test';

test('the visual guide leads into upcoming conferences', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-06T06:00:00Z'));
  await page.goto('/#guide');
  await page.getByRole('button', { name: 'Read a paper', exact: true }).click();
  await page.getByRole('button', { name: 'Methods' }).click();
  await expect(page.getByRole('heading', { name: 'How did they do the work?' })).toBeVisible();
  await page.getByRole('button', { name: 'Check a conference', exact: true }).click();
  await page.getByLabel('I found the event on an official organizer or host website.').check();
  await expect(page.getByText('1 of 5 checks complete.')).toBeVisible();
  await page.getByRole('button', { name: 'Explore upcoming conferences' }).click();

  const event = page.getByRole('article').filter({ has: page.getByRole('heading', { name: /Climate and Disaster Risk Management/ }) });
  await expect(event).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Conference planner', exact: true })).toBeVisible();
});
