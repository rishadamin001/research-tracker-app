import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createProject, paperSchema } from '../../src/lib/model';

test('a saved located claim becomes a cited section with portable references and preserved earlier draft', async ({ page }, testInfo) => {
  const project = createProject('Located evidence writing fixture');
  const claimId = crypto.randomUUID();
  project.question = 'How do commuters experience access to study spaces?';
  project.studyType = 'qualitative';
  project.manuscript = 'Earlier freeform analysis stays intact.';
  project.papers = [paperSchema.parse({ id: 'https://openalex.org/W731', title: 'Commuter access to study spaces', authors: 'Ada Example', year: 2025,
    doi: '10.1234/commuter-study', journal: 'Example Studies', url: 'https://example.org/study', oa: null, source: 'RIS', decision: 'include', reason: 'Relevant participants',
    evidenceClaims: [{ id: claimId, claimType: 'finding', claimText: 'Travel time constrained access to quiet study spaces.', evidenceLevel: 'full_text', locator: 'Results, page 4, Table 2',
      interpretation: 'Travel may narrow available study time.', uncertainty: 'Single-campus study; interpretation needs wider evidence.', reviewStatus: 'reviewed', reviewedAt: new Date().toISOString(), createdAt: new Date().toISOString(), gapRole: 'supports' }] })];
  await page.goto('/#projects');
  await page.getByLabel('Import backup', { exact: true }).setInputFiles({ name: 'writing.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] })) });
  await page.getByRole('button', { name: 'Import as new copies', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.goto(`/#writing?paper=${encodeURIComponent(project.papers[0].id)}&claim=${claimId}`);
  await expect(page.getByRole('heading', { name: 'Writing Studio', exact: true })).toBeVisible();
  await expect(page.getByLabel('Reference from this project')).toHaveValue(project.papers[0].id);
  await expect(page.getByLabel('Evidence from this source')).toHaveValue(claimId);
  await page.getByLabel('Section draft', { exact: true }).fill('A relevant pattern in the literature is: ');
  await page.getByRole('button', { name: 'Insert located evidence', exact: true }).click();
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(/Travel time constrained access.*\[1\].*Results, page 4, Table 2/);
  await expect(page.getByRole('region', { name: 'Evidence linked to this section' })).toContainText('Single-campus study');
  await expect(page.getByLabel('Manuscript draft', { exact: true })).toHaveValue(project.manuscript);
  const markdownDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export manuscript draft', exact: true }).click();
  const markdownFile = await markdownDownload;
  const markdown = await readFile((await markdownFile.path())!, 'utf8');
  for (const text of ['[1]', 'Ada Example', 'Results, page 4, Table 2', 'Single-campus study', project.manuscript]) expect(markdown).toContain(text);
  const docxDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export DOCX draft', exact: true }).click();
  const docx = await docxDownload;
  expect(docx.suggestedFilename()).toBe('manuscript-draft.docx');
  await docx.saveAs(testInfo.outputPath('connected-manuscript.docx'));
  const docxBytes = await readFile((await docx.path())!);
  expect(docxBytes.readUInt32LE(0)).toBe(0x04034b50);
  expect(docxBytes.includes(Buffer.from('word/document.xml'))).toBe(true);
  expect(docxBytes.includes(Buffer.from('Results, page 4, Table 2'))).toBe(true);
  const referenceDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export cited RIS', exact: true }).click();
  const references = await readFile((await (await referenceDownload).path())!, 'utf8');
  expect(references).toContain('10.1234/commuter-study');
  expect(references).not.toContain('Single-campus study');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.reload();
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(/Travel time constrained access.*\[1\]/);
  await expect(page.getByLabel('Manuscript draft', { exact: true })).toHaveValue(project.manuscript);
  const { violations } = await new AxeBuilder({ page }).include('.writing-studio').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(violations.map(item => ({ id: item.id, nodes: item.nodes.map(node => node.target) }))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
