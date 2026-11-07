import { expect, test } from '@playwright/test';

const records = (start: number, length: number) => Array.from({ length }, (_, index) => ({ id: `https://openalex.org/W${start + index}`, display_name: `Housing study ${start + index}`, publication_year: 2025, doi: null, referenced_works: ['https://openalex.org/W999'] }));

test('load more, stop/resume, page errors, audit export and refresh preserve bounded search history', async ({ page }) => {
  const pages: number[] = [];
  let failPageTwo = true;
  let refresh = false;
  await page.route('https://api.openalex.org/works?**', route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 1);
    pages.push(number);
    if (number === 2 && failPageTwo) { failPageTwo = false; return route.fulfill({ status: 503, body: '' }); }
    return route.fulfill({ json: { meta: { count: 75 }, results: refresh ? records(101, 20) : records((number - 1) * 20 + 1, 20) } });
  });
  await page.goto('/#paper-search');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  const results = page.getByRole('region', { name: 'Search result controls' });
  await expect(results).toContainText('20 of 20 results shown');
  await page.getByRole('button', { name: 'Stop here', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load next page', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Resume page loading', exact: true }).click();
  await page.getByRole('button', { name: 'Load next page', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('503');
  await expect(results).toContainText('20 of 20 results shown');
  await page.getByRole('button', { name: 'Load next page', exact: true }).click();
  await expect(results).toContainText('40 of 40 results shown');
  await expect(results).toContainText('2 pages retrieved');
  await page.getByText('Search audit trail (1)', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export search JSON', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('search-history.json');
  refresh = true;
  await page.getByRole('button', { name: 'Refresh this search', exact: true }).click();
  await expect(results).toContainText('20 newly discovered records');
  expect(pages).toEqual([1, 2, 2, 1]);
  await page.reload();
  await expect(page.getByText('Search audit trail (2)', { exact: true })).toBeVisible();
});

test('related discovery sends only citation IDs and identifies suggestions', async ({ page }) => {
  const filters: string[] = [];
  await page.route('https://api.openalex.org/works?**', route => {
    const filter = new URL(route.request().url()).searchParams.get('filter');
    if (filter) filters.push(filter);
    return route.fulfill({ json: { results: filter ? records(901, 1) : records(1, 1) } });
  });
  await page.goto('/#paper-search');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  await page.getByText('Explore related papers', { exact: true }).click();
  await page.getByRole('button', { name: 'Find citing papers', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Housing study 901', exact: true })).toBeVisible();
  await expect(page.getByText(/Results are discovery suggestions/)).toBeVisible();
  expect(filters).toEqual(['cites:W1']);
});
