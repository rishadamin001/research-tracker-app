import { expect, test } from '@playwright/test';

const later = {
  id: 'https://openalex.org/W123',
  display_name: 'Later study',
  publication_year: 2024,
  doi: null,
  referenced_works: ['https://openalex.org/W456', 'https://openalex.org/W789'],
};
const earlier = {
  id: 'https://openalex.org/W456',
  display_name: 'Earlier study',
  publication_year: 2020,
  doi: null,
  referenced_works: [],
};

test('saved OpenAlex references show directed connections after reload', async ({ page }) => {
  let requests = 0;
  await page.route('https://api.openalex.org/**', route => {
    requests++;
    return route.fulfill({ json: { results: [later, earlier] } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Citation project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.evaluate(() => { window.location.hash = 'discover'; });

  await page.getByRole('textbox', { name: 'Search literature' }).fill('housing research');
  await page.getByRole('button', { name: 'Search papers' }).click();
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Later study' }) })
    .getByRole('button', { name: 'Save paper' }).click();
  await page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Earlier study' }) })
    .getByRole('button', { name: 'Save paper' }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.getByRole('button', { name: 'Continue to next task' }).click();
  await expect(page).toHaveURL(/#screen$/);
  await page.reload();
  await page.getByRole('button', { name: 'Cards & matrix', exact: true }).click();

  await page.getByText('Citation connections', { exact: true }).click();
  const outgoing = page.getByRole('heading', { name: 'Saved papers cited by this source' }).locator('..');
  const incoming = page.getByRole('heading', { name: 'Saved papers that cite this source' }).locator('..');
  await expect(outgoing.getByRole('button', { name: 'Earlier study' })).toBeVisible();
  await expect(incoming.getByText('No matches in your saved library.')).toBeVisible();
  await outgoing.getByRole('button', { name: 'Earlier study' }).click();
  await expect(page.getByLabel('Focus source')).toHaveValue(earlier.id);
  await expect(incoming.getByRole('button', { name: 'Later study' })).toBeVisible();
  expect(requests).toBe(1);
});
