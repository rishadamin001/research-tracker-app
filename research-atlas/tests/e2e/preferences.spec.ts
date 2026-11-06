import { expect, test } from '@playwright/test';

test('workspace preferences persist and disable section animation', async ({ page }) => {
  await page.goto('/#preferences');
  await page.getByLabel('Color theme').selectOption('dark');
  await page.getByLabel('Layout density').selectOption('compact');
  await page.getByLabel('Section transitions').selectOption('off');
  await page.getByLabel('Hide completed tasks on the roadmap').check();
  await page.reload();
  await expect(page.getByLabel('Color theme')).toHaveValue('dark');
  await expect(page.getByLabel('Layout density')).toHaveValue('compact');
  await expect(page.getByLabel('Hide completed tasks on the roadmap')).toBeChecked();
  await expect(page.locator('.journey-shell')).toHaveCSS('color-scheme', 'dark');
  await expect(page.locator('.stage-frame')).toHaveCSS('animation-name', 'none');
  await page.getByRole('button', { name: 'Restore display defaults' }).click();
  await expect(page.getByLabel('Color theme')).toHaveValue('light');
  await expect(page.getByLabel('Hide completed tasks on the roadmap')).not.toBeChecked();
});
