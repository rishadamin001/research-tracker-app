import { expect, test } from '@playwright/test';

const records = (start: number, length: number) => Array.from({ length }, (_, index) => ({ id: `https://openalex.org/W${start + index}`, display_name: `Housing study ${start + index}`, publication_year: 2025, doi: null, referenced_works: ['https://openalex.org/W999'] }));

test('load more, stop/resume, page errors, audit export and refresh preserve bounded search history', async ({ page }) => {
  const pages: number[] = [];
  let failPageTwo = true;
  let refresh = false;
  await page.route('https://api.openalex.org/works?**', route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 1);
    pages.push(number);
    if (number === 2 && failPageTwo) { failPageTwo = false; return route.fulfill({ status: 503, body: '' }); }
    return route.fulfill({ json: { meta: { count: 75 }, results: refresh ? records(101, 20) : records((number - 1) * 20 + 1, 20) } });
  });
  await page.goto('/#paper-search');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  const results = page.getByRole('region', { name: 'Search result controls' });
  await expect(results).toContainText('20 of 20 results shown');
  await page.getByRole('button', { name: 'Stop here', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Load next page', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Resume page loading', exact: true }).click();
  await results.getByRole('button', { name: 'Load next page', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('503');
  await expect(results).toContainText('20 of 20 results shown');
  await page.getByRole('navigation', { name: 'Result pagination' }).getByRole('button', { name: 'Load next page', exact: true }).click();
  await expect(results).toContainText('20 of 40 results shown');
  await expect(results).toContainText('2 pages retrieved');
  await expect(results).toContainText('20 new records added');
  await expect(page.locator('article.paper')).toHaveCount(20);
  await expect(page.getByRole('heading', { name: 'Housing study 21', exact: true })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Housing study 1', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Show all retrieved papers', exact: true }).click();
  await expect(page.locator('article.paper')).toHaveCount(40);
  await page.getByRole('button', { name: 'View 20 newly loaded papers', exact: true }).click();
  await expect(page.locator('article.paper')).toHaveCount(20);
  await page.getByText('Search audit trail (1)', { exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export search JSON', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('search-history.json');
  refresh = true;
  await page.getByRole('button', { name: 'Refresh this search', exact: true }).click();
  await expect(results).toContainText('20 newly discovered records');
  expect(pages).toEqual([1, 2, 2, 1]);
  await page.reload();
  await expect(page.getByText('Search audit trail (2)', { exact: true })).toBeVisible();
});

test('continuation is usable after a previously exhausted allowance has reset', async ({ page }) => {
  const requested: number[] = [];
  await page.route('https://api.openalex.org/works?**', route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 1);
    requested.push(number);
    return route.fulfill({ headers: { 'X-RateLimit-Remaining': number === 1 ? '0' : '50', 'X-RateLimit-Reset': '0' }, json: { meta: { count: 100 }, results: records((number - 1) * 20 + 1, 20) } });
  });
  await page.goto('/#paper-search');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  await expect(page.locator('article.paper')).toHaveCount(20);
  const controls = page.getByRole('region', { name: 'Search result controls' });
  await controls.getByRole('button', { name: 'Load next page', exact: true }).click();
  await expect(controls).toContainText('20 of 40 results shown');
  await expect(page.locator('article.paper h3').first()).toHaveText('Housing study 21');
  expect(requested).toEqual([1, 2]);
});

