import { expect, test } from '@playwright/test';

test('discipline topics immediately search and reuse the active project', async ({ page }) => {
  const searches: string[] = [];
  await page.route('https://api.openalex.org/works?**', async route => {
    const query = new URL(route.request().url()).searchParams.get('search') ?? '';
    searches.push(query);
    await route.fulfill({ json: { results: [{
      id: 'https://openalex.org/W42',
      display_name: `Papers on ${query}`,
      publication_year: 2024,
      doi: null,
      cited_by_count: 3,
      primary_location: { source: { display_name: 'Test Journal' } },
    }] } });
  });

  await page.goto('/#explore');
  await page.getByRole('button', { name: 'Machine learning', exact: true }).click();
  await expect(page).toHaveURL(/#discover\?topic=Machine\+learning$/);
  await expect(page.getByRole('textbox', { name: 'Search literature' })).toHaveValue('Machine learning');
  await expect(page.getByRole('heading', { name: 'Papers on Machine learning' })).toBeVisible();
  await expect(page.getByText('Created a local project for Machine learning', { exact: false })).toBeVisible();

  await page.goBack();
  await page.getByRole('button', { name: 'Health & pharmacy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Papers on Health & pharmacy' })).toBeVisible();
  await expect(page.locator('.page-heading .eyebrow')).toContainText('Machine learning literature');
  expect(searches).toEqual(['Machine learning', 'Health & pharmacy']);
});
