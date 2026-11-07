import { test, expect, type Page } from '@playwright/test';

async function start(page: Page, title = 'Dhaka digital inclusion') {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill(title);
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
}

async function openStage(page: Page, title: string) {
  await page.getByRole('button', { name: 'Back to roadmap' }).click();
  await page.getByRole('button', { name: new RegExp(`^${title}`) }).click();
}

test('beginner onboarding, research plan, backup and restore', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: /new to research/i }).click();
  await page.getByLabel('Try your own research question').fill('How do small retailers describe barriers to digital adoption?');
  await page.getByRole('button', { name: 'Start a project with this question' }).click();
  await page.getByLabel('Working title').fill('Dhaka digital inclusion');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByLabel('Research experience').selectOption('Beginner');
  await page.getByLabel('Research goal').selectOption('Course project');
  await page.getByRole('button', { name: 'Explore topics', exact: true }).click();
  await page.getByLabel('Working topic').fill('Digital adoption in small businesses');
  await page.getByLabel('Why is this topic feasible?').fill('Local retailers can be contacted within the study period.');
  await page.getByRole('button', { name: 'Draft your question' }).click();
  await expect(page.getByLabel('Your research question')).toHaveValue(/small retailers/);
  await page.getByLabel('Research objectives').fill('Identify common barriers reported by owners.');
  await openStage(page, 'Plan methods and ethics');
  await page.getByText('Work through the design questions', { exact: true }).click();
  await page.getByLabel('Knowledge goal').selectOption('understand');
  await page.getByLabel('Unit of analysis').fill('Small retailers in Dhaka');
  await page.getByLabel('Evidence access').selectOption('new');
  await page.getByLabel('Measurement or interpretation').selectOption('text');
  await page.getByLabel('Do you intend to claim cause and effect?').selectOption('no');
  await page.getByLabel('Can you assign an intervention or controlled comparison?').selectOption('not-applicable');
  await page.getByLabel('Ethics and access assessment').selectOption('consultation');
  await page.getByLabel('Time and resource limits').fill('A course project with supervisor review before recruitment.');
  await page.getByRole('button', { name: 'Use as a draft starting point' }).click();
  await page.getByLabel('Ethics, consent').fill('Seek institutional review before recruiting participants.');
  await page.getByLabel('Analysis and reproducibility').fill('Document sampling and reflexive analysis.');
  const protocol = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export protocol' }).click();
  expect((await protocol).suggestedFilename()).toBe('research-protocol.md');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();
  await openStage(page, 'Frame your question');
  await expect(page.getByLabel('Your research question')).toHaveValue(/small retailers/);
  await page.getByRole('button', { name: 'Back to roadmap' }).click();
  await page.getByRole('button', { name: 'Export project' }).click();
  const backup = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  await page.locator('input[type=file]').setInputFiles((await (await backup).path())!);
  await expect(page.getByText('Import preview: 1 projects')).toBeVisible();
  await page.getByRole('button', { name: 'Import as new copies' }).click();
  await expect(page.getByRole('heading', { name: 'Dhaka digital inclusion (imported)', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('saved evidence flows into screening and extraction and survives a revised question', async ({ page }) => {
  await page.route('https://api.openalex.org/**', route => route.fulfill({ json: { results: [{ id: 'https://openalex.org/W123', display_name: 'Digital inclusion in Bangladesh', publication_year: 2024, doi: 'https://doi.org/10.1234/test', authorships: [{ author: { display_name: 'Test Author' } }], primary_location: { source: { display_name: 'Fixture Journal' } }, best_oa_location: { landing_page_url: 'https://example.org/paper' } }] } }));
  await start(page);
  await openStage(page, 'Frame your question');
  await page.getByLabel('Your research question').fill('How do small businesses use digital payments?');
  await page.getByRole('button', { name: 'Find supporting evidence' }).click();
  await page.getByRole('textbox', { name: 'Search literature' }).fill('digital inclusion Bangladesh');
  await page.getByRole('button', { name: 'Search papers' }).click();
  await page.getByRole('button', { name: 'Save paper', exact: true }).click();
  await page.getByRole('button', { name: 'Continue to next task' }).click();
  await page.locator('summary').filter({ hasText: 'Digital inclusion in Bangladesh' }).click();
  await page.getByLabel('Decision reason').fill('Studies the defined setting and population.');
  await page.getByLabel('Screening decision').selectOption('include');
  await page.getByRole('button', { name: 'Continue to next task' }).click();
  await page.getByText('Edit notes for Digital inclusion in Bangladesh').click();
  await page.getByLabel('Extracted finding').fill('The study reported different levels of adoption.');
  await page.getByLabel('Evidence level and page').fill('Full text, page 8.');
  await openStage(page, 'Frame your question');
  await page.getByLabel('Your research question').fill('How do retailers in Dhaka adopt digital payments?');
  await openStage(page, 'Synthesize evidence');
  await expect(page.getByText('Your question changed.', { exact: false })).toBeVisible();
  await expect(page.getByRole('cell', { name: 'The study reported different levels of adoption.' })).toBeVisible();
  await page.getByRole('button', { name: 'Mark reviewed' }).click();
  await expect(page.getByText('Your question changed.', { exact: false })).toHaveCount(0);
  await openStage(page, 'Discover literature');
  await page.unroute('https://api.openalex.org/**');
  await page.route('https://api.openalex.org/**', route => route.fulfill({ status: 429, body: 'quota' }));
  await page.getByRole('textbox', { name: 'Search literature' }).fill('climate health');
  await page.getByRole('button', { name: 'Search papers' }).click();
  await expect(page.getByRole('alert')).toContainText('free research service is at its limit');
  await expect(page.getByRole('link', { name: /crossref/i })).toBeVisible();
});

test('invalid backup leaves saved projects intact', async ({ page }) => {
  await start(page);
  const menu = page.getByRole('button', { name: 'Open navigation', exact: true });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole('button', { name: 'My projects', exact: true }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"schemaVersion":99}') });
  await expect(page.getByRole('status').filter({ hasText: 'not a valid Research Atlas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dhaka digital inclusion', exact: true })).toBeVisible();
});
