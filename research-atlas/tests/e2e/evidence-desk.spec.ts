import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { createProject, paperSchema } from '../../src/lib/model';

async function loadProject(page: Page, count = 2) {
  const project = createProject('Traceable source journey');
  project.studyType = 'literature';
  project.question = 'How do commuter students describe access to study spaces?';
  project.papers = Array.from({ length: count }, (_, index) => paperSchema.parse({ id: `source-${index}`, title: `Commuter evidence ${index + 1}`, authors: index ? '' : 'A. Scholar', year: 2025, journal: index ? '' : 'Fixture journal', publisher: index ? undefined : 'Elsevier', venueType: 'journal', doi: index ? null : '10.1234/commuter', url: index ? '' : 'https://example.org/source', oa: null, source: 'Imported fixture', abstract: index ? undefined : 'Interviews examined how travel time shaped access to study spaces.', journalQuartile: index ? undefined : { quartile: 'Q1', source: 'POSI', year: 2026, category: 'Fixture category', url: 'https://example.org/rank' }, citedByCount: index ? undefined : 17 }));
  await page.goto('/#projects');
  await page.getByLabel('Import backup', { exact: true }).setInputFiles({ name: 'desk-project.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] })) });
  await page.getByRole('button', { name: 'Import as new copies', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.goto('/#screen?paper=source-0');
}

test('one source moves through screening and located evidence while workspace modes preserve its form and history', async ({ page }) => {
  await loadProject(page);
  await expect(page.getByRole('heading', { name: 'Evidence Desk', exact: true })).toBeVisible();
  await expect(page.getByText('Interviews examined how travel time shaped access to study spaces.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to screen this source', exact: true }).click();
  await page.getByLabel('Decision reason', { exact: true }).fill('The abstract addresses commuter experiences.');
  await page.getByRole('button', { name: 'Maybe', exact: true }).click();
  await page.getByLabel('Screening stage').selectOption('full_text');
  await page.getByLabel('Decision reason', { exact: true }).fill('Table 3 describes commuter access in the selected setting.');
  await page.getByRole('button', { name: 'Include', exact: true }).click();
  await page.getByText('Decision history (2)', { exact: true }).click();
  await expect(page.getByText('The abstract addresses commuter experiences.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to record evidence', exact: true }).click();
  await page.getByRole('button', { name: 'Add evidence claim', exact: true }).click();
  await page.getByLabel('Evidence claim', { exact: true }).fill('Travel time constrained access to study spaces.');
  await page.getByLabel('Evidence source level', { exact: true }).selectOption('full_text');
  await page.getByLabel('Source locator', { exact: true }).fill('Results, Table 3, page 8');
  await page.getByLabel('Your interpretation', { exact: true }).fill('Commute time may shape opportunities to study.');
  await page.getByLabel('Uncertainty or limitation', { exact: true }).fill('One campus and a small interview sample.');
  const sourceTwo = page.getByRole('complementary', { name: 'Source selection' }).getByRole('button', { name: /Commuter evidence 2/ });
  await expect(sourceTwo).toBeDisabled();
  await page.getByLabel('Guidance mode', { exact: true }).selectOption('expert');
  await expect(page.getByLabel('Evidence claim', { exact: true })).toHaveValue('Travel time constrained access to study spaces.');
  await expect(page.getByLabel('Decision reason', { exact: true })).toBeVisible();
  await page.getByLabel('Guidance mode', { exact: true }).selectOption('guided');
  await expect(page.getByLabel('Source locator', { exact: true })).toHaveValue('Results, Table 3, page 8');
  await page.getByRole('button', { name: 'Save evidence claim', exact: true }).click();
  await page.getByRole('button', { name: 'Mark claim reviewed', exact: true }).click();
  await expect(sourceTwo).toBeEnabled();
  await page.getByRole('button', { name: /^Use finding: Travel time constrained access/ }).click();
  await expect(page).toHaveURL(/#writing\?paper=source-0&claim=/);
  await page.goto('/#extract?paper=source-0');
  await expect(page.getByText('Travel time constrained access to study spaces.', { exact: true })).toBeVisible();
  await expect(page.getByText('Full text · Results, Table 3, page 8 · Marked reviewed', { exact: false })).toBeVisible();
  await page.goto('/#roadmap');
  await page.getByText('Export Research Passport', { exact: true }).click();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export passport JSON', exact: true }).click();
  const passport = JSON.parse(await readFile((await (await downloading).path())!, 'utf8'));
  expect(passport.sources[0].screeningEvents).toHaveLength(2);
  expect(passport.sources[0].claims[0].locator).toBe('Results, Table 3, page 8');
  expect(passport.sources[0].claims[0].uncertainty).toBe('One campus and a small interview sample.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('the source list stays bounded and missing source metadata remains explicit', async ({ page }) => {
  await loadProject(page, 45);
  const sources = page.getByRole('complementary', { name: 'Source selection' });
  await expect(sources.locator('.desk-source-list > li')).toHaveCount(20);
  await sources.getByRole('button', { name: 'Next sources', exact: true }).click();
  await expect(sources.locator('.desk-source-list > li')).toHaveCount(20);
  await sources.getByRole('button', { name: 'Next sources', exact: true }).click();
  await expect(sources.locator('.desk-source-list > li')).toHaveCount(5);
  await page.getByLabel('Find in saved literature', { exact: true }).fill('Commuter evidence 45');
  await sources.getByRole('button', { name: /Commuter evidence 45/ }).click();
  await expect(page.getByLabel('Find in saved literature', { exact: true })).toHaveValue('Commuter evidence 45');
  await expect(sources.locator('.desk-source-list > li')).toHaveCount(1);
  await expect(page.getByText('No abstract was supplied with this record.', { exact: true })).toBeVisible();
  await expect(page.getByText('Author metadata unavailable', { exact: false })).toBeVisible();
  await expect(page.getByText('No source link was supplied.', { exact: false })).toBeVisible();
  await page.getByLabel('Guidance mode', { exact: true }).selectOption('expert');
  const { violations } = await new AxeBuilder({ page }).include('main').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(violations.map(item => ({ id: item.id, targets: item.nodes.map(node => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('a native source link updates the selected detail without resetting source-list filters', async ({ page }) => {
  await loadProject(page, 3);
  const sources = page.getByRole('complementary', { name: 'Source selection' });
  await page.getByLabel('Find in saved literature', { exact: true }).fill('Commuter evidence 1');
  await expect(sources.locator('.desk-source-list > li')).toHaveCount(1);
  await page.goto('/#screen?paper=source-2');
  await expect(page.getByRole('region', { name: 'Selected source', exact: true })).toContainText('Commuter evidence 3');
  await expect(page.getByLabel('Find in saved literature', { exact: true })).toHaveValue('Commuter evidence 1');
  await expect(sources.locator('.desk-source-list > li')).toHaveCount(1);
});

test('an unfinished evidence claim blocks navigation until it is saved or cancelled', async ({ page }) => {
  await loadProject(page, 1);
  await page.getByRole('navigation', { name: 'Evidence Desk tasks', exact: true }).getByRole('button', { name: /Record evidence/ }).click();
  await page.getByRole('button', { name: 'Add evidence claim', exact: true }).click();
  await page.getByLabel('Evidence claim', { exact: true }).fill('An unfinished interpretation that must remain available.');
  await page.goto('/#roadmap');
  await expect(page).toHaveURL(/#screen\?paper=source-0$/);
  await expect(page.getByText('Save or cancel your evidence claim before leaving this source.', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Evidence claim', { exact: true })).toHaveValue('An unfinished interpretation that must remain available.');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.goto('/#roadmap');
  await expect(page.getByRole('heading', { name: 'Traceable source journey (imported)', exact: true })).toBeVisible();
});
