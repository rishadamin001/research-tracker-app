import { expect, test } from '@playwright/test';

test('the visual guide leads into upcoming conferences', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-06T06:00:00Z'));
  await page.goto('/#guide');
  await page.getByRole('button', { name: 'Research basics', exact: true }).click();
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

test('the beginner planner connects research steps, data choices, and tools', async ({ page }) => {
  await page.goto('/#guide');
  await expect(page.getByRole('heading', { name: 'Research planner', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Your research journey', exact: true }).click();
  await page.getByRole('button', { name: /Respond to review/ }).click();
  await expect(page.getByText(/A revised manuscript and a point-by-point response/)).toBeVisible();

  await page.getByRole('button', { name: 'Data, surveys & analysis', exact: true }).click();
  const qualitative = page.getByRole('button', { name: /Qualitative/ });
  await qualitative.click();
  await expect(qualitative).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByText('Qualitative example', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Pilot the questions/ }).click();
  await expect(page.getByText(/A revised instrument and a record of pilot changes/)).toBeVisible();

  await page.getByRole('button', { name: 'Toolkit', exact: true }).click();
  await page.getByRole('button', { name: 'Cite and write', exact: true }).click();
  const zotero = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Zotero', exact: true }) });
  await expect(zotero.getByRole('link', { name: 'Open Zotero' })).toHaveAttribute('href', /zotero\.org/);
  await expect.poll(() => zotero.locator('img').evaluate(image => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Semantic Scholar', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
