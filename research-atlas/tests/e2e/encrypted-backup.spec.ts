import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { createProject } from '../../src/lib/model';

const passphrase = 'examplé research atlas passphrase 42';

type BackupDerivationGate = { started: boolean; finished: boolean; release: () => void };

test('canceling an in-flight export discards its result and leaves later downloads usable', async ({ page }) => {
  await page.addInitScript(() => {
    const deriveKey = crypto.subtle.deriveKey.bind(crypto.subtle);
    let release = () => {};
    const gate = new Promise<void>(resolve => { release = resolve; });
    const testGate: BackupDerivationGate = { started: false, finished: false, release };
    Object.defineProperty(window, 'backupDerivationGate', { value: testGate });
    crypto.subtle.deriveKey = async (...args: Parameters<SubtleCrypto['deriveKey']>) => {
      if (testGate.started) return deriveKey(...args);
      testGate.started = true;
      await gate;
      try { return await deriveKey(...args); }
      finally { testGate.finished = true; }
    };
  });
  let downloads = 0;
  page.on('download', () => { downloads++; });
  await page.goto('/#projects');
  const download = page.getByRole('button', { name: 'Download encrypted backup', exact: true });
  const dialog = page.getByRole('dialog', { name: 'Encrypt a backup' });
  async function submit() {
    await download.click();
    await dialog.getByLabel('Passphrase', { exact: true }).fill(passphrase);
    await dialog.getByLabel('Confirm passphrase', { exact: true }).fill(passphrase);
    await dialog.getByRole('button', { name: 'Encrypt and download', exact: true }).click();
  }
  await submit();
  await page.waitForFunction(() => (window as Window & { backupDerivationGate?: BackupDerivationGate }).backupDerivationGate?.started);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByText('Backup operation canceled.', { exact: true })).toBeVisible();
  await page.evaluate(() => (window as Window & { backupDerivationGate?: BackupDerivationGate }).backupDerivationGate?.release());
  await page.waitForFunction(() => (window as Window & { backupDerivationGate?: BackupDerivationGate }).backupDerivationGate?.finished);
  await expect(download).toBeFocused();
  expect(downloads).toBe(0);

  const downloaded = page.waitForEvent('download');
  await submit();
  expect((await downloaded).suggestedFilename()).toBe('research-atlas-backup.atlas-backup');
  expect(downloads).toBe(1);
});

