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

test('each lesson offers a second discipline and a direct project practice with a self-check', async ({ page }) => {
  await page.goto('/#guide');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Research practice fixture');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('list', { name: 'Practice lessons' })).toBeVisible();

  const lessons = [
    ['Frame a research question', 'Environmental science', 'Open my working question', 'question'],
    ['Search the literature', 'Computing', 'Run a paper search', 'paper-search'],
    ['Evaluate a source', 'Public health', 'Open screening criteria', 'screen'],
    ['Separate findings from interpretation', 'History', 'Record a located finding', 'extract'],
    ['Choose feasible methods', 'Engineering', 'Draft my methods plan', 'methods'],
    ['Write with evidence', 'Ecology', 'Open Writing Studio', 'writing'],
  ];
  for (const [title, discipline, label, target] of lessons) {
    if (!page.url().endsWith('#guide')) await page.goto('/#guide');
    await page.getByRole('list', { name: 'Practice lessons' }).getByRole('button', { name: title, exact: true }).click();
    const exercise = page.getByRole('article', { name: title, exact: true });
    await exercise.getByText('See a worked example', { exact: true }).click();
    await expect(exercise.getByRole('heading', { name: discipline, exact: true })).toBeVisible();
    const application = exercise.getByRole('region', { name: 'Practice in your project', exact: true });
    await expect(application.getByText('Check your work', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await application.getByRole('button', { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${target}$`));
    if (target === 'paper-search') {
      await expect(page.getByRole('heading', { name: 'Paper search', exact: true })).toBeVisible();
    } else {
      await expect(page.getByRole('navigation', { name: 'Project workspace', exact: true })).toBeVisible();
    }
  }
});
