import { expect, test } from '@playwright/test';
import { createProject } from '../../src/lib/model';

test.use({ viewport: { width: 320, height: 800 } });

test('dark beginner, trust, and study-planning views reflow at 320 CSS pixels', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('atlas-workspace-preferences', JSON.stringify({
    theme: 'dark', density: 'comfortable', motion: 'off', openTasksOnly: false,
  })));
  const publicViews = [
    ['overview', 'Turn curiosity'], ['primer', 'From a topic to a question'],
    ['paper-search', 'Paper search'], ['privacy', 'Privacy & data'],
    ['terms', 'Terms & limitations'], ['support', 'Support & recovery'],
  ];
  for (const [view, heading] of publicViews) {
    await page.goto(`/#${view}`);
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(heading) })).toBeVisible();
    await expect(page.locator('.journey-shell')).toHaveCSS('color-scheme', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `#${view}`).toBe(true);
  }
  const project = createProject('Reflow study planning');
  await page.goto('/#projects');
  await page.locator('input[type=file]').setInputFiles({ name: 'reflow.json', mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] })) });
  await page.getByRole('button', { name: 'Import as new copies' }).click();
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await page.goto('/#methods');
  await expect(page.getByLabel('Knowledge goal')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), '#methods').toBe(true);
  await page.goto('/#data');
  await expect(page.getByRole('heading', { name: 'Build your data management plan', exact: true })).toBeVisible();
  await page.getByRole('navigation', { name: 'Data management planning steps', exact: true }).getByRole('button', { name: 'Protect and document', exact: true }).click();
  await page.getByLabel('Backup and recovery').fill('Weekly backup with restoration checks.');
  await expect(page.getByLabel('Backup and recovery')).toHaveValue('Weekly backup with restoration checks.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), '#data').toBe(true);
  await expect(page.getByRole('button', { name: 'Export data management plan', exact: true })).toBeVisible();
});