for (const outcome of ['network', 'invalid', 'empty', 'overlap'] as const) {
  test(`continuation explains ${outcome} responses and preserves earlier papers`, async ({ page }) => {
    await page.route('https://api.openalex.org/works?**', route => {
      const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 1);
      if (number === 1) return route.fulfill({ json: { meta: { count: 100 }, results: records(1, 20) } });
      if (outcome === 'network') return route.abort('failed');
      if (outcome === 'invalid') return route.fulfill({ json: { results: 'malformed' } });
      return route.fulfill({ json: { meta: { count: 100 }, results: outcome === 'empty' ? [] : records(1, 20) } });
    });
    await page.goto('/#paper-search');
    await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
    await page.getByRole('button', { name: 'Search papers', exact: true }).click();
    await expect(page.locator('article.paper')).toHaveCount(20);
    const footer = page.getByRole('navigation', { name: 'Result pagination' });
    await footer.getByRole('button', { name: 'Load next page', exact: true }).click();
    if (outcome === 'network' || outcome === 'invalid') {
      await expect(page.getByRole('alert')).toContainText(outcome === 'network' ? 'Could not reach OpenAlex' : 'records the app could not read');
      await expect(page.getByRole('region', { name: 'Search result controls' })).toContainText('earlier papers are still available');
    } else {
      await expect(page.getByRole('region', { name: 'Search result controls' })).toContainText('no new provider records');
      await expect(page.locator('article.paper')).toHaveCount(0);
      if (outcome === 'empty') {
        await expect(page.getByText(/End of the results returned by OpenAlex/)).toBeVisible();
        await expect(footer).toHaveCount(0);
      } else {
        await expect(footer.getByRole('button', { name: 'Load next page', exact: true })).toBeEnabled();
      }
      await page.getByRole('button', { name: 'Show all retrieved papers', exact: true }).click();
    }
    await expect(page.locator('article.paper')).toHaveCount(20);
  });
}

test('project Discover shares the paging state and drops earlier IDs and DOI aliases from each new page', async ({ page }) => {
  const requested: number[] = [];
  let deliverPageTwo: () => void = () => {};
  const pending = new Promise<void>(resolve => { deliverPageTwo = resolve; });
  await page.route('https://api.openalex.org/works?**', async route => {
    const number = Number(new URL(route.request().url()).searchParams.get('page') ?? 1);
    requested.push(number);
    const first = { ...records(1, 1)[0], doi: 'https://doi.org/10.1234/study-one' };
    const alias = { ...records(91, 1)[0], doi: 'https://doi.org/10.1234/STUDY-ONE' };
    if (number === 2) await pending;
    const results = number === 1 ? [first, ...records(2, 19)] : number === 2
      ? [first, alias, ...records(21, 18)]
      : [records(91, 1)[0], ...records(39, 1)];
    await route.fulfill({ json: { meta: { count: 42 }, results } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title', { exact: true }).fill('Housing search fixture');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#discover');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  const controls = page.getByRole('region', { name: 'Search result controls' });
  const footer = page.getByRole('navigation', { name: 'Result pagination' });
  const nextName = { name: 'Load next page', exact: true };
  const loadingName = { name: 'Loading next page…', exact: true };
  const headings = page.locator('article.paper h3');
  await expect(headings).toHaveCount(20);
  await expect(controls.getByRole('button', nextName)).toBeEnabled();
  expect(await footer.evaluate(element => {
    const lastPaper = Array.from(document.querySelectorAll('article.paper')).at(-1);
    return Boolean(lastPaper && lastPaper.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING);
  })).toBe(true);
  try {
    await footer.getByRole('button', nextName).click();
    await expect(controls.getByRole('button', loadingName)).toBeDisabled();
    await expect(footer.getByRole('button', loadingName)).toBeDisabled();
  } finally {
    deliverPageTwo();
  }
  await expect(headings).toHaveText(records(21, 18).map(paper => paper.display_name));
  await expect(headings.first()).toBeFocused();
  await controls.getByRole('button', nextName).click();
  await expect(headings).toHaveText(['Housing study 39']);
  await expect(footer).toHaveCount(0);
  await controls.getByRole('button', { name: 'Show all retrieved papers', exact: true }).click();
  await expect(headings).toHaveText(records(1, 39).map(paper => paper.display_name));
  expect(requested).toEqual([1, 2, 3]);
});

test('related discovery sends only citation IDs and identifies suggestions', async ({ page }) => {
  const filters: string[] = [];
  await page.route('https://api.openalex.org/works?**', route => {
    const filter = new URL(route.request().url()).searchParams.get('filter');
    if (filter) filters.push(filter);
    return route.fulfill({ json: { results: filter ? records(901, 1) : records(1, 1) } });
  });
  await page.goto('/#paper-search');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('student housing');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  await page.getByText('Explore related papers', { exact: true }).click();
  await page.getByRole('button', { name: 'Find citing papers', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Housing study 901', exact: true })).toBeVisible();
  await expect(page.getByText(/Results are discovery suggestions/)).toBeVisible();
  expect(filters).toEqual(['cites:W1']);
});
