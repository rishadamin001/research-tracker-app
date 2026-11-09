import { expect, test } from '@playwright/test';

test('journal matching sends only the reviewed query and retains article-backed shortlist evidence', async ({ page }) => {
  const requests: URL[] = [];
  await page.route('https://api.openalex.org/works?**', route => {
    requests.push(new URL(route.request().url()));
    return route.fulfill({ json: { meta: { count: 1 }, results: [{ id: 'https://openalex.org/W123', display_name: 'Related housing research', publication_year: 2025, doi: 'https://doi.org/10.1234/housing', authorships: [], primary_location: { source: { display_name: 'Example Journal', type: 'journal', issn_l: '0028-0836', host_organization_name: 'Example Publisher' } } }] } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Journal fit project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#publish-hub');
  await page.getByLabel('Manuscript title', { exact: true }).fill('Housing research');
  await page.getByLabel('Draft abstract (optional)', { exact: true }).fill('Private abstract wording never transmitted');
  await page.getByLabel('Keywords (optional)', { exact: true }).fill('student housing');
  await page.getByRole('button', { name: 'Prepare search query', exact: true }).click();
  expect(requests).toHaveLength(0);
  await page.getByRole('button', { name: 'Find candidate journals', exact: true }).click();
  await expect(page.getByText('Example Journal', { exact: true })).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0].searchParams.get('search')).toBe('student housing');
  expect(requests[0].href).not.toContain('Private');
  await page.getByText('Inspect supporting articles', { exact: true }).click();
  await expect(page.getByRole('link', { name: /Related housing research/ })).toBeVisible();
  await page.getByRole('button', { name: 'Save to journal shortlist', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();
  await expect(page.getByLabel('Draft abstract (optional)', { exact: true })).toHaveValue('Private abstract wording never transmitted');
  await page.getByRole('button', { name: 'Venue finder', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Example Journal' }).click();
  await page.getByText('Why this journal was suggested', { exact: true }).click();
  await expect(page.getByRole('link', { name: /Related housing research/ })).toBeVisible();
  await expect(page.getByLabel('Fees and waivers', { exact: true })).toHaveValue(/Fee unknown/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
