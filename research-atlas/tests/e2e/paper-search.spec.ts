import { expect, test } from '@playwright/test';

test('standalone paper search distinguishes price types and sorts by full date', async ({ page }) => {
  const journal = { display_name: 'Journal of Environmental Psychology', type: 'journal', issn_l: '0272-4944', host_organization_name: 'Elsevier BV' };
  await page.route('https://api.openalex.org/works?**', route => route.fulfill({ json: { meta: { count: 180 }, results: [
    { id: 'https://openalex.org/W1', display_name: 'Recent closed paper', doi: null, publication_year: 2025,
      publication_date: '2025-09-18', cited_by_count: 2, primary_location: { source: journal },
      apc_list: { value: 1200, currency: 'USD', value_usd: 1200 } },
    { id: 'https://openalex.org/W2', display_name: 'Older open paper', doi: null, publication_year: 2025,
      publication_date: '2025-01-10', cited_by_count: 5, primary_location: { source: journal },
      best_oa_location: { landing_page_url: 'https://example.com/open' },
      apc_list: { value: 400, currency: 'GBP', value_usd: 520 } },
    { id: 'https://openalex.org/W3', display_name: 'Undated paper', doi: null, publication_year: null, cited_by_count: 0 },
  ] } }));

  await page.goto('/#paper-search');
  await expect(page.getByRole('heading', { name: 'Paper search', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers' }).click();

  const older = page.locator('article.paper').filter({ has: page.getByRole('heading', { name: 'Older open paper' }) });
  const recent = page.locator('article.paper').filter({ has: page.getByRole('heading', { name: 'Recent closed paper' }) });
  const titles = page.locator('article.paper h3');
  const sort = page.getByLabel('Sort papers');
  await expect(sort).toHaveValue('quartile');
  await expect(older.getByText('POSI Q1 · 2026', { exact: true })).toBeVisible();
  await expect(older.locator('.publication-mark img')).toHaveAttribute('src', /elsevier\.svg$/);
  await expect(older.getByText('Free open copy', { exact: true })).toBeVisible();
  await expect(older.getByText(/GBP\s+400/)).toBeVisible();
  await expect(recent.getByText('Price unavailable', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open My projects to save papers' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save paper', exact: true })).toHaveCount(0);
  const searchDetails = page.getByRole('region', { name: 'Search result controls' });
  await searchDetails.getByText('Search details', { exact: true }).click();
  await expect(searchDetails.getByText('Executed query student housing', { exact: true })).toBeVisible();
  await expect(searchDetails.getByText(/3 records returned/)).toBeVisible();
  await expect(searchDetails.getByText(/180 matches reported by the provider/)).toBeVisible();

  await sort.selectOption('newest');
  await expect(titles).toHaveText(['Recent closed paper', 'Older open paper', 'Undated paper']);
  await sort.selectOption('oldest');
  await expect(titles).toHaveText(['Older open paper', 'Recent closed paper', 'Undated paper']);
  await sort.selectOption('readingCost');
  await expect(titles.first()).toHaveText('Older open paper');
  await sort.selectOption('journalFeeHigh');
  await expect(titles).toHaveText(['Recent closed paper', 'Older open paper', 'Undated paper']);
  await sort.selectOption('journalFee');
  await expect(titles).toHaveText(['Older open paper', 'Recent closed paper', 'Undated paper']);
});
