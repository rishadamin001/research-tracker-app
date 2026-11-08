import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createProject,parseBackup,normalizeDoi,addPaper,safeUrl,matrixCsv} from '../src/lib/model';
import {checkJournalMetrics,PaperSearchError,parseWorks,runPaperSearch,searchPapers} from '../src/lib/providers';
import {routeDesign,disciplines} from '../src/lib/content';
import {normalizeIssn,orderJournals,orderPapers} from '../src/lib/ranking';
import {updateProject} from '../src/lib/workflow';
import {searchRunSchema} from '../src/lib/search-provenance';
test('backup round trip preserves research and rejects unsupported schema',()=>{const p=createProject('Test');p.question='What changes?';const raw=JSON.stringify({schemaVersion:1,exportedAt:new Date().toISOString(),projects:[p]});assert.deepEqual(parseBackup(raw).projects[0],p);assert.throws(()=>parseBackup(raw.replace('"schemaVersion":1','"schemaVersion":2')));assert.throws(()=>parseBackup('{"projects":[{}]}'));});
test('a version 1 project made before the roadmap keeps its question and evidence', () => {
  const at = '2026-01-01T00:00:00.000Z';
  const [project] = parseBackup(JSON.stringify({ schemaVersion: 1, exportedAt: at, projects: [{
    id: 'old-project', title: 'Existing project', discipline: 'Business & management', domain: '',
    problem: '', question: 'What did the original study ask?', setting: '', purpose: 'explore', data: 'existing',
    design: '', ethics: '', analysis: '', gap: '', gapStatus: 'idea',
    papers: [{ id: 'old-paper', title: 'Existing reference', authors: '', year: null, doi: null,
      journal: '', url: '', oa: null, source: 'OpenAlex', finding: 'Existing extraction', decision: 'include' }],
    searches: [], lessons: ['legacy'], updatedAt: at, createdAt: at,
  }] })).projects;
  assert.equal(project.question, 'What did the original study ask?');
  assert.equal(project.papers[0].finding, 'Existing extraction');
  assert.equal(project.papers[0].methods, '');
  assert.equal(project.experience, '');
  assert.deepEqual(project.needsReview, []);
});
test('DOI normalization and invalid inputs',()=>{assert.equal(normalizeDoi('https://doi.org/10.1234/ABC'),'10.1234/abc');assert.throws(()=>normalizeDoi('not a doi'));});
test('untrusted links cannot execute script',()=>{assert.equal(safeUrl('javascript:alert(1)'),undefined);assert.equal(safeUrl('https://example.org'),'https://example.org/');});
const fixture={results:[{id:'https://openalex.org/W1',display_name:'A paper',publication_year:2024,doi:'https://doi.org/10.1234/abc',authorships:[],primary_location:null,best_oa_location:null}]};
test('provider handles absent source and OA without inventing values',()=>{const p=parseWorks(fixture)[0];assert.equal(p.oa,null);assert.equal(p.journal,'Source not supplied');assert.equal(p.doi,'10.1234/abc');assert.throws(()=>parseWorks({results:[{id:42}]}));});

