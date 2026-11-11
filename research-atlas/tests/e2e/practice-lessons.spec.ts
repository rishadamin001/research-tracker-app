import { expect, test } from '@playwright/test';

test('a beginner can retry a practice question, revisit a saved explanation, and apply a lesson', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-10T09:00:00Z'));
  await page.goto('/#guide');
  const lessons = page.getByRole('list', { name: 'Practice lessons' });
  await expect(lessons.getByRole('button')).toHaveCount(6);
  await page.getByText('See a worked example', { exact: true }).press('Enter');
  await expect(page.getByText(/Interviews can describe reported barriers/)).toBeVisible();

  const broad = page.getByRole('radio', { name: 'How can we fix education?' });
  await broad.press('Space');
  await page.getByRole('button', { name: 'Check answer', exact: true }).press('Enter');
  await expect(page.getByText(/This asks for a solution across all of education/)).toBeVisible();

  const bounded = page.getByRole('radio', { name: /What keeps first-year students/ });
  await bounded.press('Space');
  await page.getByRole('button', { name: 'Check answer', exact: true }).press('Enter');
  await expect(page.getByText(/This identifies a group, setting, and experience/)).toBeVisible();
  await page.getByRole('textbox', { name: 'Your explanation (optional)', exact: true }).fill('I could interview library users on my campus.');

  await page.clock.setFixedTime(new Date('2026-11-13T09:00:00Z'));
  await page.reload();
  await expect(lessons.getByRole('button', { name: /Frame a research question.*Ready to revisit/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('textbox', { name: 'Your explanation (optional)', exact: true })).toHaveValue('I could interview library users on my campus.');
  await expect(bounded).not.toBeChecked();
  await expect(page.getByText(/This identifies a group, setting, and experience/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await lessons.getByRole('button', { name: 'Search the literature' }).press('Enter');
  await page.getByRole('button', { name: 'Run a paper search', exact: true }).press('Enter');
  await expect(page).toHaveURL(/#paper-search$/);
  await expect(page.getByRole('heading', { name: 'Paper search', exact: true })).toBeVisible();
});
