import { expect, test } from '@playwright/test';

test('six destinations, project tabs, guided mode and returning home stay connected', async ({ page }) => {
  await page.goto('/');
  const openNavigation = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await openNavigation.isVisible()) await openNavigation.click();
  const navigation = page.getByRole('navigation', { name: 'Main navigation', exact: true });
  await expect(navigation.getByRole('button')).toHaveText(['Home','My Research','Discover','Library','Learn','Publish']);
  if (await page.getByRole('button', { name: 'Close navigation', exact: true }).isVisible()) await page.getByRole('button', { name: 'Close navigation', exact: true }).click();
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Student study spaces');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  const projectNav = page.getByRole('navigation', { name: 'Project workspace', exact: true });
  await expect(projectNav.getByRole('button')).toHaveText(['Overview','Question','Literature','Study','Evidence','Write','Publish']);
  await projectNav.getByRole('button', { name: 'Question', exact: true }).click();
  await page.getByRole('button', { name: 'Question wording', exact: true }).click();
  await page.getByLabel('Your research question').fill('How do commuter students choose study spaces?');
  await page.getByRole('button', { name: 'Save question revision', exact: true }).click();
  await page.getByRole('button', { name: 'Back to roadmap', exact: true }).click();
  if (await openNavigation.isVisible()) await openNavigation.click();
  await navigation.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your research today', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How do commuter students choose study spaces?', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your next action' })).toContainText('Find evidence');
  if (await openNavigation.isVisible()) await openNavigation.click();
  await navigation.getByRole('button', { name: 'My Research', exact: true }).click();
  await projectNav.getByRole('button', { name: 'Study', exact: true }).click();
  await expect(page.getByText('Learn and check this step', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Guidance mode', exact: true }).selectOption('expert');
  await expect(page.getByRole('navigation', { name: 'Study planning steps', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Analysis and reproducibility')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Guidance mode', exact: true })).toHaveValue('expert');
  await expect(projectNav.getByRole('button', { name: 'Study', exact: true })).toHaveAttribute('aria-current','page');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Discover exposes notebook and Publish groups conferences without a project', async ({ page }) => {
  await page.goto('/#paper-search');
  await page.getByRole('button', { name: 'Search history', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Search notebook', exact: true })).toBeVisible();
  await page.goto('/#publish-hub');
  await page.getByRole('button', { name: 'Conference finder', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Conference planner', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Venue finder', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start with a project', exact: true })).toBeVisible();
});
