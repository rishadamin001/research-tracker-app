'use client';

import { Download, Plus, Search } from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react';
import { searchWebsiteUrl } from '@/lib/links';
import { addPaper, csvCell, matrixCsv, type Paper, type Project } from '@/lib/model';
import { continuePaperSearch, PaperSearchError, relatedPapers, runPaperSearch } from '@/lib/providers';
import { orderPapers, paperOrderLabels } from '@/lib/ranking';
import { openAlexSearch, searchRunSchema, type SearchRun } from '@/lib/search-provenance';
import { download } from '@/lib/storage';
import { External } from './External';
import { EvidenceClaims, evidenceLedgerCsv, GapEvidence, PaperScreening, ScreeningCriteria } from './EvidenceLedger';
import { canSupportGap, decisionLabels, findingSummary, type ScreeningEvent } from '@/lib/evidence-ledger';
import { OrderSelect, PaperImpact, PaperOrderHelp, PublicationIdentity, usePaperOrder } from './RankingControls';

interface EvidenceWorkspaceProps {
  project: Project;
  update: (patch: Partial<Project>) => void;
  notify: (message: string) => void;
  mode: 'discover' | 'screen' | 'extract';
  initialQuery?: string;
}

interface PaperSearchProps {
  project?: Project;
  update?: EvidenceWorkspaceProps['update'];
  notify: EvidenceWorkspaceProps['notify'];
  initialQuery?: string;
  openProjects: () => void;
}

function SourceLinks({ paper }: { paper: Paper }) {
  return (
    <div className="button-row">
      {paper.url && <External href={paper.url}>Open source</External>}
      {paper.oa && paper.oa !== paper.url && <External href={paper.oa}>Read open copy</External>}
      {!paper.url && !paper.oa && <External href={searchWebsiteUrl(paper.title)}>Find source by title</External>}
    </div>
  );
}

function SearchRunDetails({ run }: { run: SearchRun }) {
  return <details>
    <summary>Search details</summary>
    {run.userQuery !== run.executedQuery && <p>Entered query <code>{run.userQuery}</code></p>}
    <p>Executed query <code>{run.executedQuery}</code></p>
    <p>Provider filters {run.filters.length ? <code>{run.filters.join(', ')}</code> : 'None'}</p>
    <p>{run.provider} · {run.mode === 'anonymous-first-page' ? 'Anonymous public API' : 'Configured gateway'} · {run.pageSize} records per page · Basic page continuation, bounded to {openAlexSearch.maxPages} pages</p>
    {run.pages.map((page, index) => <p key={`${page.page}-${index}`}>Page {page.page} requested <time dateTime={page.requestedAt}>{new Date(page.requestedAt).toLocaleString()}</time>{page.returnedCount === undefined ? ' · no readable response' : ` · ${page.returnedCount} records returned`}{page.requestId && ` · Request ID ${page.requestId}`}{page.failure && ` · ${page.failure}`}</p>)}
    {run.stopReason && <p>Continuation state · {run.stopReason === 'provider-end' ? 'End of provider results reached at retrieval time' : run.stopReason === 'app-limit' ? '100-record app limit reached' : 'Stopped by you; you may resume'}</p>}
    <p>{run.error ? 'Ended' : 'Completed'} <time dateTime={run.completedAt}>{new Date(run.completedAt).toLocaleString()}</time>{run.resultCountReported !== undefined && ` · ${run.resultCountReported.toLocaleString()} matches reported by the provider`}</p>
    {run.error && <p>Outcome · {run.error.message}</p>}
    {run.quota?.remainingCredits !== undefined && <p>Provider credits remaining when checked · {run.quota.remainingCredits.toLocaleString()}{run.quota.dailyCredits !== undefined && ` of ${run.quota.dailyCredits.toLocaleString()}`}</p>}
    {run.quota?.resetsAt && <p>Daily allowance resets <time dateTime={run.quota.resetsAt}>{new Date(run.quota.resetsAt).toLocaleString()}</time></p>}
    {run.quota?.retryAfterUntil && <p>Provider asks you to wait until <time dateTime={run.quota.retryAfterUntil}>{new Date(run.quota.retryAfterUntil).toLocaleString()}</time></p>}
    <p>This is a bounded discovery search, not an exhaustive review. Cursor continuation requires a provider API key; this public app uses documented basic paging without one.</p>
    {run.parserVersion && <p>Atlas parser {run.parserVersion} · provider default relevance order. OpenAlex did not report a response schema version.</p>}
    <p>Atlas uses keyword queries. It rejects {run.unsupportedOperators.join(', ')}.</p>
    <p>Provider documentation checked <time dateTime={run.providerDocsDate}>{run.providerDocsDate}</time>.</p>
  </details>;
}

