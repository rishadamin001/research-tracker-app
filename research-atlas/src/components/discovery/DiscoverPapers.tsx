'use client';

import { Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { scholarlySearchLinks, searchWebsiteUrl } from '@/lib/links';
import { addPaper, type Paper } from '@/lib/model';
import { PaperSearchError } from '@/lib/providers';
import { continuePublicationSearch, runPublicationSearch, searchProviders, searchYear, searchOpenAccess } from '@/lib/search-publications';
import { orderPapers, paperOrderLabels } from '@/lib/ranking';
import { openAlexSearch, type SearchRun, type SearchProvider } from '@/lib/search-provenance';
import { officialPublicationSearchUrl, searchFilterChoices, searchOptionsFromRun, type SearchOptions } from '@/lib/search-options';
import { External } from '@/components/shared/External';
import { OrderSelect, PaperImpact, PaperOrderHelp, PublicationIdentity, usePaperOrder } from '@/components/shared/publication/RankingControls';
import type { PaperSearchProps } from '@/components/evidence/evidence-workspace-types';
import { readLocalSearches, searchHistoryKey } from './local-search-history';
import { SearchRunDetails } from './SearchRunDetails';
import { PaperPublished } from './PaperPublished';
import { RelatedDiscovery } from './RelatedDiscovery';
import { DiscoverySourceLinks } from './DiscoverySourceLinks';
import { HelpPopover } from '@/components/shared/HelpPopover';
import { AtlasDialog } from '@/components/shared/AtlasDialog';
import { showResearchHint } from '@/components/onboarding/researchHints';
import { SearchTools, searchToolNames, type SearchTool } from './SearchTools';
import { SearchLog } from './SearchLog';
import './paper-search.css';

function newSearchPapers(papers: Paper[], previouslySeen?: ReadonlySet<string>) {
  const seen = new Set(previouslySeen);
  const newPapers = papers.filter(paper => {
    const id = `id:${paper.id}`;
    const doi = paper.doi ? `doi:${paper.doi.toLowerCase()}` : null;
    const duplicate = seen.has(id) || (doi !== null && seen.has(doi));
    seen.add(id);
    if (doi) seen.add(doi);
    return !duplicate;
  });
  return { papers: newPapers, seen };
}

export function DiscoverPapers({ project, update, notify, initialQuery, initialRun, openProjects, onCreateForPaper, onNote, onScreen }: Omit<PaperSearchProps, 'openProjects'> & { openProjects?: PaperSearchProps['openProjects'] }) {
  const [tool, setTool] = useState<SearchTool>();
  const closeTool=useCallback(()=>setTool(undefined),[]);
  const [preview, setPreview] = useState<Paper>();
  const [query, setQuery] = useState(initialRun?.userQuery ?? initialQuery ?? (openProjects ? '' : project?.searches.at(-1)?.query ?? ''));
  const [provider, setProvider] = useState<SearchProvider>(initialRun?.provider ?? 'OpenAlex');
  const [year, setYear] = useState(searchYear(initialRun));
  const [openAccess, setOpenAccess] = useState(searchOpenAccess(initialRun));
  const [documentType, setDocumentType] = useState<SearchOptions['documentType']>(searchOptionsFromRun(initialRun).documentType);
  const [sourceType, setSourceType] = useState<SearchOptions['sourceType']>(searchOptionsFromRun(initialRun).sourceType);
  const [results, setResults] = useState<{ run: SearchRun; papers: Paper[]; seen: ReadonlySet<string> } | null>(null);
  const [failedRun, setFailedRun] = useState<SearchRun>();
  const [localSearches, setLocalSearches] = useState(readLocalSearches);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [latestPageIds, setLatestPageIds] = useState<Set<string> | null>(null);
  const [latestOnly, setLatestOnly] = useState(false);
  const [pageNotice, setPageNotice] = useState('');
  const [requestKind, setRequestKind] = useState<'search' | 'page' | null>(null);
  const busy = requestKind !== null;
  const [error, setError] = useState('');
  const [order, setOrder] = usePaperOrder('original');
  const [hideSaved, setHideSaved] = useState(false);
  const request = useRef<AbortController | null>(null);
  const searchInput = useRef<HTMLInputElement | null>(null);
  const firstResult = useRef<HTMLHeadingElement | null>(null);
  const resultNotice = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, []);

  useEffect(() => {
    if (latestPageIds) (firstResult.current ?? resultNotice.current)?.focus();
  }, [latestPageIds]);

  function cancelRequest() {
    const controller = request.current;
    if (!controller) return;
    request.current = null;
    controller.abort();
    setRequestKind(null);
    if (requestKind === 'page') {
      setPageNotice('Page load canceled. You can request the same page again.');
      resultNotice.current?.focus();
    } else {
      setPageNotice(results ? 'Search canceled. Your previous results are still available.' : 'Search canceled.');
      searchInput.current?.focus();
    }
  }

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

  async function search(terms: string, fromYear = year, onlyOpen = openAccess, source = provider, options: SearchOptions = { documentType, sourceType }) {
    if (project && project.searches.length >= 1000) {
      setError('This project has reached its search-log limit. Export your work before starting a new project for additional searches.');
      return;
    }

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setRequestKind('search');
    setError('');
    setFailedRun(undefined);
    setPageNotice('');


    try {
      const { papers, run } = await runPublicationSearch(source, terms, fromYear, onlyOpen, controller.signal, options);
      if (request.current !== controller || controller.signal.aborted) return;

      const earlier = [...(project?.searches ?? localSearches)].reverse().find(item => !item.run?.error && item.run?.provider === run.provider && item.run?.executedQuery === run.executedQuery && item.run?.filters.join(',') === run.filters.join(',') && item.run.resultIds);
      const unique = newSearchPapers(papers);
      const earlierIds = earlier?.run?.resultIds;
      setNewIds(new Set(earlierIds ? unique.papers.filter(paper => !earlierIds.includes(paper.id)).map(paper => paper.id) : []));
      setLatestPageIds(null);
      setLatestOnly(false);
      setResults({ run, ...unique });
      if (unique.papers.length) showResearchHint('search');
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
        setRequestKind(null);
      }
    }
  }

  async function loadNext() {
    if (!results || busy || request.current || !results.run.nextPage) return;
    const controller = new AbortController();
    request.current = controller;
    setRequestKind('page'); setError(''); setFailedRun(undefined);
    setPageNotice(`Loading page ${results.run.nextPage}. Your ${results.papers.length} existing papers remain available.`);
    try {
      const next = await continuePublicationSearch(results.run, controller.signal);
      if (request.current !== controller || controller.signal.aborted) return;
      const added = newSearchPapers(next.papers, results.seen);
      const papers = [...results.papers, ...added.papers];
      setLatestPageIds(new Set(added.papers.map(paper => paper.id)));
      setLatestOnly(true);
      setPageNotice(added.papers.length ? `Page ${results.run.nextPage} loaded: ${added.papers.length} new records added. ${papers.length} distinct provider records are now available.` : `Page ${results.run.nextPage} returned ${next.papers.length} records and no new provider records. Earlier results are preserved.${next.run.nextPage ? ' You can request the next page or refine the search.' : ''}`);
      setResults({ run: next.run, papers, seen: added.seen });
      recordRun(next.run);
    } catch (failure) {
      if (request.current !== controller || controller.signal.aborted) return;
      setPageNotice(`Page ${results.run.nextPage} was not added. Your ${results.papers.length} earlier papers are still available. Review the error, then retry when ready.`);
      setError(failure instanceof Error ? failure.message : 'Could not load this page. Earlier results are still available.');
      if (failure instanceof PaperSearchError && failure.run) { setFailedRun(failure.run); setResults({ ...results, run: failure.run }); recordRun(failure.run); }
    } finally {
      if (request.current === controller) { request.current = null; setRequestKind(null); }
    }
  }

  const startTopicSearch = useEffectEvent((topic: string) => { void search(topic, initialRun ? searchYear(initialRun) : year, initialRun ? searchOpenAccess(initialRun) : openAccess, initialRun?.provider ?? provider, initialRun ? searchOptionsFromRun(initialRun) : { documentType, sourceType }); });
  useEffect(() => {
    if (initialQuery) startTopicSearch(initialQuery);
  }, [initialQuery, initialRun]);

  const savedPapers = project?.papers ?? [];
  const savedPapersById = new Map(savedPapers.map(paper => [paper.id, paper]));
  const savedPapersByDoi = new Map(savedPapers.flatMap(paper => paper.doi ? [[paper.doi.toLowerCase(), paper] as const] : []));
  const libraryFull = savedPapers.length >= 2000;
  const findSavedPaper = (paper: Paper) => savedPapersById.get(paper.id) ?? (paper.doi ? savedPapersByDoi.get(paper.doi.toLowerCase()) : undefined);
  const papersInView = results?.papers.filter(paper => !latestOnly || latestPageIds?.has(paper.id)) ?? [];
  const visible = orderPapers(papersInView.filter(paper => !hideSaved || !findSavedPaper(paper)), order);
  const nextPageControls = results?.run.nextPage && results.run.stopReason !== 'user-stopped' ? <>
    <button type="button" className="button secondary" disabled={busy} onClick={() => void loadNext()}>
      {requestKind === 'page' ? 'Loading next page…' : 'Load next page'}
    </button>
    {requestKind === 'page' && <button type="button" className="text-button" onClick={cancelRequest}>Cancel page load</button>}
  </> : null;
  const retryRun = failedRun ?? (results?.run.error ? results.run : undefined);
  const canRetryPage = Boolean(retryRun && results && retryRun.id === results.run.id && results.papers.length && retryRun.nextPage);
  function retryFailedSearch() {
    if (canRetryPage) { void loadNext(); return; }
    if (!retryRun) return;
    const options = searchOptionsFromRun(retryRun), fromYear = searchYear(retryRun), onlyOpen = searchOpenAccess(retryRun);
    setQuery(retryRun.userQuery); setProvider(retryRun.provider); setYear(fromYear); setOpenAccess(onlyOpen); setDocumentType(options.documentType); setSourceType(options.sourceType);
    void search(retryRun.userQuery, fromYear, onlyOpen, retryRun.provider, options);
  }

  return (
    <>
      <section className="panel search-panel">
        <h2>{openProjects ? 'Find papers by topic, title, or keyword' : 'Find literature for your question'}</h2>
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
          <div className="search-settings">
            <label className="field"><span>Search source</span><select aria-label="Search source" value={provider} disabled={busy} onChange={event => { const source = event.target.value as SearchProvider; setProvider(source); if (source === 'Crossref') setOpenAccess(false); setDocumentType(undefined); setSourceType(undefined); setFailedRun(undefined); setError(''); }}>{Object.entries(searchProviders).map(([source, value]) => <option key={source} value={source}>{value.label}</option>)}</select></label>
            <OrderSelect label="Sort papers" labels={{ ...paperOrderLabels, original: 'Relevance · provider order' }} order={order} onChange={setOrder} />
          </div>
          <div className="search-tool-anchor"><SearchTools count={[year,openAccess,documentType,sourceType].filter(Boolean).length} onOpen={key=>setTool(tool===key?undefined:key)}/>{tool==='tips' && <HelpPopover title="Search tips" onClose={closeTool}>
          <p className="muted">{searchProviders[provider].description}</p>
          <p>Pick two or three ideas from your question. Try a short keyword phrase such as “student housing insecurity” and record alternative terms in separate searches. Save promising sources and read the full text before relying on a finding.</p>
          <p>Each source starts with 20 records. Load additional pages when useful, up to 100 records per search. Different databases cover different publications. For a review, document the sources you searched and what they might miss.</p>
          <External href={openAlexSearch.docsUrl}>OpenAlex advanced search guidance</External>
        </HelpPopover>}</div>
          <div className="applied-filters">{[year && ['From '+year,()=>setYear('')],openAccess && ['Open access',()=>setOpenAccess(false)],documentType && [documentType,()=>setDocumentType(undefined)],sourceType && [sourceType,()=>setSourceType(undefined)]].filter((chip): chip is [string,()=>void] => Array.isArray(chip)).map(([name,clear])=><button type="button" className="filter-chip" key={name} aria-label={'Remove filter '+name} onClick={clear}>{name} ×</button>)}</div>
        </form>
        {openProjects ? (
          <p>{project ? <>Searches and saved papers go to <strong>{project.title}</strong>.</> : 'Browse freely. Choose a project when you want to save papers.'}</p>
        ) : project?.question && <p><strong>Project question</strong><br />{project.question}</p>}


        {requestKind === 'search' && <button type="button" className="text-button" onClick={cancelRequest}>Cancel search</button>}
        {busy && !results && <div className="loading-paper" role="status"><strong>Retrieving papers from {provider}…</strong><i aria-hidden="true"/><i aria-hidden="true"/></div>}
        {!results && pageNotice && <p role="status">{pageNotice}</p>}
        <p className="muted">The search sends your keywords and filters to {provider}. Leave out confidential project or participant details.{provider === 'Crossref' && ' Crossref does not provide a reliable reading-access filter here; check the publisher or choose another source for open copies.'}</p>
        <External href={searchWebsiteUrl(query)}>Search on Crossref</External>
        {tool && tool!=='tips' && <AtlasDialog title={searchToolNames[tool]} sheet onClose={()=>setTool(undefined)}>
          {tool==='filters' && <><div className="filter-row">
            <label>
              Published from
              <input placeholder="Any year" value={year} onChange={event => setYear(event.target.value)} maxLength={4} inputMode="numeric" />
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={openAccess} disabled={provider === 'Crossref'} onChange={event => setOpenAccess(event.target.checked)} />
              Open access only
            </label>
            <span>{provider} · {openAlexSearch.pageSize} per page · up to 100 retrieved</span>
          </div>
          <div className="two-col"><label className="field"><span>Document type</span><select aria-label="Document type" value={documentType ?? ''} disabled={busy || provider === 'Crossref'} onChange={event => setDocumentType(event.target.value ? event.target.value as SearchOptions['documentType'] : undefined)}>{searchFilterChoices[provider].documents.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field"><span>Source collection</span><select aria-label="Source collection" value={sourceType ?? ''} disabled={busy || provider === 'Crossref'} onChange={event => setSourceType(event.target.value ? event.target.value as SearchOptions['sourceType'] : undefined)}>{searchFilterChoices[provider].sources.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><p className="muted">{searchFilterChoices[provider].note}</p><button type="button" className="button" onClick={()=>setTool(undefined)}>Done</button></>}

          {tool==='databases' && <><p>Open this query on another website. These are direct search links, not imported results. Scholar and ResearchGate manage their own access and may ask you to sign in or complete a browser check. Import a downloaded RIS or BibTeX reference through Library to use it in your project.</p><div className="button-row">{scholarlySearchLinks(query).map(link => <External key={link.name} href={link.url}>{`Search ${link.name}`}</External>)}</div><a href="#library">Import references into your Library</a></>}
        </AtlasDialog>}
      </section>

      {preview && <AtlasDialog title="Paper preview" sheet onClose={()=>setPreview(undefined)}><h3>{preview.title}</h3><p>{preview.authors}</p><PublicationIdentity title={preview.journal} publisher={preview.publisher} type={preview.venueType}/><h4>Abstract</h4><p>{preview.abstract || 'This database did not supply an abstract.'}</p><DiscoverySourceLinks paper={preview}/></AtlasDialog>}
      <SearchLog searches={project?.searches ?? localSearches} reuseSearch={search => {
        setQuery(search.run?.userQuery ?? search.query);
        if (search.run) {
          setProvider(search.run.provider);
          setYear(searchYear(search.run));
          setOpenAccess(searchOpenAccess(search.run));
          const options = searchOptionsFromRun(search.run); setDocumentType(options.documentType); setSourceType(options.sourceType);
        }
        searchInput.current?.focus();
      }} />
      {!project && <p className="muted">Recent search records (up to 50) stay on this browser. They contain your search terms; export them above or clear them here. <button type="button" className="text-button" onClick={() => { try { localStorage.removeItem(searchHistoryKey); setLocalSearches([]); } catch { notify('Could not clear search history. Your browser may have blocked storage access.'); } }}>Clear search history</button></p>}

      {error && <section className="panel" aria-label="Search error"><p className="error" role="alert">{error}</p>{canRetryPage && <p>{results!.papers.length} earlier records are still available. This attempt did not add a page.</p>}<div className="button-row">{retryRun && <button type="button" className="button secondary" disabled={busy} onClick={retryFailedSearch}>{canRetryPage ? 'Retry this page' : 'Retry this search'}</button>}<External href={officialPublicationSearchUrl(retryRun?.provider ?? provider, retryRun?.userQuery ?? query)}>Open keywords on {retryRun?.provider ?? provider}</External></div><p className="muted">The official website may offer different filters. You can also choose another database above. Atlas keeps your selected provider during a search.</p>{retryRun && <SearchRunDetails run={retryRun} />}</section>}
      {libraryFull && <p className="info-bar">Your project has reached its 2,000-source limit. You can still review and export the saved library.</p>}
      {results && (
        <section className="panel" aria-label="Search result controls">
          <p role="status">{visible.length} of {results.papers.length} results shown for “{results.run.userQuery}”{project && ` · ${savedPapers.length} in your library`}</p>
          <p>{results.run.provider}{results.run.resultCountReported !== undefined && ` reported ${results.run.resultCountReported.toLocaleString()} matches`}. Atlas has retrieved {results.papers.length} distinct provider records so far; this is not the full result set. Provider totals are not combined because indexes and duplicate records overlap.</p>
          <p className="muted">{results.run.pages.filter(page => page.returnedCount !== undefined).length} pages retrieved · checked {new Date(results.run.completedAt).toLocaleString()}. Ranking applies to retrieved records only.</p>
          {pageNotice && <p className="info-bar" role="status" ref={resultNotice} tabIndex={-1}>{pageNotice}</p>}
          {latestPageIds && <button type="button" className="button secondary" onClick={() => setLatestOnly(!latestOnly)}>{latestOnly ? 'Show all retrieved papers' : latestPageIds.size ? `View ${latestPageIds.size} newly loaded papers` : 'View latest page'}</button>}
          {newIds.size > 0 && <p role="status">{newIds.size} newly discovered records compared with your previous search snapshot. These may include older publications.</p>}
          <div className="button-row">
            {nextPageControls}
            {results.run.nextPage && <button type="button" className="text-button" disabled={busy} onClick={() => { const run = { ...results.run, stopReason: results.run.stopReason === 'user-stopped' ? undefined : 'user-stopped' as const }; setResults({ ...results, run }); recordRun(run); }}>{results.run.stopReason === 'user-stopped' ? 'Resume page loading' : 'Stop here'}</button>}
            <button type="button" className="text-button" disabled={busy} onClick={() => { const fromYear = searchYear(results.run), onlyOpen = searchOpenAccess(results.run), options = searchOptionsFromRun(results.run); setQuery(results.run.userQuery); setProvider(results.run.provider); setYear(fromYear); setOpenAccess(onlyOpen); setDocumentType(options.documentType); setSourceType(options.sourceType); void search(results.run.userQuery, fromYear, onlyOpen, results.run.provider, options); }}>Refresh this search</button>
          </div>
          {results.run.stopReason === 'app-limit' && <p>Stopped at the 100-record app limit. Refine the query or continue on the official provider website.</p>}
          {results.run.stopReason === 'provider-end' && <p role="status">End of the results returned by {results.run.provider} for this search. Other databases may contain additional relevant papers.</p>}
          {results.run.nextPage && results.run.quota?.remainingCredits === 0 && <p>The provider reported that its free allowance was exhausted when last checked{results.run.quota.resetsAt ? `; reset was scheduled for ${new Date(results.run.quota.resetsAt).toLocaleString()}` : ''}. Load next page will check again when the reported wait has ended. Your existing papers remain available.</p>}
          <SearchRunDetails run={results.run} />
          <p className="muted">Quartiles describe journals, not topic match. Choose relevance to keep the database’s search order. Other sorts reorder only the papers retrieved so far.</p>
          {project && <label className="checkbox"><input type="checkbox" checked={hideSaved} onChange={event => setHideSaved(event.target.checked)} /> Hide saved papers</label>}
          <PaperOrderHelp />
          <details>
            <summary>What could I pay to read or publish?</summary>
            <p>“Free open copy” means an open version is available. For other papers, the publisher or your library can confirm reading access and any price. A journal publishing fee is a separate charge to authors for publishing open access. It is a listed estimate. The journal can confirm current prices, waivers, and options for publishing through a subscription route.</p>
          </details>
          {!project && openProjects && visible.length > 0 && <button type="button" className="text-button" onClick={openProjects}>Open My projects to save papers</button>}
        </section>
      )}
      {results?.papers.length === 0 && !latestOnly && <p className="panel">Try a broader phrase or a different source. An empty result set cannot establish a gap in the literature.</p>}
      {hideSaved && papersInView.length > 0 && !visible.length && <p className="panel">All of these results are in your library. Turn off Hide saved papers to see them.</p>}
      {visible.map((paper, index) => {
        const linkedPaper = findSavedPaper(paper);
        const saved = Boolean(linkedPaper);
        const savedPaper = savedPapersById.get(paper.id);
        const canRefreshReferences = savedPaper && savedPaper.referenceIds === undefined && paper.referenceIds !== undefined;
        const canRefreshMetrics = savedPaper && ((paper.abstract && savedPaper.abstract !== paper.abstract) || (!savedPaper.metricsRetrievedAt && !!paper.metricsRetrievedAt) || savedPaper.fwci !== paper.fwci || savedPaper.citedByCount !== paper.citedByCount || savedPaper.isRetracted !== paper.isRetracted
          || (paper.journalQuartile && (savedPaper.journalQuartile?.year !== paper.journalQuartile.year || savedPaper.journalQuartile?.quartile !== paper.journalQuartile.quartile))
          || savedPaper.publisher !== paper.publisher || savedPaper.venueType !== paper.venueType || savedPaper.publicationDate !== paper.publicationDate || savedPaper.oa !== paper.oa
          || savedPaper.readingCost?.amount !== paper.readingCost?.amount || savedPaper.readingCost?.currency !== paper.readingCost?.currency
          || savedPaper.journalFee?.amount !== paper.journalFee?.amount || savedPaper.journalFee?.currency !== paper.journalFee?.currency
          || savedPaper.journalFee?.usd !== paper.journalFee?.usd);
        return (
          <article className="panel paper" key={paper.id}>
            <div className="paper-result-tags">
              {latestPageIds?.has(paper.id) && <span className="tag">New in the latest loaded page</span>}
              <span className="tag">{paper.source} · <PaperPublished paper={paper} /></span>
              {newIds.has(paper.id) && <span className="tag">New to this search snapshot</span>}
              {paper.oa && <span className="oa-badge">Open-access link</span>}
            </div>
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <h3 ref={index === 0 ? firstResult : undefined} tabIndex={index === 0 ? -1 : undefined}>{paper.title}</h3>
            <p>{paper.authors || 'Authors not supplied'}</p>
            {paper.abstract && <p className="abstract-preview">{paper.abstract}</p>}
            <button type="button" className="text-button" onClick={()=>setPreview(paper)}>Preview paper</button>
            {!project && onCreateForPaper && <button type="button" className="button secondary small" onClick={()=>onCreateForPaper(paper)}><Plus size={15}/>Save paper to a new project</button>}
            {project && <div className="search-save-actions">
              {update && <button
                type="button"
                className="button secondary small"
                disabled={saved || libraryFull}
                aria-label={saved ? `Saved: ${paper.title}` : 'Save paper'}
                onClick={() => {
                  const next = addPaper(project, paper);
                  if (next === project) return;
                  update({ papers: next.papers });
                  notify('Paper saved to your project library and evidence matrix.');
                  showResearchHint('paper');
                }}
              >
                <Plus size={15} aria-hidden="true" /> {saved ? 'Saved' : 'Save paper'}
              </button>}
              {linkedPaper && onScreen && <button type="button" className="text-button" onClick={() => onScreen(linkedPaper.id)}>Screen saved paper</button>}
            </div>}
            <PaperImpact paper={paper} />
            {paper.doi && <p className="muted">DOI {paper.doi}</p>}
            <RelatedDiscovery paper={paper} project={project} update={update} notify={notify} />
            <div className="paper-bottom">
              <DiscoverySourceLinks paper={paper} />
              {linkedPaper && onNote && <button type="button" className="button secondary small" onClick={() => onNote(linkedPaper.id)}>Add my note</button>}
              {update && canRefreshReferences && (
                <button type="button" className="button secondary small" onClick={() => {
                  update({ papers: savedPapers.map(item => item.id === paper.id ? { ...item, referenceIds: paper.referenceIds } : item) });
                  notify('Citation links updated for this saved source.');
                }}>Refresh citation links</button>
              )}
              {update && canRefreshMetrics && (
                <button type="button" className="button secondary small" onClick={() => {
                  const { fwci, citedByCount, metricsRetrievedAt, isRetracted, workType, journal, journalQuartile, publisher, venueType, issns, inDoaj, publicationDate, oa, readingCost, journalFee, abstract } = paper;
                  update({ papers: savedPapers.map(item => item.id === paper.id ? { ...item, fwci, citedByCount, metricsRetrievedAt, isRetracted, workType, journal, journalQuartile: journalQuartile ?? item.journalQuartile, publisher, venueType, issns, inDoaj, publicationDate, oa, readingCost, journalFee, abstract: abstract ?? item.abstract } : item) });
                  notify('Citation, publication, and price information refreshed.');
                }}>Refresh paper metrics</button>
              )}
            </div>
          </article>
        );
      })}
      {nextPageControls && <nav className="panel button-row" aria-label="Result pagination">{nextPageControls}</nav>}
    </>
  );
}
