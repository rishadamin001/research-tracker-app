import { expect, test } from '@playwright/test';

test('search controls are available before searching and a saved result opens the correct source for screening', async ({ page, isMobile }) => {
  await page.route('https://api.openalex.org/works?**', route => route.fulfill({ json: {
    meta: { count: 2 },
    results: [1, 2].map(index => ({
      id: 'https://openalex.org/W' + index,
      display_name: 'Test paper ' + index,
      doi: null,
      publication_year: 2020 + index,
    })),
  } }));
  await page.route('https://api.crossref.org/works?**', route => route.fulfill({ status: 403 }));
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Test literature workflow');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#discover');
  const form = page.getByRole('search', { name: 'Search for research papers' });
  await expect(form.getByLabel('Search literature')).toBeInViewport();
  await expect(form.getByLabel('Search source')).toBeInViewport();
  await expect(form.getByLabel('Sort papers')).toBeInViewport();
  await form.getByLabel('Sort papers').selectOption('oldest');
  await form.getByLabel('Search literature').fill('test research');
  await form.getByRole('button', { name: 'Search papers' }).click();
  const cards = page.locator('article.paper');
  await expect(cards.locator('h3')).toHaveText(['Test paper 1', 'Test paper 2']);
  await cards.first().getByRole('button', { name: 'Save paper' }).click();
  await cards.last().getByRole('button', { name: 'Save paper' }).click();
  await form.getByLabel('Search source').selectOption('Crossref');
  await form.getByRole('button', { name: 'Search papers' }).click();
  await expect(page.getByRole('alert')).toContainText('Crossref');
  await expect(cards).toHaveCount(2);
  await cards.last().getByRole('button', { name: 'Screen saved paper' }).click();
  const selected = page.getByRole('region', { name: 'Selected source' });
  await expect(selected.getByRole('heading', { name: 'Test paper 2' })).toBeVisible();
  if (isMobile) {
    await page.getByRole('button', { name: 'Jump to selected source' }).click();
    await expect(selected.getByRole('heading', { name: 'Test paper 2', exact: true })).toBeFocused();
  }
  await page.getByRole('button', { name: 'Continue to screen this source' }).click();
  const actions = page.getByRole('group', { name: 'Quick screening decisions' });
  await expect(actions.getByRole('button', { name: 'Include', exact: true })).toBeDisabled();
  await page.getByLabel('Decision reason').fill('Test reason for selecting the second record.');
  await actions.getByRole('button', { name: 'Include', exact: true }).click();
  await expect(actions.getByRole('button', { name: 'Include', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/#library');
  await page.getByRole('article', { name: 'Library reference: Test paper 2' }).getByRole('button', { name: 'Open Test literature workflow' }).click();
  await expect(selected.getByRole('heading', { name: 'Test paper 2' })).toBeVisible();
});
