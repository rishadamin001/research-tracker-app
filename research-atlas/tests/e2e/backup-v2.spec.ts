import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createBackup } from '../../src/lib/backup';
import { createProject } from '../../src/lib/model';

test('portable backup from a different origin imports as copies and corrupt backup leaves projects intact', async ({ page }) => {
  const project = createProject('Migrated source project');
  project.question = 'What do commuter students need?';
  const envelope = await createBackup([project], { sourceOrigin: 'https://rishadamin001.github.io' });
  await page.goto('/#projects');
  await page.getByRole('heading', { name: 'My projects', exact: true }).waitFor();
  await page.locator('input[type=file]').setInputFiles({ name: 'portable.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(envelope)) });
  await expect(page.getByText(/source: https:\/\/rishadamin001.github.io/)).toBeVisible();
  await expect(page.getByText(/Integrity checksum verified/)).toBeVisible();
  await page.getByRole('button', { name: 'Import as new copies' }).click();
  await expect(page.getByRole('heading', { name: 'Migrated source project (imported)', exact: true })).toBeVisible();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Migrated source project (imported)', exact: true })).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'corrupt.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(envelope).replace('Migrated source project', 'Tampered source project')) });
  await expect(page.getByRole('status').filter({ hasText: 'Backup integrity check failed' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Migrated source project (imported)', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import as new copies' })).toHaveCount(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup', exact: true }).click();
  const downloaded = JSON.parse(await readFile((await (await downloadPromise).path())!, 'utf8'));
  expect(downloaded.backupVersion).toBe(2);
  expect(downloaded.projects).toHaveLength(1);
  expect(downloaded.projects[0].question).toBe(project.question);
  expect(downloaded.projects[0].id).not.toBe(project.id);
  expect(downloaded.sourceOrigin).toBe(new URL(page.url()).origin);
});

test('privacy, support and terms are public without a project', async ({ page }) => {
  await page.goto('/#privacy');
  await expect(page.getByRole('heading', { name: 'Privacy & data', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Terms & limitations', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Terms & limitations', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Get support', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Support & recovery', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /Open the Research Atlas issue tracker/ })).toBeVisible();
});