test('verifies legacy and encrypted files without writing, then restores an encrypted project in a fresh browser context', async ({ page, browser, baseURL }) => {
  const source = createProject('Encrypted backup fixture');
  source.question = 'How do commuters experience access to study spaces?';
  source.questionDraft = 'Compare study spaces before and after evening classes.';
  const now = '2026-01-20T12:00:00.000Z';
  source.notebookNotes = [{
    id: crypto.randomUUID(), kind: 'question', text: 'Check whether access depends on library opening hours.',
    sources: [], createdAt: now, updatedAt: now, status: 'open', nextStep: 'Check the interview schedule',
  }];
  const legacy = { name: 'older-archive.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: now, projects: [source] })) };
  await page.goto('/#projects');
  const verify = page.getByLabel('Verify backup', { exact: true });
  await expect(verify).toBeEnabled();
  await verify.setInputFiles(legacy);
  await expect(page.getByText('This older format did not record a checksum.', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Import as new copies', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: source.title, exact: true })).toHaveCount(0);

  await page.getByLabel('Import backup', { exact: true }).setInputFiles(legacy);
  await page.getByRole('button', { name: 'Import as new copies', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.getByRole('button', { name: 'Download encrypted backup', exact: true }).click();
  const create = page.getByRole('dialog', { name: 'Encrypt a backup' });
  await expect(create.getByLabel('Passphrase', { exact: true })).toBeFocused();
  await create.getByLabel('Passphrase', { exact: true }).fill(passphrase);
  await create.getByLabel('Confirm passphrase', { exact: true }).fill('A different passphrase');
  await create.getByRole('button', { name: 'Encrypt and download', exact: true }).click();
  await expect(create.getByRole('alert')).toContainText('must match');
  await expect(create.getByLabel('Passphrase', { exact: true })).toHaveValue('');
  await create.getByLabel('Passphrase', { exact: true }).fill(passphrase);
  await create.getByLabel('Confirm passphrase', { exact: true }).fill(passphrase);
  const encryptedDownload = page.waitForEvent('download');
  await create.getByRole('button', { name: 'Encrypt and download', exact: true }).click();
  const file = await encryptedDownload;
  const downloadPath = await file.path();
  const encrypted = { name: file.suggestedFilename(), mimeType: 'application/octet-stream', buffer: await readFile(downloadPath!) };
  expect(encrypted.name).toBe('research-atlas-backup.atlas-backup');
  expect(encrypted.buffer.subarray(0, 8).toString()).toBe('RAENC001');
  expect(encrypted.buffer.includes(Buffer.from(source.questionDraft))).toBe(false);
  expect(await page.evaluate(value => Object.values(localStorage).some(item => item.includes(value)), passphrase)).toBe(false);

  const fresh = await browser.newContext({ baseURL });
  try {
    const restored = await fresh.newPage();
    await restored.goto('/#projects');
    await restored.getByLabel('Verify backup', { exact: true }).setInputFiles(encrypted);
    const verifyDialog = restored.getByRole('dialog', { name: 'Verify an encrypted backup' });
    await verifyDialog.getByLabel('Passphrase', { exact: true }).fill('Incorrect passphrase');
    await verifyDialog.getByRole('button', { name: 'Unlock and verify', exact: true }).click();
    await expect(verifyDialog.getByRole('alert')).toContainText('Could not unlock');
    await verifyDialog.getByLabel('Passphrase', { exact: true }).fill(passphrase);
    await verifyDialog.getByRole('button', { name: 'Unlock and verify', exact: true }).click();
    await expect(restored.getByText('The file unlocked and its checksum matched.', { exact: false })).toBeVisible();
    await expect(restored.getByRole('button', { name: 'Import as new copies', exact: true })).toHaveCount(0);
    await expect(restored.getByRole('heading', { name: /Encrypted backup fixture/ })).toHaveCount(0);

    await restored.getByLabel('Import encrypted backup', { exact: true }).setInputFiles(encrypted);
    let unlock = restored.getByRole('dialog', { name: 'Unlock a backup for import' });
    await unlock.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(restored.getByRole('button', { name: 'Import as new copies', exact: true })).toHaveCount(0);
    await restored.getByLabel('Import encrypted backup', { exact: true }).setInputFiles(encrypted);
    unlock = restored.getByRole('dialog', { name: 'Unlock a backup for import' });
    await unlock.getByLabel('Passphrase', { exact: true }).fill(passphrase);
    await unlock.getByRole('button', { name: 'Unlock and preview', exact: true }).click();
    await restored.getByRole('button', { name: 'Import as new copies', exact: true }).click();
    await expect(restored.getByText('Saved on this device', { exact: true })).toBeAttached();
    await restored.reload();
    await expect(restored.getByRole('heading', { name: 'Encrypted backup fixture (imported) (imported)', exact: true })).toBeVisible();
    const restoredDownload = restored.waitForEvent('download');
    await restored.getByRole('button', { name: 'Download backup', exact: true }).click();
    const json = JSON.parse(await readFile((await (await restoredDownload).path())!, 'utf8'));
    expect(json.projects).toHaveLength(1);
    expect(json.projects[0].question).toBe(source.question);
    expect(json.projects[0].questionDraft).toBe(source.questionDraft);
    expect(json.projects[0].notebookNotes).toEqual(source.notebookNotes);
  } finally {
    await fresh.close();
  }
});