test('abstract metadata preserves source word positions and omits incomplete or malformed passages', () => {
  const papers = parseWorks({ results: [
    { ...fixture.results[0], abstract_inverted_index: { 'Students': [0], 'choose': [1], 'quiet': [2], 'spaces.': [3] } },
    { ...fixture.results[0], abstract_inverted_index: { 'Missing': [0], 'words': [2] } },
    { ...fixture.results[0], abstract_inverted_index: { 'Conflicting': [0], 'tokens': [0] } },
  ] });
  assert.equal(papers[0].abstract, 'Students choose quiet spaces.');
  assert.equal(papers[1].abstract, undefined);
  assert.equal(papers[2].abstract, undefined);
});
test('provider keeps a paper’s reading cost separate from a journal’s open-access publishing fee', () => {
  const openCopy = `https://example.org/open-copy?token=${'a'.repeat(1300)}`;
  const record = {
    ...fixture.results[0],
    publication_date: '2024-11-04',
    primary_location: { source: { display_name: 'Journal', type: 'journal' } },
    apc_list: { value: 700, currency: 'EUR', value_usd: 770 },
  };
  const [closed, open, feeFree, unavailable, conference] = parseWorks({ results: [
    { ...record, open_access: { is_oa: false } },
    { ...record, open_access: { is_oa: true, oa_url: openCopy } },
    { ...record, apc_list: { value: 0 } },
    { ...record, publication_date: '2024-02-30', apc_list: { value: -3, currency: '???' } },
    { ...record, primary_location: { source: { display_name: 'Proceedings', type: 'conference' } } },
  ] });
  assert.equal(closed.publicationDate, '2024-11-04');
  assert.equal(closed.readingCost, undefined);
  assert.deepEqual(closed.journalFee, {
    amount: 700, currency: 'EUR', usd: 770, source: 'OpenAlex', url: 'https://api.openalex.org/works/W1',
    checkedAt: closed.journalFee?.checkedAt,
  });
  assert.ok(Number.isFinite(Date.parse(closed.journalFee!.checkedAt!)));
  assert.equal(open.readingCost?.amount, 0);
  assert.equal(open.oa, openCopy);
  assert.equal(open.readingCost?.url, 'https://api.openalex.org/works/W1');
  const project = addPaper(createProject(), open);
  const backup = { schemaVersion: 1, exportedAt: new Date().toISOString(), projects: [project] };
  assert.equal(parseBackup(JSON.stringify(backup)).projects[0].papers[0].oa, openCopy);
  assert.equal(open.journalFee?.amount, 700);
  assert.equal(feeFree.journalFee?.usd, 0);
  assert.equal(feeFree.readingCost, undefined);
  assert.equal(unavailable.journalFee, undefined);
  assert.equal(unavailable.publicationDate, undefined);
  assert.equal(conference.journalFee, undefined);
});
test('DOI duplicate is not added; CSV formula cells are neutralized',()=>{const paper=parseWorks(fixture)[0];let p=createProject();p=addPaper(p,paper);p=addPaper(p,{...paper,id:'other'});assert.equal(p.papers.length,1);p.papers[0].notes='=HYPERLINK("evil")';assert.match(matrixCsv(p),/'=HYPERLINK/);});
test('a reviewed supporting claim can support a scoped gap and is included in the matrix export', () => {
  const project = createProject();
  assert.equal(updateProject(project, { gapStatus: 'evidence-supported candidate' }).gapStatus, 'needs-update');
  const at = new Date().toISOString();
  const paper = parseWorks(fixture)[0];
  project.gap = 'Evidence on commuter students at this campus is limited.';
  project.question = 'How do commuters choose study space?';
  project.papers = [{ ...paper, evidenceClaims: [{ id: crypto.randomUUID(), claimType: 'finding', claimText: 'Commuters were not sampled',
    evidenceLevel: 'full_text', locator: 'Page 4, Methods', interpretation: '', uncertainty: '', createdAt: at,
    reviewStatus: 'reviewed', reviewedAt: at, gapRole: 'supports' }] }];
  const supported = updateProject(project, { gapStatus: 'evidence-supported candidate' });
  assert.equal(supported.gapStatus, 'evidence-supported candidate');
  assert.match(matrixCsv(supported), /Commuters were not sampled.*Full text · Page 4, Methods/);
  assert.equal(updateProject(supported, { papers: [] }).gapStatus, 'needs-update');
  const revised = updateProject(supported, { question: 'How often do commuters use the campus?' });
  assert.equal(revised.gapStatus, 'needs-update');
  assert.equal(revised.papers[0].evidenceClaims?.[0].reviewStatus, 'needs_review');
});
test('router abstains, distinguishes disciplines and keeps reporting conditional',()=>{assert.equal(routeDesign('unknown','law'),null);assert.match(routeDesign('interpret','Law & governance')!.design,/legal/);assert.match(routeDesign('describe','Business & management')!.standard,/not a universal/);assert.match(routeDesign('describe','Health & pharmacy')!.standard,/epidemiology/);});
test('content has distinct disciplines and domains',()=>{assert.equal(new Set(disciplines.map(d=>d.name)).size,6);for(const d of disciplines)assert.ok(d.domains.length>=5);});
test('unsupported Boolean syntax rejected before network call',async()=>{await assert.rejects(searchPapers('climate AND health','',false),/Boolean/);});
test('quota failure explains safe fallback',async()=>{const old=globalThis.fetch;globalThis.fetch=async()=>new Response('',{status:429});try{await assert.rejects(searchPapers('climate health','',false),/free research service is at its limit/);}finally{globalThis.fetch=old;}});
test('search provenance records only the actual anonymous page and preserves the raw query', async t => {
  const fetch = t.mock.method(globalThis, 'fetch', async (request: string, options: RequestInit) => {
    const url = new URL(request);
    assert.equal(url.origin, 'https://api.openalex.org');
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      search: 'urban housing', per_page: '20', filter: 'from_publication_date:2024-01-01,is_oa:true',
    });
    assert.equal(options.credentials, 'omit');
    return Response.json({ ...fixture, meta: { count: 114 } }, { headers: {
      'X-Request-ID': 'test-id', 'X-RateLimit-Remaining': '960', 'X-RateLimit-Credits-Used': '10',
    } });
  });
  const { run, papers } = await runPaperSearch('  urban housing  ', '2024', true);
  assert.equal(fetch.mock.callCount(), 1);
  assert.equal(run.userQuery, '  urban housing  ');
  assert.equal(run.executedQuery, 'urban housing');
  assert.equal(run.mode, 'anonymous-first-page');
  assert.equal(run.resultCountReported, 114);
  assert.equal(run.cursorState, 'not-requested');
  assert.deepEqual(run.pages, [{ page: 1, requestedAt: run.startedAt, returnedCount: 1, requestId: 'test-id' }]);
  assert.equal(run.quota?.remainingCredits, 960);
  assert.equal(run.quota?.requestCredits, 10);
  assert.ok(searchRunSchema.safeParse(run).success);
  assert.equal(papers.length, 1);
});
test('search retains a rate-limit outcome and honors Retry-After without sending a fallback request', async t => {
  let now = Date.parse('2026-01-01T10:00:00Z');
  t.mock.method(Date, 'now', () => now);
  let reply = new Response('', { status: 429, headers: { 'Retry-After': '30', 'X-RateLimit-Remaining': '0' } });
  const fetch = t.mock.method(globalThis, 'fetch', async () => reply);
  await assert.rejects(runPaperSearch('climate adaptation', '', false), error => {
    assert.ok(error instanceof PaperSearchError);
    assert.equal(error.run?.error?.kind, 'rate-limit');
    assert.equal(error.run?.error?.status, 429);
    assert.equal(error.run?.quota?.retryAfterUntil, '2026-01-01T10:00:30.000Z');
    assert.equal(error.run?.pages[0].returnedCount, undefined);
    return true;
  });
  await assert.rejects(runPaperSearch('climate adaptation', '', false), error => {
    assert.ok(error instanceof PaperSearchError);
    assert.equal(error.run, undefined);
    return true;
  });
  assert.equal(fetch.mock.callCount(), 1);
  now += 30000;
  reply = Response.json(fixture);
  assert.equal((await runPaperSearch('climate adaptation', '', false)).papers.length, 1);
  assert.equal(fetch.mock.callCount(), 2);
});
test('an offline search reports that local projects remain available and sends no request', async t => {
  Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
  const fetch = t.mock.method(globalThis, 'fetch', async () => Response.json(fixture));
  try {
    await assert.rejects(runPaperSearch('climate adaptation', '', false), /project is available offline/);
    assert.equal(fetch.mock.callCount(), 0);
  } finally {
    Reflect.deleteProperty(navigator, 'onLine');
  }
});
test('paper citation ranking preserves zero, puts unavailable data last, and leaves saved order intact', () => {
  const [paper] = parseWorks(fixture);
  const zero = { ...paper, id: 'zero', fwci: 0 };
  const high = { ...paper, id: 'high', fwci: 2.6 };
  const unavailable = { ...paper, id: 'unavailable' };
  const library = [unavailable, zero, high];
  assert.deepEqual(orderPapers(library, 'impact').map(item => item.id), ['high', 'zero', 'unavailable']);
  assert.deepEqual(library.map(item => item.id), ['unavailable', 'zero', 'high']);
});
async function quartileFixture(url: string) {
  const file = /^\/data\/(journal-quartiles-[0-7]\.json)$/.exec(url)?.[1];
  return file ? new Response(await readFile(new URL(`../public/data/${file}`, import.meta.url), 'utf8')) : undefined;
}

test('literature matches ranked journals by ISSN and sorts before higher-cited unranked sources', async () => {
  const record = fixture.results[0];
  const published = (id: string, issn: string, citations: number) => ({ ...record, id, cited_by_count: citations,
    primary_location: { source: { display_name: 'Journal', type: 'journal', issn_l: issn, host_organization_name: 'Publisher' } } });
  const old = globalThis.fetch;
  globalThis.fetch = async input => await quartileFixture(String(input)) ?? Response.json({ results: [
    { ...record, id: 'unranked', cited_by_count: 500 }, published('q4', '0002-3035', 100),
    published('q1-low', '0272-4944', 0), published('q1-high', '0308-518X', 3),
  ] });
  try {
    const papers = orderPapers(await searchPapers('student housing', '', false), 'quartile');
    assert.deepEqual(papers.map(item => [item.id, item.journalQuartile?.quartile, item.citedByCount]), [
      ['q1-high', 'Q1', 3], ['q1-low', 'Q1', 0], ['q4', 'Q4', 100], ['unranked', undefined, 500],
    ]);
    assert.equal(papers[1].publisher, 'Publisher');
    assert.equal(papers[1].journalQuartile?.source, 'POSI');
  } finally { globalThis.fetch = old; }
});
test('journal lookup checks ISSN identity and retains provenance for shortlist sorting', async () => {
  assert.equal(normalizeIssn('ISSN 00280836'), '0028-0836');
  assert.throws(() => normalizeIssn('0028-0835'), /check digit/);
  const old = globalThis.fetch;
  let response = { id: 'https://openalex.org/S1', display_name: 'Nature', type: 'journal',
    issn_l: '0028-0836', summary_stats: { '2yr_mean_citedness': 22.1, h_index: 110 },
    apc_prices: [{ price: 700, currency: 'EUR' }], apc_usd: 770 };
  globalThis.fetch = async url => {
    const quartiles = await quartileFixture(String(url));
    if (quartiles) return quartiles;
    assert.equal(url, 'https://api.openalex.org/sources/issn:0028-0836');
    return Response.json(response);
  };
  try {
    const metrics = await checkJournalMetrics('0028-0836');
    assert.equal(metrics.citedness, 22.1);
    assert.equal(metrics.journalQuartile?.quartile, 'Q1');
    assert.deepEqual(metrics.journalFee, {
      amount: 700, currency: 'EUR', usd: 770, source: 'OpenAlex', url: 'https://api.openalex.org/sources/S1',
      checkedAt: metrics.journalFee?.checkedAt,
    });
    assert.ok(Number.isFinite(Date.parse(metrics.journalFee!.checkedAt!)));
    assert.equal(metrics.sourceId, 'https://openalex.org/S1');
    assert.ok(Number.isFinite(Date.parse(metrics.checkedAt)));
    const candidate = { title: 'Candidate', url: '', scope: '', cost: '', checks: [], verification: '' };
    assert.deepEqual(orderJournals([{ ...candidate, id: 'missing' }, { ...candidate, id: 'measured', metrics }], 'citedness').map(item => item.id), ['measured', 'missing']);
    response = { ...response, issn_l: '2041-1723' };
    await assert.rejects(checkJournalMetrics('0028-0836'), /matching this ISSN/);
  } finally { globalThis.fetch = old; }
});
