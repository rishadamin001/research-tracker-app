import { expect, test } from '@playwright/test';

const medical = (start: number, count = 20) => Array.from({ length: count }, (_, i) => ({
  id: String(start + i), source: 'MED', title: `Hypothyroidism study ${start + i}`, authorString: 'Example Author', pubYear: '2025', doi: `10.1234/hypo${start + i}`,
  firstPublicationDate: '2025-02-15', citedByCount: 12, isOpenAccess: 'N',
  journalInfo: { journal: { title: 'Fixture journal', issn: '0272-4944' } }, abstractText: '<p>A source-supplied abstract about thyroid research.</p>',
}));

test('medical search retains its notebook filters while native topic navigation resets them', async ({ page }) => {
  const requests: URL[] = [];
  const topicRequests: URL[] = [];
  await page.route('https://www.ebi.ac.uk/europepmc/webservices/rest/search?**', route => {
    const url = new URL(route.request().url()); requests.push(url);
    const first = url.searchParams.get('cursorMark') === '*';
    return route.fulfill({ json: { hitCount: 60, nextCursorMark: first ? 'next-cursor' : 'third-cursor', resultList: { result: medical(first ? 1 : 21) } } });
  });
  await page.route('https://api.openalex.org/works?**', route => {
    topicRequests.push(new URL(route.request().url()));
    return route.fulfill({ json: { meta: { count: 0 }, results: [] } });
  });
  await page.goto('/#paper-search');
  await page.getByLabel('Search source', { exact: true }).selectOption('Europe PMC');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('Hypothyroidism');
  await page.getByLabel('Published from', { exact: true }).fill('2020');
  await page.getByRole('checkbox', { name: 'Open access only', exact: true }).check();
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  const controls = page.getByRole('region', { name: 'Search result controls' });
  await expect(controls).toContainText('Europe PMC reported 60 matches');
  await expect(page.locator('article.paper')).toHaveCount(20);
  await expect(page.getByLabel('Sort papers')).toHaveValue('quartile');
  await page.getByLabel('Sort papers').selectOption('original');
  await expect(page.locator('article.paper h3').first()).toHaveText('Hypothyroidism study 1');
  await page.getByRole('button', { name: 'Load next page', exact: true }).click();
  await expect(page.locator('article.paper')).toHaveCount(40);
  await expect(controls).toContainText('20 new papers added');
  expect(requests[1].searchParams.get('cursorMark')).toBe('next-cursor');
  expect(requests[0].searchParams.get('query')).toContain('FIRST_PDATE:[2020-01-01');
  await page.getByRole('button', { name: 'Search history', exact: true }).click();
  await page.getByText('Search audit trail (1)', { exact: true }).click();
  await page.getByRole('button', { name: 'Reuse search terms and filters', exact: true }).click();
  await expect(page.getByLabel('Search source', { exact: true })).toHaveValue('Europe PMC');
  await expect(page.getByLabel('Published from', { exact: true })).toHaveValue('2020');
  await expect(page.getByRole('checkbox', { name: 'Open access only', exact: true })).toBeChecked();
  await expect(page.locator('article.paper')).toHaveCount(20);
  expect(requests).toHaveLength(3);
  expect(requests[2].searchParams.get('query')).toContain('FIRST_PDATE:[2020-01-01');
  await page.evaluate(() => { window.location.hash = '#paper-search?topic=Climate+adaptation'; });
  await expect(page.getByRole('textbox', { name: 'Search literature' })).toHaveValue('Climate adaptation');
  await expect(page.getByLabel('Search source', { exact: true })).toHaveValue('OpenAlex');
  await expect(page.getByLabel('Published from', { exact: true })).toHaveValue('');
  await expect(page.getByRole('checkbox', { name: 'Open access only', exact: true })).not.toBeChecked();
  await expect(controls).toContainText('OpenAlex reported 0 matches');
  expect(topicRequests).toHaveLength(1);
  expect(topicRequests[0].searchParams.get('search')).toBe('Climate adaptation');
  expect(topicRequests[0].searchParams.get('filter')).toBeNull();
});

test('cross-provider DOI duplicates keep one saved source and preserve publisher marks and provenance', async ({ page }) => {
  await page.route('https://www.ebi.ac.uk/europepmc/webservices/rest/search?**', route => route.fulfill({ json: { hitCount: 1, resultList: { result: medical(1, 1) } } }));
  await page.route('https://api.crossref.org/works?**', route => route.fulfill({ json: { message: { 'total-results': 1, items: [{ DOI: '10.1234/HYPO1', title: ['Hypothyroidism Crossref record'], type: 'journal-article', publisher: 'Elsevier BV', ISSN: ['0272-4944'], 'container-title': ['Journal of Environmental Psychology'], author: [{ given: 'Example', family: 'Author' }], 'is-referenced-by-count': 0, published: { 'date-parts': [[2025, 2, 15]] } }] } } }));
  await page.goto('/');
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await page.getByLabel('Working title').fill('Medical search fixture');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await page.goto('/#paper-search');
  await page.getByLabel('Search source', { exact: true }).selectOption('Europe PMC');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('Hypothyroidism');
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  await page.getByRole('button', { name: 'Save paper', exact: true }).click();
  await page.getByLabel('Search source', { exact: true }).selectOption('Crossref');
  await expect(page.getByRole('checkbox', { name: 'Open access only', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Search papers', exact: true }).click();
  const paper = page.locator('article.paper').first();
  await expect(paper.getByText('POSI Q1 · 2026', { exact: true })).toBeVisible();
  await expect(paper.locator('.publication-mark img')).toHaveAttribute('src', /elsevier\.svg$/);
  await expect(paper.getByText(/Citation metadata: Crossref/)).toBeVisible();
  await expect(paper.getByText('0', { exact: true })).toBeVisible();
  await expect(paper.getByRole('button', { name: 'Saved: Hypothyroidism Crossref record', exact: true })).toBeDisabled();
  await page.goto('/#library');
  await expect(page.getByRole('status').filter({ hasText: '1 unique reference' })).toBeVisible();
});

test('external scholarly search links carry the entered query without importing or scraping results', async ({ page }) => {
  await page.goto('/#paper-search');
  await page.getByRole('textbox', { name: 'Search literature' }).fill('Hypothyroidism & pregnancy');
  await page.getByText('Search Google Scholar, PubMed, ResearchGate or Semantic Scholar', { exact: true }).click();
  for (const [name, host, key] of [['Google Scholar', 'scholar.google.com', 'q'], ['ResearchGate', 'www.researchgate.net', 'q'], ['PubMed', 'pubmed.ncbi.nlm.nih.gov', 'term'], ['Semantic Scholar', 'www.semanticscholar.org', 'q']]) {
    const href = await page.getByRole('link', { name: `Search ${name}`, exact: true }).getAttribute('href');
    const url = new URL(href!); expect(url.hostname).toBe(host); expect(url.searchParams.get(key)).toBe('Hypothyroidism & pregnancy');
  }
});