function SearchLog({ searches, reuseSearch }: { searches: Project['searches']; reuseSearch: (search: Project['searches'][number]) => void }) {
  return (
    <details className="panel">
      <summary>Search audit trail ({searches.length})</summary>
      {searches.length === 0 && <p>Search attempts will appear here.</p>}
      {searches.length > 0 && <div className="button-row"><button type="button" className="button secondary small" onClick={() => download('search-history.json', JSON.stringify({ format: 'research-atlas-search-log', exportedAt: new Date().toISOString(), searches }, null, 2), 'application/json')}>Export search JSON</button><button type="button" className="button secondary small" onClick={() => download('search-history.csv', [['Provider', 'Entered query', 'Executed query', 'Filters', 'Completed at', 'Retrieved', 'Reported matches', 'Page numbers', 'Outcome'], ...searches.map(item => [item.source, item.run?.userQuery ?? item.query, item.run?.executedQuery ?? item.query, item.run?.filters.join(',') ?? item.filters, item.date, item.count, item.run?.resultCountReported, item.run?.pages.map(page => `${page.page}:${page.returnedCount ?? 'failed'}`).join(';'), item.run?.error?.message ?? 'completed'])].map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8')}>Export search CSV</button></div>}
      {searches.slice().reverse().map((search, index) => (
        <div className="audit" key={search.run?.id ?? `${search.date}-${index}`}>
          <p>{new Date(search.date).toLocaleString()} · {search.source} · “{search.query}” · {search.filters} · {search.run?.error ? 'Search failed' : `${search.count} results`}</p>
          {search.run && <SearchRunDetails run={search.run} />}
          <button type="button" className="text-button" onClick={() => reuseSearch(search)}>{search.run ? 'Reuse search terms and filters' : 'Reuse search terms'}</button>
        </div>
      ))}
      <p className="muted">This log records the searches run here. A systematic review may need additional databases and full search strategies.</p>
    </details>
  );
}

const searchHistoryKey = 'research-atlas-search-history-v1';
function readLocalSearches(): Project['searches'] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(searchHistoryKey) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.slice(-50).flatMap(item => {
      const parsed = searchRunSchema.safeParse(item);
      if (!parsed.success) return [];
      const run = parsed.data;
      return [{ query: run.executedQuery, source: run.provider, date: run.completedAt, count: run.resultIds?.length ?? run.pages.reduce((sum, page) => sum + (page.returnedCount ?? 0), 0), filters: run.filters.join(', '), run }];
    });
  } catch { return []; }
}

const publishedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

function PaperPublished({ paper }: { paper: Paper }) {
  return paper.publicationDate
    ? <time dateTime={paper.publicationDate}>{publishedOn.format(new Date(paper.publicationDate))}</time>
    : paper.year ?? 'Year unknown';
}

function Discover({ project, update, notify, initialQuery, openProjects }: Omit<PaperSearchProps, 'openProjects'> & { openProjects?: PaperSearchProps['openProjects'] }) {
  const [query, setQuery] = useState(initialQuery ?? (openProjects ? '' : project?.searches.at(-1)?.query ?? ''));
  const [year, setYear] = useState('');
  const [openAccess, setOpenAccess] = useState(false);
  const [results, setResults] = useState<{ run: SearchRun; papers: Paper[] } | null>(null);
  const [failedRun, setFailedRun] = useState<SearchRun>();
  const [localSearches, setLocalSearches] = useState(readLocalSearches);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = usePaperOrder();
  const [hideSaved, setHideSaved] = useState(false);
  const request = useRef<AbortController | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, []);

  function recordRun(run: SearchRun) {
    const searches = project?.searches ?? localSearches;
    const item = { query: run.executedQuery, source: run.provider, date: run.completedAt, count: run.resultIds?.length ?? run.pages.reduce((sum, page) => sum + (page.returnedCount ?? 0), 0), filters: run.filters.join(' · '), run };
    const next = [...searches.filter(item => item.run?.id !== run.id), item];
    if (project && update && (searches.length < 1000 || searches.some(item => item.run?.id === run.id))) update({ searches: next, gapStatus: !run.error && project.gapStatus === 'idea' ? 'search underway' : project.gapStatus });
    if (!project) {
      setLocalSearches(next.slice(-50));
      try { localStorage.setItem(searchHistoryKey, JSON.stringify(next.slice(-50).map(item => item.run))); } catch { notify('Search history could not be saved on this browser. Export the search log to keep a copy.'); }
    }
  }

  async function search(terms: string, fromYear = year, onlyOpen = openAccess) {
    if (project && project.searches.length >= 1000) {
      setError('This project has reached its search-log limit. Export your work before starting a new project for additional searches.');
      return;
    }

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    setFailedRun(undefined);


    try {
      const { papers, run } = await runPaperSearch(terms, fromYear, onlyOpen, controller.signal);
      if (request.current !== controller || controller.signal.aborted) return;

      const earlier = [...(project?.searches ?? localSearches)].reverse().find(item => !item.run?.error && item.run?.executedQuery === run.executedQuery && item.run?.filters.join(',') === run.filters.join(',') && item.run.resultIds);
      setNewIds(earlier?.run?.resultIds ? new Set(papers.filter(paper => !earlier.run!.resultIds!.includes(paper.id)).map(paper => paper.id)) : new Set());
      setResults({ run, papers });
      recordRun(run);
    } catch (failure) {
      if (request.current !== controller || controller.signal.aborted) return;
      if (failure instanceof PaperSearchError) {
        setError(failure.message);
        if (failure.run) {
          setFailedRun(failure.run);
          recordRun(failure.run);
        }
      } else {
        setError('The search could not be completed. Try again or use the Crossref link below.');
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  async function loadNext() {
    if (!results || busy || !results.run.nextPage) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true); setError(''); setFailedRun(undefined);
    try {
      const next = await continuePaperSearch(results.run, controller.signal);
      if (request.current !== controller || controller.signal.aborted) return;
      const unique = new Map([...results.papers, ...next.papers].map(paper => [paper.id, paper]));
      setResults({ run: next.run, papers: [...unique.values()] });
      recordRun(next.run);
    } catch (failure) {
      if (request.current !== controller || controller.signal.aborted) return;
      setError(failure instanceof Error ? failure.message : 'Could not load this page. Earlier results are still available.');
      if (failure instanceof PaperSearchError && failure.run) { setFailedRun(failure.run); setResults({ ...results, run: failure.run }); recordRun(failure.run); }
    } finally {
      if (request.current === controller) { request.current = null; setBusy(false); }
    }
  }

  const startTopicSearch = useEffectEvent((topic: string) => { void search(topic); });
  useEffect(() => {
    if (initialQuery) startTopicSearch(initialQuery);
  }, [initialQuery]);

  const savedPapers = project?.papers ?? [];
  const savedPapersById = new Map(savedPapers.map(paper => [paper.id, paper]));
  const savedDois = new Set(savedPapers.flatMap(paper => paper.doi ? [paper.doi.toLowerCase()] : []));
  const libraryFull = savedPapers.length >= 2000;
  const isSaved = (paper: Paper) => savedPapersById.has(paper.id) || (paper.doi !== null && savedDois.has(paper.doi.toLowerCase()));
  const visible = results ? orderPapers(results.papers.filter(paper => !hideSaved || !isSaved(paper)), order) : [];

  return (
    <>
      <section className="panel search-panel">
        <h2>{openProjects ? 'Find papers by topic, title, or keyword' : 'Find literature for your question'}</h2>
        {openProjects ? (
          <p>{project ? <>Searches and saved papers go to <strong>{project.title}</strong>.</> : 'Browse freely. Choose a project when you want to save papers.'}</p>
        ) : project?.question && <p><strong>Project question</strong><br />{project.question}</p>}
        <details>
          <summary>How to build a useful search</summary>
          <p>Pick two or three ideas from your question. Try a short keyword phrase such as “student housing insecurity” and record alternative terms in separate searches. Save promising sources and read the full text before relying on a finding.</p>
          <p>This search starts with 20 OpenAlex records. Load additional pages when useful, up to 100 records per search. For a systematic review, document the sources you searched and what they might miss.</p>
          <External href={openAlexSearch.docsUrl}>OpenAlex advanced search guidance</External>
        </details>
        <form role="search" aria-label="Search for research papers" onSubmit={event => { event.preventDefault(); void search(query); }}>
          <div className="search-row">
            <Search size={21} aria-hidden="true" />
            <input
              aria-label="Search literature"
              ref={searchInput}
              placeholder="Try student housing insecurity"
              value={query}
              onChange={event => setQuery(event.target.value)}
              minLength={3}
              maxLength={300}
              required
            />
            <button type="submit" className="button" disabled={busy}>{busy ? 'Searching…' : 'Search papers'}</button>
          </div>
          <div className="filter-row">
            <label>
              Published from
              <input placeholder="Any year" value={year} onChange={event => setYear(event.target.value)} maxLength={4} inputMode="numeric" />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={openAccess} onChange={event => setOpenAccess(event.target.checked)} />
              Open access only
            </label>
            <span>OpenAlex · {openAlexSearch.pageSize} per page · up to 100 retrieved</span>
          </div>
        </form>
        <p className="muted">The search sends your keywords to OpenAlex. Leave out confidential project or participant details.</p>
        <External href={searchWebsiteUrl(query)}>Search on Crossref</External>
      </section>

      {error && <section className="panel" aria-label="Search error"><p className="error" role="alert">{error}</p>{failedRun && <SearchRunDetails run={failedRun} />}</section>}
      {libraryFull && <p className="info-bar">Your project has reached its 2,000-source limit. You can still review and export the saved library.</p>}
      {results && (
        <section className="panel" aria-label="Search result controls">
          <p role="status">{visible.length} of {results.papers.length} results shown for “{results.run.executedQuery}”{project && ` · ${savedPapers.length} in your library`}</p>
          <p className="muted">{results.run.pages.filter(page => page.returnedCount !== undefined).length} pages retrieved · checked {new Date(results.run.completedAt).toLocaleString()}. Ranking applies to retrieved records only.</p>
          {newIds.size > 0 && <p role="status">{newIds.size} newly discovered records compared with your previous search snapshot. These may include older publications.</p>}
          <div className="button-row">
            {results.run.nextPage && results.run.stopReason !== 'user-stopped' && <button type="button" className="button secondary" disabled={busy || results.run.quota?.remainingCredits === 0} onClick={() => void loadNext()}>Load next page</button>}
            {results.run.nextPage && <button type="button" className="text-button" disabled={busy} onClick={() => { const run = { ...results.run, stopReason: results.run.stopReason === 'user-stopped' ? undefined : 'user-stopped' as const }; setResults({ ...results, run }); recordRun(run); }}>{results.run.stopReason === 'user-stopped' ? 'Resume page loading' : 'Stop here'}</button>}
            <button type="button" className="text-button" disabled={busy} onClick={() => { const fromYear = results.run.filters.find(filter => filter.startsWith('from_publication_date:'))?.split(':')[1]?.slice(0, 4) ?? ''; setQuery(results.run.userQuery); setYear(fromYear); setOpenAccess(results.run.filters.includes('is_oa:true')); void search(results.run.userQuery, fromYear, results.run.filters.includes('is_oa:true')); }}>Refresh this search</button>
          </div>
          {results.run.stopReason === 'app-limit' && <p>Stopped at the 100-record app limit. Refine the query or continue on the official provider website.</p>}
          <SearchRunDetails run={results.run} />
          <OrderSelect label="Sort papers" labels={paperOrderLabels} order={order} onChange={setOrder} />
          {project && <label className="checkbox"><input type="checkbox" checked={hideSaved} onChange={event => setHideSaved(event.target.checked)} /> Hide saved papers</label>}
          <PaperOrderHelp />
          <details>
            <summary>What could I pay to read or publish?</summary>
            <p>“Free open copy” means an open version is available. For other papers, the publisher or your library can confirm reading access and any price. A journal publishing fee is a separate charge to authors for publishing open access. It is a listed estimate. The journal can confirm current prices, waivers, and options for publishing through a subscription route.</p>
          </details>
          {!project && openProjects && visible.length > 0 && <button type="button" className="text-button" onClick={openProjects}>Open My projects to save papers</button>}
        </section>
      )}
      {results?.papers.length === 0 && <p className="panel">Try a broader phrase or a different source. An empty result set cannot establish a gap in the literature.</p>}
      {results && results.papers.length > 0 && !visible.length && <p className="panel">All of these results are in your library. Turn off Hide saved papers to see them.</p>}
      {visible.map(paper => {
        const saved = isSaved(paper);
        const savedPaper = savedPapersById.get(paper.id);
        const canRefreshReferences = savedPaper && savedPaper.referenceIds === undefined && paper.referenceIds !== undefined;
        const canRefreshMetrics = savedPaper && (savedPaper.fwci !== paper.fwci || savedPaper.citedByCount !== paper.citedByCount || savedPaper.isRetracted !== paper.isRetracted
          || (paper.journalQuartile && (savedPaper.journalQuartile?.year !== paper.journalQuartile.year || savedPaper.journalQuartile?.quartile !== paper.journalQuartile.quartile))
          || savedPaper.publisher !== paper.publisher || savedPaper.venueType !== paper.venueType || savedPaper.publicationDate !== paper.publicationDate || savedPaper.oa !== paper.oa
          || savedPaper.readingCost?.amount !== paper.readingCost?.amount || savedPaper.readingCost?.currency !== paper.readingCost?.currency
          || savedPaper.journalFee?.amount !== paper.journalFee?.amount || savedPaper.journalFee?.currency !== paper.journalFee?.currency
          || savedPaper.journalFee?.usd !== paper.journalFee?.usd);
        return (
          <article className="panel paper" key={paper.id}>
            <span className="tag">{paper.source} · <PaperPublished paper={paper} /></span>
            {newIds.has(paper.id) && <span className="tag">New to this search snapshot</span>}
            {paper.oa && <span className="oa-badge">Open-access link</span>}
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <h3>{paper.title}</h3>
            <p>{paper.authors || 'Authors not supplied'}</p>
            <PaperImpact paper={paper} />
            {paper.doi && <p className="muted">DOI {paper.doi}</p>}
            <RelatedDiscovery paper={paper} project={project} update={update} notify={notify} />
            <div className="paper-bottom">
              <SourceLinks paper={paper} />
              {project && update && <button
                type="button"
                className="button secondary small"
                disabled={saved || libraryFull}
                aria-label={saved ? `Saved: ${paper.title}` : 'Save paper'}
                onClick={() => {
                  const next = addPaper(project, paper);
                  if (next === project) return;
                  update({ papers: next.papers });
                  notify('Paper saved to your project library and evidence matrix.');
                }}
              >
                <Plus size={15} aria-hidden="true" /> {saved ? 'Saved' : 'Save paper'}
              </button>}
              {update && canRefreshReferences && (
                <button type="button" className="button secondary small" onClick={() => {
                  update({ papers: savedPapers.map(item => item.id === paper.id ? { ...item, referenceIds: paper.referenceIds } : item) });
                  notify('Citation links updated for this saved source.');
                }}>Refresh citation links</button>
              )}
              {update && canRefreshMetrics && (
                <button type="button" className="button secondary small" onClick={() => {
                  const { fwci, citedByCount, isRetracted, workType, journal, journalQuartile, publisher, venueType, issns, inDoaj, publicationDate, oa, readingCost, journalFee } = paper;
                  update({ papers: savedPapers.map(item => item.id === paper.id ? { ...item, fwci, citedByCount, isRetracted, workType, journal, journalQuartile: journalQuartile ?? item.journalQuartile, publisher, venueType, issns, inDoaj, publicationDate, oa, readingCost, journalFee } : item) });
                  notify('Citation, publication, and price information refreshed.');
                }}>Refresh paper metrics</button>
              )}
            </div>
          </article>
        );
      })}
      <SearchLog searches={project?.searches ?? localSearches} reuseSearch={search => {
        setQuery(search.query);
        if (search.run) {
          const yearFilter = search.run.filters.find(filter => filter.startsWith('from_publication_date:'));
          setYear(yearFilter?.split(':')[1]?.slice(0, 4) ?? '');
          setOpenAccess(search.run.filters.includes('is_oa:true'));
        }
        searchInput.current?.focus();
      }} />
      {!project && <p className="muted">Recent search records (up to 50) stay on this browser. They contain your search terms; export them above or clear them here. <button type="button" className="text-button" onClick={() => { try { localStorage.removeItem(searchHistoryKey); setLocalSearches([]); } catch { notify('Could not clear search history. Your browser may have blocked storage access.'); } }}>Clear search history</button></p>}
    </>
  );
}

function RelatedDiscovery({ paper, project, update, notify }: { paper: Paper; project?: Project; update?: EvidenceWorkspaceProps['update']; notify: EvidenceWorkspaceProps['notify'] }) {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [relation, setRelation] = useState('');
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  if (!/^https:\/\/openalex\.org\/W\d+$/.test(paper.id)) return null;
  async function explore(kind: 'references' | 'citations') {
    controller.current?.abort();
    const request = new AbortController(); controller.current = request;
    setBusy(true); setMessage('');
    try {
      const found = await relatedPapers(paper, kind, request.signal);
      if (controller.current !== request || request.signal.aborted) return;
      setPapers(orderPapers(found, 'quartile'));
      setRelation(kind === 'references' ? 'References from this paper' : 'Papers citing this paper');
      setMessage(found.length ? `Showing ${found.length} records checked ${new Date().toLocaleString()}.` : 'No matching citation records returned. This does not establish that no related research exists.');
    } catch (failure) { if (!request.signal.aborted) setMessage(failure instanceof Error ? failure.message : 'Citation discovery could not be loaded.'); }
    finally { if (controller.current === request) { setBusy(false); controller.current = null; } }
  }
  return <details>
    <summary>Explore related papers</summary>
    <p>Search beyond the saved-library map. Clicking sends this OpenAlex work ID or up to 20 reference IDs to OpenAlex. Results are discovery suggestions; read and screen them before using them as evidence.</p>
    <div className="button-row"><button type="button" className="button secondary small" disabled={busy || !paper.referenceIds?.length} onClick={() => void explore('references')}>Find references</button><button type="button" className="button secondary small" disabled={busy} onClick={() => void explore('citations')}>Find citing papers</button></div>
    {busy && <p role="status">Loading citation links…</p>}{message && <p role="status">{message}</p>}
    {relation && <h4>{relation}</h4>}
    {papers.map(item => <section className="audit" key={item.id}><h5>{item.title}</h5><PublicationIdentity title={item.journal} publisher={item.publisher} type={item.venueType} /><PaperImpact paper={item} /><SourceLinks paper={item} />{project && update && <button type="button" className="button secondary small" disabled={project.papers.length >= 2000 || project.papers.some(saved => saved.id === item.id || !!saved.doi && saved.doi === item.doi)} onClick={() => { const next = addPaper(project, item); update({ papers: next.papers }); notify('Related source saved. Screen it before treating it as evidence.'); }}>Save related paper</button>}</section>)}
  </details>;
}

export function PaperSearch(props: PaperSearchProps) {
  return <Discover {...props} />;
}

function PublicationTimeline({ papers }: { papers: Paper[] }) {
  if (!papers.length) return null;
  const years = new Map<number, number>();
  let unknown = 0;
  for (const paper of papers) {
    if (paper.year === null) unknown++;
    else years.set(paper.year, (years.get(paper.year) ?? 0) + 1);
  }
  const counts = [...years.entries()].sort(([left], [right]) => right - left);
  const maximum = Math.max(1, ...years.values(), unknown);

  return (
    <details className="panel">
      <summary>Publication timeline</summary>
      <p>Explore the publication years in your saved library. The bars count saved records. Citation relationships require separate data.</p>
      <ul>
        {counts.map(([year, count]) => (
          <li key={year}>{year} · {count} <meter min={0} max={maximum} value={count} aria-label={`${count} saved papers from ${year}`} /></li>
        ))}
        {unknown > 0 && <li>Year unavailable · {unknown} <meter min={0} max={maximum} value={unknown} aria-label={`${unknown} saved papers with unknown year`} /></li>}
      </ul>
    </details>
  );
}

function CitationNeighborhood({ papers }: { papers: Paper[] }) {
  const [selectedId, setSelectedId] = useState('');
  if (!papers.length) return null;
  const selected = papers.find(paper => paper.id === selectedId) ?? papers[0];
  const outgoingIds = new Set(selected.referenceIds);
  const citing = papers.filter(paper => paper.id !== selected.id && paper.referenceIds?.includes(selected.id));
  const cited = papers.filter(paper => paper.id !== selected.id && outgoingIds.has(paper.id));
  const neighbors = [
    { label: 'Saved papers that cite this source', papers: citing },
    { label: 'Saved papers cited by this source', papers: cited },
  ];

  return (
    <details className="panel">
      <summary>Citation connections</summary>
      <p>Choose a source to see which papers in your library cite it and which papers it cites. The map uses up to 500 matched references from each OpenAlex record.</p>
      {selected.referenceIds === undefined && <p className="muted">This saved record has no outgoing citation data. Search for it again to refresh its citation links if OpenAlex supplies them.</p>}
      <label className="field">
        <span>Focus source</span>
        <select value={selected.id} onChange={event => setSelectedId(event.target.value)}>
          {papers.map(paper => <option key={paper.id} value={paper.id}>{paper.title}</option>)}
        </select>
      </label>
      <div className="two-col">
        {neighbors.map(neighborhood => (
          <section className="recommendation" key={neighborhood.label}>
            <h3>{neighborhood.label}</h3>
            {neighborhood.papers.length ? (
              <ul>
                {neighborhood.papers.map(paper => (
                  <li key={paper.id}><button type="button" className="text-button" onClick={() => setSelectedId(paper.id)}>{paper.title}</button></li>
                ))}
              </ul>
            ) : <p>No matches in your saved library.</p>}
          </section>
        ))}
      </div>
      <External href="https://help.openalex.org/data/works/citations/">How OpenAlex matches citations</External>
    </details>
  );
}

function PaperPanel({ title, detail, children }: { title: string; detail: ReactNode; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return <details className="panel matrix-paper" onToggle={event => {
    if (event.target === event.currentTarget) setExpanded(event.currentTarget.open);
  }}>
    <summary><span><strong>{title}</strong><small>{detail}</small></span></summary>
    {expanded && <div className="lesson-body">{children}</div>}
  </details>;
}

function Screen({ project, update }: Pick<EvidenceWorkspaceProps, 'project' | 'update'>) {
  const [filter, setFilter] = useState<Paper['decision'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [order, setOrder] = usePaperOrder();
  const reviewed = project.papers.filter(paper => (paper.decision === 'include' || paper.decision === 'exclude') && paper.reason.trim()).length;
  const criteria = project.screeningCriteria ?? [];
  const terms = query.trim().toLowerCase();
  const shown = orderPapers(project.papers.filter(paper =>
    (filter === 'all' || paper.decision === filter) &&
    (!terms || [paper.title, paper.authors, paper.journal, paper.doi].some(value => value?.toLowerCase().includes(terms))),
  ), order);

  function recordDecision(paper: Paper, event: ScreeningEvent) {
    const note = event.decision === 'unreviewed'
      ? `Reopened screening for “${paper.title.slice(0, 500)}”.`
      : `${decisionLabels[event.decision]} “${paper.title.slice(0, 500)}”. Reason: ${event.reason.slice(0, 18000)}`;
    update({
      papers: project.papers.map(item => item.id === paper.id ? {
        ...item, decision: event.decision, reason: event.reason, screeningDraft: undefined, screeningEvents: [...(item.screeningEvents ?? []), event],
      } : item),
      decisions: [...project.decisions.slice(-299), { at: event.at, note }],
    });
  }

  return (
    <>
      <section className="panel">
        <h2>Screen your saved sources</h2>
        <p>{reviewed} of {project.papers.length} saved sources have an inclusion or exclusion decision and reason.</p>
        <details>
          <summary>How to screen a source</summary>
          <p>Apply the same inclusion and exclusion rules to each source. Use Maybe when the title and abstract leave you unsure. Record a specific reason with each decision so you can review it later.</p>
          <External href="https://www.prisma-statement.org/prisma-2020-flow-diagram">PRISMA flow diagram for systematic reviews</External>
        </details>
        {!!project.papers.length && <>
          <label className="field"><span>Find in saved literature</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Title, author, journal, or DOI" /></label>
          <label className="field">
            <span>Show sources</span>
            <select value={filter} onChange={event => setFilter(event.target.value as typeof filter)}>
              <option value="all">All saved sources</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="include">Included</option>
              <option value="exclude">Excluded</option>
              <option value="maybe">Maybe</option>
            </select>
          </label>
          <OrderSelect label="Sort saved papers" labels={paperOrderLabels} order={order} onChange={setOrder} />
          <p role="status">{shown.length} of {project.papers.length} saved sources shown</p>
          <PaperOrderHelp />
        </>}
      </section>
      <ScreeningCriteria criteria={criteria} onChange={screeningCriteria => update({ screeningCriteria })} />
      {project.papers.length === 0 && <p className="panel">Save a paper in literature discovery to start screening.</p>}
      {project.papers.length > 0 && !shown.length && <p className="panel">No saved sources match this filter.</p>}
      {shown.map(paper => (
        <PaperPanel key={paper.id} title={paper.title} detail={<><PaperPublished paper={paper} /> · {decisionLabels[paper.decision]}{paper.decision !== 'unreviewed' && !paper.reason.trim() ? ' · Reason needed' : ''}</>}>
            <p>{paper.authors || 'Authors not supplied'}</p>
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <PaperImpact paper={paper} />
            <SourceLinks paper={paper} />
            <PaperScreening paper={paper} criteria={criteria} onDraft={screeningDraft => update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, screeningDraft } : item) })} onRecord={event => recordDecision(paper, event)} />
            <button type="button" className="text-button danger" onClick={() => {
              if (window.confirm('Remove this paper, its screening history, and its saved evidence notes?')) {
                update({ papers: project.papers.filter(item => item.id !== paper.id) });
              }
            }}>Remove paper</button>
        </PaperPanel>
      ))}
      <CitationNeighborhood papers={project.papers} />
      <PublicationTimeline papers={project.papers} />
    </>
  );
}

