import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const views = [
    ['overview', 'Turn curiosity'],
    ['primer', 'From a topic to a question'],
    ['explore', 'Explore disciplines'],
    ['projects', 'My projects'],
    ['conferences', 'Conference planner'],
    ['preferences', 'Make Atlas yours'],
    ['paper-search', 'Paper search'],
    ['guide', 'Research planner'],
    ['privacy', 'Privacy & data'],
    ['terms', 'Terms & limitations'],
    ['support', 'Support & recovery'],
];
for (const [view, heading] of views) {
  test(`${view} passes accessibility scan`, async ({ page }) => {
    await page.goto(`/#${view}`);
    await expect(page.getByRole('heading', { level: 1, name: new RegExp(heading, 'i') })).toBeVisible();
    if (view === 'paper-search') await expect(page.getByRole('search')).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).include('main')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(violations.map(({ id, nodes }) => ({ id, targets: nodes.map(node => node.target) })), `#${view}`).toEqual([]);
  });
}
