import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

const title = 'Housing affordability near a university campus';
const reference = (doi: string, year: number) => `TY  - JOUR\nTI  - ${title}\nAU  - Hasan, Noor\nPY  - ${year}\nDO  - ${doi}\nER  -\n`;

test('reference import previews exact and possible duplicates and exports both formats', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Reference exchange project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#projects');

  const exchange = page.getByRole('region', { name: 'Reference exchange' });
  await exchange.getByRole('button', { name: 'Import reference file' }).click();
  const file = exchange.getByLabel('RIS or BibTeX file');
  const first = reference('10.1234/housing', 2025);
  await file.setInputFiles({ name: 'papers.ris', mimeType: 'text/plain', buffer: Buffer.from(first) });
  await expect(exchange.getByRole('button', { name: 'Export RIS' })).toBeDisabled();
  await expect(exchange.getByText(/1 ready to add/)).toBeVisible();
  await exchange.getByRole('button', { name: 'Add references to project' }).click();
  await expect(exchange.getByText('1 reference added to Reference exchange project.')).toBeVisible();

  await file.setInputFiles({ name: 'more.ris', mimeType: 'text/plain', buffer: Buffer.from(first + reference('10.1234/revision', 2026)) });
  await expect(exchange.getByText(/0 ready to add · 1 exact matches skipped/)).toBeVisible();
  await expect(exchange.getByRole('button', { name: 'Add references to project' })).toBeDisabled();
  await exchange.getByRole('checkbox', { name: /keep housing affordability/i }).check();
  await expect(exchange.getByText(/1 ready to add · 1 exact matches skipped/)).toBeVisible();
  await exchange.getByRole('button', { name: 'Add references to project' }).click();

  for (const [label, extension] of [['Export RIS', 'ris'], ['Export BibTeX', 'bib']]) {
    const [download] = await Promise.all([page.waitForEvent('download'), exchange.getByRole('button', { name: label }).click()]);
    expect(download.suggestedFilename()).toBe(`references.${extension}`);
    const contents = await readFile((await download.path())!, 'utf8');
    expect(contents).toContain('10.1234/housing');
    expect(contents).toContain('10.1234/revision');
  }
});
