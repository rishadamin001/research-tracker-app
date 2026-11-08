import { expect, test } from '@playwright/test';

test('data notes, source citations, and journal checks stay in the same project', async ({ page }) => {
  await page.route('https://api.openalex.org/**', route => {
    const isSearch = new URL(route.request().url()).searchParams.has('search');
    const openLocation = { landing_page_url: 'https://example.org/open-paper' };
    const work = isSearch ? {
      id: 'https://openalex.org/W42',
      display_name: 'Evidence in community libraries',
      publication_year: 2025,
      doi: 'https://doi.org/10.1234/test',
      authorships: [{ author: { display_name: 'Ada Example' } }],
      best_oa_location: openLocation,
    } : { open_access: { is_oa: true }, best_oa_location: openLocation };
    return route.fulfill({ json: { results: [work] } });
  });
  await page.route('https://api.crossref.org/**', route => route.fulfill({ json: { message: {
    title: ['Fixture article'],
    publisher: 'Fixture Publisher',
    ISSN: ['1234-5678'],
    'container-title': ['Fixture Journal'],
    DOI: '10.1234/test',
  } } }));

  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Community library study');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();

  await page.goto('/#data');
  await page.getByRole('button', { name: 'Add planning prompts' }).click();
  await expect(page.getByLabel('Data management plan', { exact: true })).toHaveValue(/Materials and provenance/);
  await page.getByLabel('Data management plan', { exact: true }).fill('Store the licensed corpus in an approved folder.');
  await page.getByLabel('Analysis record').fill('Coded five eligible public records.');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export data and analysis notes' }).click();
  expect((await download).suggestedFilename()).toBe('data-and-analysis.md');

  await page.goto('/#discover');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('community libraries');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  await page.getByRole('button', { name: 'Save paper', exact: true }).click();

  await page.goto('/#writing');
  await page.getByLabel('Section draft', { exact: true }).fill('Readership varied by location. ');
  await page.getByLabel('Section draft', { exact: true }).press('End');
  await page.getByLabel('Reference from this project').selectOption({ label: 'Evidence in community libraries (2025)' });
  await page.getByRole('button', { name: 'Insert citation' }).click();
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(/\[1\]/);
  await expect(page.locator('.writing-bibliography')).toBeVisible();
  await expect(page.locator('.writing-bibliography')).toContainText(/Ada Example \(2025\)/);

  await page.goto('/#publication');
  await page.getByLabel('New journal candidate').fill('Fixture Journal');
  await page.getByRole('button', { name: 'Add journal', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Fixture Journal' }).click();
  await page.getByLabel('Verification sources and notes').fill('Publisher policy checked today.');
  const feeCheck = page.getByLabel('Checked fees, currency, and any waiver policy');
  await feeCheck.check();
  await page.getByLabel('Article DOI').fill('10.1234/test');
  await page.getByRole('button', { name: 'Check DOI metadata' }).click();
  await expect(page.getByRole('heading', { name: 'Unknown / requires manual verification' })).toBeVisible();
  await page.getByRole('button', { name: 'Resolve open-access copy' }).click();
  await expect(page.getByRole('link', { name: 'Open legal OA copy', exact: true })).toHaveAttribute('href', 'https://example.org/open-paper');

  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();
  await page.locator('summary').filter({ hasText: 'Fixture Journal' }).click();
  await expect(page.getByLabel('Verification sources and notes')).toHaveValue('Publisher policy checked today.');
  await expect(feeCheck).toBeChecked();
  await page.goto('/#writing');
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(/Readership varied by location\. \[1\]/);
  await page.goto('/#data');
  await expect(page.getByLabel('Analysis record')).toHaveValue('Coded five eligible public records.');
});
