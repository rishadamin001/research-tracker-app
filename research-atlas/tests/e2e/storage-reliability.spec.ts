import { expect, test } from '@playwright/test';

test('editing a version 1 workspace upgrades its envelope and preserves both manuscript formats after reload', async ({ page }) => {
  const legacyManuscript = 'Original manuscript — keep this wording.\n\nMethods and notes from the earlier app.';
  const structuredBody = 'A new structured introduction linked to the existing literature. ';
  // Seed the earlier stored format directly, without current schema defaults or
  // an import path that could hide a local-storage migration regression.
  const legacyProject = {
    id: 'legacy-workspace-project', title: 'Legacy manuscript migration', discipline: 'Health sciences', domain: '',
    problem: '', question: 'How do people experience treatment?', setting: '', purpose: 'explore', data: 'existing',
    design: '', ethics: '', analysis: '', gap: '', gapStatus: 'idea',
    papers: [{ id: 'legacy-paper', title: 'Existing source from the earlier workspace', authors: 'Ada Example', year: 2024,
      doi: '10.1234/legacy-source', journal: 'Example Research', url: 'https://example.org/legacy-source', oa: null,
      source: 'Crossref', notes: '', finding: '', locator: '', decision: 'include', reason: 'Relevant to the question' }],
    searches: [], lessons: [], manuscript: legacyManuscript,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  };
  await page.goto('/#projects');
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeEnabled();
  await page.evaluate(project => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open('research-atlas', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('workspace', 'readwrite');
      tx.objectStore('workspace').put({ schemaVersion: 1, exportedAt: project.updatedAt, projects: [project] }, 'projects');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), legacyProject);
  const readStored = () => page.evaluate(() => new Promise<{
    schemaVersion: number; revision?: number; projects: { id: string; manuscript: string; writingStudio?: {
      sections: { id: string; body: string }[]; citations: { number: number; paperId: string; sourceSnapshot: { title: string } }[];
    } }[];
  }>((resolve, reject) => {
    const open = indexedDB.open('research-atlas', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('workspace', 'readonly'), request = tx.objectStore('workspace').get('projects');
      tx.oncomplete = () => { const record = request.result; db.close(); resolve(record); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }));
  expect((await readStored()).schemaVersion).toBe(1);
  await page.goto('/#writing');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Writing Studio', exact: true })).toBeVisible();
  await expect(page.getByLabel('Manuscript draft', { exact: true })).toHaveValue(legacyManuscript);
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue('');
  await page.getByLabel('Section draft', { exact: true }).fill(structuredBody);
  await page.getByLabel('Section draft', { exact: true }).press('End');
  await page.getByLabel('Reference from this project', { exact: true }).selectOption('legacy-paper');
  await page.getByRole('button', { name: 'Insert citation', exact: true }).click();
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(`${structuredBody}[1]`);
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  const saved = await readStored();
  expect(saved.schemaVersion).toBe(3);
  expect(saved.revision).toBeGreaterThan(0);
  expect(saved.projects).toHaveLength(1);
  expect(saved.projects[0].id).toBe(legacyProject.id);
  expect(saved.projects[0].manuscript).toBe(legacyManuscript);
  expect(saved.projects[0].writingStudio?.sections).toContainEqual({ id: 'introduction', body: `${structuredBody}[1]` });
  expect(saved.projects[0].writingStudio?.citations).toEqual([expect.objectContaining({ number: 1, paperId: 'legacy-paper', sourceSnapshot: expect.objectContaining({ title: legacyProject.papers[0].title }) })]);
  await page.reload();
  await expect(page.getByLabel('Section draft', { exact: true })).toHaveValue(`${structuredBody}[1]`);
  await expect(page.getByLabel('Manuscript draft', { exact: true })).toHaveValue(legacyManuscript);
  await expect(page.locator('.writing-bibliography')).toContainText(legacyProject.papers[0].title);
  expect(await readStored()).toEqual(saved);
});

test('a second tab cannot overwrite a newer saved project and can keep a recovery copy', async ({ page, context }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Shared browser project');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  const other = await context.newPage();
  await other.goto('/#profile');
  await expect(other.getByLabel('Project title', { exact: true })).toHaveValue('Shared browser project');
  await page.getByLabel('Project title', { exact: true }).fill('Saved by the first tab');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await expect(other.getByRole('heading', { name: 'Another tab saved changes', exact: true })).toBeVisible();
  await other.getByLabel('Project title', { exact: true }).fill('Unsaved in second tab');
  const recovery = other.waitForEvent('download');
  await other.getByRole('button', { name: 'Download this tab’s backup', exact: true }).click();
  expect((await recovery).suggestedFilename()).toBe('research-atlas-backup.json');
  await page.reload();
  await expect(page.getByLabel('Project title', { exact: true })).toHaveValue('Saved by the first tab');
  await other.close();
});

test('local snapshots preview and restore a prior workspace without losing the replaced version', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Snapshot research');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.goto('/#projects');
  await page.getByRole('button', { name: 'Save local snapshot now', exact: true }).click();
  await expect(page.getByText('Local recovery snapshot saved.', { exact: true })).toBeVisible();
  await page.goto('/#profile');
  await page.getByLabel('Project title', { exact: true }).fill('Changed after snapshot');
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.goto('/#projects');
  await page.getByRole('button', { name: 'Review local snapshots', exact: true }).click();
  await page.getByRole('button', { name: 'Preview snapshot', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Snapshot preview', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Restore this snapshot', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Snapshot research', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Review local snapshots', exact: true }).click();
  await expect(page.getByText(/before-restore/)).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Snapshot research', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Review local snapshots', exact: true }).click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Clear local snapshots', exact: true }).click();
  await expect(page.getByText('Local recovery snapshots deleted. Current projects were not changed.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Snapshot research', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Review local snapshots', exact: true }).click();
  await expect(page.getByText('No local recovery snapshot is available yet.', { exact: false })).toBeVisible();
});

test('atomic competing saves allow one revision and preserve the winner', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const modulePath = '/src/lib/storage.ts';
    const storage = await import(modulePath);
    const modelPath = '/src/lib/model.ts';
    const model = await import(modelPath);
    const base = await storage.loadWorkspace();
    const first = model.createProject('Race winner A');
    const second = model.createProject('Race winner B');
    const outcomes = await Promise.allSettled([
      storage.saveWorkspace([first], base.revision),
      storage.saveWorkspace([second], base.revision),
    ]);
    const final = await storage.loadWorkspace();
    return { statuses: outcomes.map(item => item.status), errors: outcomes.flatMap(item => item.status === 'rejected' ? item.reason.name : []), revision: final.revision, count: final.projects.length, title: final.projects[0].title };
  });
  expect(result.statuses.filter(status => status === 'fulfilled')).toHaveLength(1);
  expect(result.errors).toEqual(['WorkspaceConflictError']);
  expect(result.revision).toBe(1); expect(result.count).toBe(1);
  expect(['Race winner A', 'Race winner B']).toContain(result.title);
});