const extractionFields = [
  { key: 'researchProblem', label: 'Research problem', hint: 'What question or problem is this study trying to solve?' },
  { key: 'methods', label: 'Methods and sample', hint: 'Record the design, sample, and analysis used.' },
  { key: 'dataset', label: 'Dataset or evidence', hint: 'Name the source, population or setting, and the period covered.' },
  { key: 'finding', label: 'Extracted finding', hint: 'Summarize what the authors reported in your own words.' },
  { key: 'limitations', label: 'Limitations', hint: 'Record weaknesses or limits the authors identify.' },
  { key: 'locator', label: 'Evidence level and page / section', hint: 'For example, full text, page 8, Table 2.' },
  { key: 'notes', label: 'Your notes', hint: 'Keep your interpretation separate from the authors’ finding.' },
] as const;

function Extract({ project, update }: Pick<EvidenceWorkspaceProps, 'project' | 'update'>) {
  const [order, setOrder] = usePaperOrder();
  const ordered = orderPapers(project.papers, order);
  const active = ordered.filter(paper => paper.decision !== 'exclude');
  const supported = canSupportGap(project);

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <h2>Evidence matrix</h2>
          <div className="button-row">
            <button type="button" className="button secondary" disabled={!project.papers.length} onClick={() => download('literature-matrix.csv', matrixCsv({ ...project, papers: ordered }), 'text/csv;charset=utf-8')}>
              <Download size={16} aria-hidden="true" /> Export CSV
            </button>
            {ordered.some(paper => paper.evidenceClaims?.length) && <button type="button" className="button secondary" onClick={() => download('evidence-ledger.csv', evidenceLedgerCsv({ ...project, papers: ordered }), 'text/csv;charset=utf-8')}>Export evidence claims</button>}
          </div>
        </div>
        <details>
          <summary>How to extract comparable evidence</summary>
          <p>Compare papers that ask similar questions. Look for patterns across methods and datasets, and note disagreements or gaps. Record the page or section you checked, or indicate if you only read the abstract.</p>
        </details>
        {project.papers.length > 0 && <OrderSelect label="Sort evidence" labels={paperOrderLabels} order={order} onChange={setOrder} />}
        <p className="muted">The matrix displays included, maybe and unreviewed sources. The export includes every saved record and its screening decision.</p>
        {active.length === 0 ? <p>Save or include a source to populate the matrix.</p> : (
          <div style={{ overflowX: 'auto' }} role="region" aria-label="Evidence comparison table" tabIndex={0}>
            <table style={{ width: '100%', textAlign: 'left', borderSpacing: '12px', tableLayout: 'fixed', minWidth: '56rem', overflowWrap: 'anywhere' }}>
              <caption>Compare {active.length} sources</caption>
              <thead><tr><th scope="col">Source</th><th scope="col">Problem</th><th scope="col">Methods</th><th scope="col">Dataset</th><th scope="col">Finding</th><th scope="col">Limitations</th><th scope="col">Locator</th></tr></thead>
              <tbody>
                {active.map(paper => {
                  const finding = findingSummary(paper);
                  return <tr key={paper.id}>
                    <th scope="row">{paper.title}<br /><small>{decisionLabels[paper.decision]}</small></th>
                    <td>{paper.researchProblem || '—'}</td>
                    <td>{paper.methods || '—'}</td>
                    <td>{paper.dataset || '—'}</td>
                    <td>{finding.text || '—'}</td>
                    <td>{paper.limitations || '—'}</td>
                    <td>{finding.locator || '—'}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {active.map(paper => (
        <PaperPanel key={paper.id} title={`Edit notes for ${paper.title}`} detail={<><PaperPublished paper={paper} /> · {decisionLabels[paper.decision]}</>}>
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <PaperImpact paper={paper} />
            <SourceLinks paper={paper} />
            {extractionFields.map(({ key, label, hint }) => (
              <label className="field" key={key}>
                <span>{label}</span>
                <textarea
                  rows={3}
                  maxLength={20000}
                  value={paper[key] ?? ''}
                  placeholder={hint}
                  onChange={event => update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, [key]: event.target.value } : item) })}
                />
              </label>
            ))}
            <EvidenceClaims paper={paper} onChange={evidenceClaims => update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, evidenceClaims } : item) })} />
        </PaperPanel>
      ))}
      <section className="panel">
        <h2>Document a possible research gap</h2>
        <p>Compare the evidence you have reviewed. State where findings agree, differ, or leave a question unresolved. Describe the limits of your search and the records that support or challenge the claim.</p>
        <label className="field">
          <span>Candidate gap and supporting / conflicting evidence</span>
          <textarea rows={5} maxLength={20000} value={project.gap} onChange={event => update({ gap: event.target.value })} placeholder="Within the searches I ran, these sources agree on … but leave … unclear." />
        </label>
        <GapEvidence papers={project.papers} />
        <h3>What have you searched?</h3>
        <p>{project.searches.length ? `${project.searches.length} recorded search attempts. Open the search audit trail in Discover literature to inspect terms, filters and outcomes.` : 'Completed search attempts will appear in the Discover literature audit trail.'}</p>
        <label className="field"><span>What has not been searched?</span><textarea maxLength={20000} rows={3} value={project.gapSearchLimits ?? ''} onChange={event => update({ gapSearchLimits: event.target.value })} placeholder="For example, other languages, years, databases, or conference proceedings." /></label>
        <label className="field">
          <span>Review state</span>
          <select value={project.gapStatus} onChange={event => update({ gapStatus: event.target.value as Project['gapStatus'] })}>
            <option value="idea">Provisional idea</option>
            <option value="search underway">Search underway</option>
            <option value="evidence-supported candidate" disabled={!supported}>Evidence-supported candidate</option>
            <option value="human-reviewed candidate" disabled={!supported}>Human-reviewed candidate</option>
            <option value="contradicted">Contradicted by evidence</option>
            <option value="needs-update">Needs review</option>
          </select>
        </label>
        {!supported && <p className="muted">Write a candidate gap and link at least one reviewed supporting claim from a source you kept. Use evidence beyond bibliographic metadata.</p>}
        <p className="muted">This records your review state. A claim of novelty requires a thorough search and human judgment.</p>
      </section>
    </>
  );
}

export function EvidenceWorkspace({ mode, ...props }: EvidenceWorkspaceProps) {
  if (mode === 'discover') return <Discover key={props.project.id} {...props} />;
  if (mode === 'screen') return <Screen key={props.project.id} {...props} />;
  return <Extract key={props.project.id} {...props} />;
}
