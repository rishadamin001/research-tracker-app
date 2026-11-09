import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

test('screening keeps dated reasons and linked evidence survives reload', async ({ page }, testInfo) => {
  test.setTimeout(90000);
  await page.route('https://api.openalex.org/works?**', route => route.fulfill({ json: { results: [{
    id: 'https://openalex.org/W987', display_name: 'Housing interviews', publication_year: 2025,
    doi: 'https://doi.org/10.1234/housing', authorships: [], primary_location: null, best_oa_location: null,
  }] } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Commuter housing study');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#question');
  await page.getByRole('button', { name: 'Question wording', exact: true }).click();
  await page.getByLabel('Your research question', { exact: true }).fill('How do commuters experience housing?');
  await page.getByRole('button', { name: 'Save question revision', exact: true }).click();
  await page.goto('/#discover');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers' }).click();
  await page.getByRole('button', { name: 'Save paper', exact: true }).click();

  await page.goto('/#screen');
  await page.getByRole('button', { name: 'Cards & matrix', exact: true }).click();
  await page.getByText('Screening criteria (0)', { exact: true }).click();
  await page.getByLabel('Criterion rule').fill('Studies university commuters');
  await page.getByRole('button', { name: 'Add criterion' }).click();
  await page.locator('summary').filter({ hasText: 'Housing interviews' }).click();
  await page.getByLabel('Screening criterion').selectOption({ label: 'Include · Studies university commuters' });
  await page.getByLabel('Decision reason').fill('The abstract leaves the population unclear.');
  await page.getByLabel('Screening decision').selectOption('maybe');
  await page.getByLabel('Screening stage').selectOption('full_text');
  await page.getByLabel('Reviewer name or initials').fill('RA');
  await page.getByLabel('Decision reason').fill('Table 2 identifies university commuters.');
  await page.getByLabel('Screening decision').selectOption('include');
  await page.getByText('Decision history (2)', { exact: true }).click();
  await expect(page.getByText('The abstract leaves the population unclear.', { exact: true })).toBeVisible();
  await expect(page.getByText(/Full text · RA/)).toBeVisible();
  await page.getByRole('button', { name: 'Retire rule' }).click();
  await expect(page.getByText('Criterion · Include · Studies university commuters')).toHaveCount(2);
  await page.getByLabel('Decision reason').fill('Draft note for a later review.');

  await page.goto('/#extract');
  await page.getByText('Edit notes for Housing interviews', { exact: true }).click();
  await page.getByRole('button', { name: 'Add evidence claim' }).click();
  await page.getByLabel('Evidence claim', { exact: true }).fill('The sample included university commuters.');
  await page.getByLabel('Evidence source level').selectOption('full_text');
  await page.getByLabel('Source locator').fill('Table 2, page 8');
  await page.getByRole('button', { name: 'Save evidence claim' }).click();
  await page.getByRole('button', { name: 'Mark claim reviewed' }).click();
  await page.getByLabel('Role in the candidate gap').selectOption('challenges');
  await page.getByLabel('What has not been searched?').fill('Conference proceedings remain to be checked.');
  await expect(page.getByText('Housing interviews · Full text · Table 2, page 8', { exact: true })).toBeVisible();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence claims' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toBe('evidence-ledger.csv');
  expect(await readFile((await download.path())!, 'utf8')).toContain('Challenges the candidate gap');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();
  await expect(page.getByLabel('What has not been searched?')).toHaveValue('Conference proceedings remain to be checked.');
  await expect(page.getByText('Housing interviews · Full text · Table 2, page 8', { exact: true })).toBeVisible();

  await page.goto('/#screen');
  await page.getByRole('button', { name: 'Cards & matrix', exact: true }).click();
  await page.locator('summary').filter({ hasText: 'Housing interviews' }).click();
  await expect(page.getByLabel('Decision reason')).toHaveValue('Draft note for a later review.');
  await page.getByText('Decision history (2)', { exact: true }).click();
  await expect(page.getByText('Table 2 identifies university commuters.', { exact: true })).toBeVisible();
  await page.goto('/#writing');
  await page.getByLabel('Reference from this project').selectOption('https://openalex.org/W987');
  const claims = page.getByLabel('Evidence from this source');
  const claimValue = await claims.locator('option').last().getAttribute('value');
  await claims.selectOption(claimValue!);
  await page.getByRole('button', { name: 'Insert located evidence', exact: true }).click();
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(/university commuters.*\[1\].*Table 2, page 8/);
  const docxPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export DOCX draft', exact: true }).click();
  await (await docxPending).saveAs(testInfo.outputPath('full-journey-manuscript.docx'));
  await page.goto('/#projects');
  const backupPending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup', exact: true }).click();
  const backup = await backupPending;
  const raw = await readFile((await backup.path())!);
  const saved = JSON.parse(raw.toString()).projects[0];
  expect(saved.question).toBe('How do commuters experience housing?');
  expect(saved.papers[0].screeningEvents).toHaveLength(2);
  expect(saved.papers[0].evidenceClaims[0].locator).toBe('Table 2, page 8');
  expect(saved.searches[0].run.provider).toBe('OpenAlex');
  await page.getByLabel('Import backup', { exact: true }).setInputFiles({ name: 'roundtrip.json', mimeType: 'application/json', buffer: raw });
  await page.getByRole('button', { name: 'Import as new copies', exact: true }).click();
  const imported = page.locator('article').filter({ has: page.getByRole('heading', { name: 'Commuter housing study (imported)', exact: true }) });
  await imported.getByRole('button', { name: 'Open roadmap', exact: true }).click();
  await page.goto('/#writing');
  await page.reload();
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(/university commuters.*\[1\].*Table 2, page 8/);

});