test('a corrupt project is isolated without automatically replacing the original records', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Valid alongside corrupt record');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const open = indexedDB.open('research-atlas', 1);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('workspace', 'readwrite'), store = tx.objectStore('workspace'), request = store.get('projects');
      request.onsuccess = () => store.put({ ...request.result, projects: [...request.result.projects, { id: 'damaged', title: 'Keep the original damaged data', papers: 'invalid' }] }, 'projects');
      tx.oncomplete = () => { db.close(); resolve(); }; tx.onabort = () => { db.close(); reject(tx.error); };
    };
    open.onerror = () => reject(open.error);
  }));
  await page.goto('/#projects'); await page.reload();
  await expect(page.getByRole('heading', { name: 'Some stored records need recovery', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Valid alongside corrupt record', exact: true })).toBeVisible();
  const raw = await page.evaluate(() => new Promise<unknown>((resolve, reject) => {
    const open = indexedDB.open('research-atlas', 1);
    open.onsuccess = () => { const db = open.result, tx = db.transaction('workspace', 'readonly'), request = tx.objectStore('workspace').get('projects'); request.onsuccess = () => resolve(request.result); tx.oncomplete = () => db.close(); tx.onabort = () => reject(tx.error); };
  }));
  expect(JSON.stringify(raw)).toContain('Keep the original damaged data');
  const recovery = page.waitForEvent('download'); await page.getByRole('button', { name: 'Download original stored data', exact: true }).click();
  expect((await recovery).suggestedFilename()).toBe('research-atlas-recovery-raw.json');
});

test('snapshot restore pauses other workspace controls until its transaction finishes', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Restore concurrency fixture');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.goto('/#projects');
  await page.getByRole('button', { name: 'Save local snapshot now', exact: true }).click();
  await expect(page.getByText('Local recovery snapshot saved.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Preview snapshot', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Snapshot preview', exact: true })).toBeVisible();
  // Hold a real earlier transaction, simulating slow browser storage without
  // replacing the application's save/restore functions.
  await page.evaluate(() => new Promise<void>((resolve, reject) => {
    const state = window as Window & { atlasReleaseStorageLock?: boolean };
    state.atlasReleaseStorageLock = false;
    const open = indexedDB.open('research-atlas', 1);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result, tx = db.transaction('workspace', 'readwrite'), store = tx.objectStore('workspace');
      const keepAlive = () => {
        const request = store.get('projects');
        request.onsuccess = () => { if (!state.atlasReleaseStorageLock) keepAlive(); };
      };
      keepAlive(); tx.oncomplete = () => db.close(); tx.onabort = () => db.close(); resolve();
    };
  }));
  await page.getByRole('button', { name: 'Restore this snapshot', exact: true }).click();
  await expect(page.locator('.stage-frame')).toHaveAttribute('inert', '');
  await expect(page.locator('header.journey-topbar')).toHaveAttribute('inert', '');
  await expect(page.getByRole('button', { name: 'Restore this snapshot', exact: true })).toBeDisabled();
  await page.evaluate(() => { (window as Window & { atlasReleaseStorageLock?: boolean }).atlasReleaseStorageLock = true; });
  await expect(page.getByText('Earlier workspace restored. Review its contents before continuing.', { exact: true })).toBeVisible();
  await expect(page.locator('.stage-frame')).not.toHaveAttribute('inert', '');
  await expect(page.locator('main')).toBeFocused();
});
