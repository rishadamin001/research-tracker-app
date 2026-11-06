import { test, expect } from '@playwright/test';

test('Foundations is removed; external references navigate without popup tabs', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Research foundations', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Research is a skill.', { exact: false })).toHaveCount(0);
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Link navigation check');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('button', { name: 'Back to roadmap' }).click();
  await page.getByRole('button', { name: /^Frame your question/ }).click();
  const link = page.getByRole('link', { name: 'Research perspectives', exact: true });
  await expect(link).not.toHaveAttribute('target', '_blank');
  await expect(link).toHaveAttribute('href', 'https://www.open.edu/openlearn/mod/oucontent/view.php?id=48638');
  await page.route('https://www.open.edu/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Reference destination</h1>' }));
  await expect(page.getByText('Saved on this device', { exact: true })).toBeAttached();
  await link.click();
  await expect(page.getByRole('heading', { name: 'Reference destination' })).toBeVisible();
  expect(page.context().pages()).toHaveLength(1);
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Frame your question', exact: true })).toBeVisible();
  await expect(page.locator('.page-heading')).toContainText('Link navigation check');
});

test('copy fallback reveals an address when clipboard access is unavailable', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('Unavailable')) }, configurable: true }); });
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.getByRole('button', { name: 'Back to roadmap' }).click();
  await page.getByRole('button', { name: /^Frame your question/ }).click();
  await page.getByRole('button', { name: 'Copy link: Research perspectives', exact: true }).click();
  await expect(page.getByLabel('Copy this address')).toHaveValue('https://www.open.edu/openlearn/mod/oucontent/view.php?id=48638');
});
