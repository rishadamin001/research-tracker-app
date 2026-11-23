import { expect, test } from '@playwright/test';

test('a beginner chooses an example, revisits it, or skips directly to Discover', async ({ page }) => {
  await page.goto('/#primer');
  const interest = page.getByRole('textbox', { name: 'Your interest', exact: true });
  await page.getByRole('button', { name: 'Student housing', exact: true }).click();
  await expect(interest).toHaveValue('Student housing');
  await page.getByRole('button', { name: 'Choose how to explore' }).click();
  await expect(page.getByRole('heading', { name: 'How would you like to start?' })).toBeFocused();
  await page.getByRole('button', { name: 'Change interest' }).click();
  await expect(interest).toHaveValue('Student housing');
  await page.route('https://api.openalex.org/works?**', route => route.fulfill({ json: { meta: { count: 0 }, results: [] } }));
  await page.getByRole('button', { name: /Skip for now/ }).click();
  await expect(page).toHaveURL(/#paper-search\?topic=Student\+housing$/);
});

test('the optional workspace tour resumes, supports keyboard controls, and stays dismissed', async ({ page }) => {
  await page.goto('/#overview');
  const tour = page.getByRole('region', { name: 'Workspace tour' });
  await tour.getByRole('button', { name: 'Take the tour' }).press('Enter');
  await expect(tour.getByRole('heading', { name: 'Home dashboard' })).toBeFocused();
  await tour.getByRole('button', { name: 'Next stop' }).press('Enter');
  await expect(tour.getByRole('heading', { name: 'Create a project' })).toBeFocused();
  await tour.getByRole('button', { name: 'Continue later' }).click();
  await expect(tour.getByRole('button', { name: 'Resume tour' })).toBeFocused();
  await page.reload();
  await tour.getByRole('button', { name: 'Resume tour' }).click();
  await expect(tour.getByRole('heading', { name: 'Create a project' })).toBeVisible();
  await tour.getByRole('button', { name: 'Skip tour' }).press('Enter');
  await expect(tour).toHaveCount(0);
  await expect(page.getByRole('main')).toBeFocused();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(tour).toHaveCount(0);
  await page.goto('/#preferences');
  await tour.getByRole('button', { name: 'Take the tour' }).click();
  for (const title of ['Home dashboard', 'Create a project', 'Find papers', 'Save to Library', 'Screen a paper', 'Researcher’s Notebook', 'Evidence Desk', 'Writing Studio', 'Export and back up']) {
    await tour.getByRole('button', { name: title, exact: true }).press('Enter');
    await expect(tour.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await tour.getByRole('button', { name: 'Finish tour' }).click();
  await expect(tour.getByRole('button', { name: 'Replay tour' })).toBeFocused();
  await page.goto('/#overview');
  await expect(tour).toHaveCount(0);
});

test('focus workspace suppresses the Home tour while preferences still offers it', async ({ page }) => {
  await page.goto('/#overview');
  await expect(page.getByRole('region', { name: 'Workspace tour' })).toBeVisible();
  await page.getByLabel('Guidance mode').selectOption('expert');
  await expect(page.getByRole('region', { name: 'Workspace tour' })).toHaveCount(0);
  await page.goto('/#preferences');
  await expect(page.getByRole('button', { name: 'Take the tour' })).toBeVisible();
});

test('a learner sees the source example before interpreting it and can reveal a self-check', async ({ page }) => {
  await page.goto('/#guide');
  await page.getByRole('button', { name: 'Separate findings from interpretation' }).click();
  await expect(page.getByText(/A fictional abstract says 12 of 20/)).toBeVisible();
  const guidance = page.getByText(/A reader can locate the result/);
  await expect(guidance).toBeHidden();
  await page.getByText('Check your work', { exact: true }).press('Enter');
  await expect(guidance).toBeVisible();
});
