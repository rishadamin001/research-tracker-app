import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('paper search, research planner and privacy controls pass accessibility scans', async ({ page }) => {
  const views = [
    ['paper-search', 'Paper search'],
    ['guide', 'Research planner'],
    ['privacy', 'Privacy & data'],
  ];
  for (const [view, heading] of views) {
    await page.goto(`/#${view}`);
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(heading, 'i') })).toBeVisible();
    if (view === 'paper-search') await expect(page.getByRole('search')).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), `#${view}`).toEqual([]);
  }
});
