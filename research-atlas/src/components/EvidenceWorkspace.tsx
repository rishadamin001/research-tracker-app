'use client';

import { Download, Plus, Search } from 'lucide-react';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { searchWebsiteUrl } from '@/lib/links';
import { addPaper, matrixCsv, type Paper, type Project } from '@/lib/model';
import { searchPapers } from '@/lib/providers';
import { orderPapers, paperOrderLabels } from '@/lib/ranking';
import { download } from '@/lib/storage';
import { External } from './External';
import { OrderSelect, PaperImpact, PaperOrderHelp, PublicationIdentity, usePaperOrder } from './RankingControls';

interface EvidenceWorkspaceProps {
  project: Project;
  update: (patch: Partial<Project>) => void;
  notify: (message: string) => void;
  mode: 'discover' | 'screen' | 'extract';
  initialQuery?: string;
}

const decisionLabels: Record<Paper['decision'], string> = {
  unreviewed: 'Unreviewed',
  include: 'Included',
  exclude: 'Excluded',
};

function SourceLinks({ paper }: { paper: Paper }) {
  return (
    <div className="button-row">
      {paper.url && <External href={paper.url}>Open source</External>}
      {paper.oa && paper.oa !== paper.url && <External href={paper.oa}>Read open copy</External>}
      {!paper.url && !paper.oa && <External href={searchWebsiteUrl(paper.title)}>Find source by title</External>}
    </div>
  );
}

function SearchLog({ searches, reuseTerms }: { searches: Project['searches']; reuseTerms: (terms: string) => void }) {
  return (
    <details className="panel">
      <summary>Search audit trail ({searches.length})</summary>
      {searches.length === 0 && <p>Completed searches will appear here.</p>}
      {searches.slice().reverse().map((search, index) => (
        <div className="audit" key={`${search.date}-${index}`}>
          <p>{new Date(search.date).toLocaleString()} · {search.source} · “{search.query}” · {search.filters} · {search.count} results</p>
          <button type="button" className="text-button" onClick={() => reuseTerms(search.query)}>Reuse search terms</button>
        </div>
      ))}
      <p className="muted">This log records the searches run here. A systematic review may need additional databases and full search strategies.</p>
    </details>
  );
}

function Discover({ project, update, notify, initialQuery }: Omit<EvidenceWorkspaceProps, 'mode'>) {
  const [query, setQuery] = useState(initialQuery ?? project.searches.at(-1)?.query ?? '');
  const [year, setYear] = useState('');
  const [openAccess, setOpenAccess] = useState(false);
  const [results, setResults] = useState<{ query: string; papers: Paper[] } | null>(null);
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

  async function search(terms: string) {
    if (project.searches.length >= 1000) {
      setError('This project has reached its search-log limit. Export your work before starting a new project for additional searches.');
      return;
    }

    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setError('');
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const papers = await searchPapers(terms, year, openAccess, controller.signal);
      if (request.current !== controller || controller.signal.aborted) return;

      setResults({ query: terms, papers });
      const filters = [year && `Published from ${year}`, openAccess && 'Open access only', 'First 20 results'].filter(Boolean).join(' · ');
      update({
        searches: [...project.searches, {
          query: terms,
          source: 'OpenAlex',
          date: new Date().toISOString(),
          count: papers.length,
          filters,
        }],
        gapStatus: project.gapStatus === 'idea' ? 'search underway' : project.gapStatus,
      });
    } catch (failure) {
      if (request.current !== controller) return;
      if (controller.signal.aborted) {
        setError('Search timed out. Try again or use the Crossref link below.');
      } else if (failure instanceof TypeError) {
        setError('Could not reach OpenAlex. Check your connection or use the Crossref link below.');
      } else if (failure instanceof Error && failure.name !== 'ZodError') {
        setError(failure.message);
      } else {
        setError('OpenAlex returned records the app could not read. Try another search or use the Crossref link below.');
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  const startTopicSearch = useEffectEvent((topic: string) => { void search(topic); });
  useEffect(() => {
    if (initialQuery) startTopicSearch(initialQuery);
  }, [initialQuery]);

  const savedPapersById = new Map(project.papers.map(paper => [paper.id, paper]));
  const savedDois = new Set(project.papers.flatMap(paper => paper.doi ? [paper.doi.toLowerCase()] : []));
  const libraryFull = project.papers.length >= 2000;
  const isSaved = (paper: Paper) => savedPapersById.has(paper.id) || (paper.doi !== null && savedDois.has(paper.doi.toLowerCase()));
  const visible = results ? orderPapers(results.papers.filter(paper => !hideSaved || !isSaved(paper)), order) : [];

  return (
    <>
      <section className="panel search-panel">
        <h2>Find literature for your question</h2>
        {project.question && <p><strong>Project question</strong><br />{project.question}</p>}
        <details>
          <summary>How to build a useful search</summary>
          <p>Pick two or three ideas from your question. Try a short keyword phrase such as “student housing insecurity” and record alternative terms in separate searches. Save promising sources and read the full text before relying on a finding.</p>
        </details>
        <form onSubmit={event => { event.preventDefault(); void search(query.trim()); }}>
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
            <span>OpenAlex · up to 20 results per search</span>
          </div>
        </form>
        <p className="muted">The search sends your keywords to OpenAlex. Leave out confidential project or participant details.</p>
        <External href={searchWebsiteUrl(query)}>Search on Crossref</External>
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      {libraryFull && <p className="info-bar">Your project has reached its 2,000-source limit. You can still review and export the saved library.</p>}
      {results && (
        <section className="panel" aria-label="Search result controls">
          <p role="status">{visible.length} of {results.papers.length} results shown for “{results.query}” · {project.papers.length} in your library</p>
          <OrderSelect label="Sort papers" labels={paperOrderLabels} order={order} onChange={setOrder} />
          <label className="checkbox"><input type="checkbox" checked={hideSaved} onChange={event => setHideSaved(event.target.checked)} /> Hide saved papers</label>
          <PaperOrderHelp />
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
          || savedPaper.publisher !== paper.publisher || savedPaper.venueType !== paper.venueType);
        return (
          <article className="panel paper" key={paper.id}>
            <span className="tag">{paper.source} · {paper.year ?? 'Year unknown'}</span>
            {paper.oa && <span className="oa-badge">Open-access link</span>}
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <h3>{paper.title}</h3>
            <p>{paper.authors || 'Authors not supplied'}</p>
            <PaperImpact paper={paper} />
            {paper.doi && <p className="muted">DOI {paper.doi}</p>}
            <div className="paper-bottom">
              <SourceLinks paper={paper} />
              <button
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
              </button>
              {canRefreshReferences && (
                <button type="button" className="button secondary small" onClick={() => {
                  update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, referenceIds: paper.referenceIds } : item) });
                  notify('Citation links updated for this saved source.');
                }}>Refresh citation links</button>
              )}
              {canRefreshMetrics && (
                <button type="button" className="button secondary small" onClick={() => {
                  const { fwci, citedByCount, isRetracted, workType, journal, journalQuartile, publisher, venueType, issns, inDoaj } = paper;
                  update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, fwci, citedByCount, isRetracted, workType, journal, journalQuartile: journalQuartile ?? item.journalQuartile, publisher, venueType, issns, inDoaj } : item) });
                  notify('Citation and publication status data refreshed.');
                }}>Refresh paper metrics</button>
              )}
            </div>
          </article>
        );
      })}
      <SearchLog searches={project.searches} reuseTerms={terms => {
        setQuery(terms);
        searchInput.current?.focus();
      }} />
    </>
  );
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

function Screen({ project, update }: Pick<EvidenceWorkspaceProps, 'project' | 'update'>) {
  const [filter, setFilter] = useState<Paper['decision'] | 'all'>('all');
  const [query, setQuery] = useState('');
  const [order, setOrder] = usePaperOrder();
  const reviewed = project.papers.filter(paper => paper.decision !== 'unreviewed' && paper.reason.trim()).length;
  const terms = query.trim().toLowerCase();
  const shown = orderPapers(project.papers.filter(paper =>
    (filter === 'all' || paper.decision === filter) &&
    (!terms || [paper.title, paper.authors, paper.journal, paper.doi].some(value => value?.toLowerCase().includes(terms))),
  ), order);

  function editPaper(id: string, patch: Partial<Paper>) {
    update({ papers: project.papers.map(paper => paper.id === id ? { ...paper, ...patch } : paper) });
  }

  function setDecision(paper: Paper, decision: Paper['decision']) {
    if (decision !== 'unreviewed' && !paper.reason.trim()) return;
    const note = decision === 'unreviewed'
      ? `Reopened screening for “${paper.title.slice(0, 500)}”.`
      : `${decisionLabels[decision]} “${paper.title.slice(0, 500)}”. Reason: ${paper.reason.trim().slice(0, 18000)}`;
    update({
      papers: project.papers.map(item => item.id === paper.id ? { ...item, decision } : item),
      decisions: [...project.decisions.slice(-299), { at: new Date().toISOString(), note }],
    });
  }

  return (
    <>
      <section className="panel">
        <h2>Screen your saved sources</h2>
        <p>{reviewed} of {project.papers.length} saved sources have a decision and reason.</p>
        <details>
          <summary>How to screen a source</summary>
          <p>Apply the same inclusion and exclusion rules to each source. If the title and abstract leave you unsure, keep the source unreviewed until you can read the full text. Record a specific reason with each decision so you can review it later.</p>
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
            </select>
          </label>
          <OrderSelect label="Sort saved papers" labels={paperOrderLabels} order={order} onChange={setOrder} />
          <p role="status">{shown.length} of {project.papers.length} saved sources shown</p>
          <PaperOrderHelp />
        </>}
      </section>
      {project.papers.length === 0 && <p className="panel">Save a paper in literature discovery to start screening.</p>}
      {project.papers.length > 0 && !shown.length && <p className="panel">No saved sources match this filter.</p>}
      {shown.map(paper => (
        <details className="panel matrix-paper" key={paper.id}>
          <summary>
            <span><strong>{paper.title}</strong><small>{paper.year ?? 'Year unknown'} · {decisionLabels[paper.decision]}{paper.decision !== 'unreviewed' && !paper.reason.trim() ? ' · Reason needed' : ''}</small></span>
          </summary>
          <div className="lesson-body">
            <p>{paper.authors || 'Authors not supplied'}</p>
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <PaperImpact paper={paper} />
            <SourceLinks paper={paper} />
            <label className="field">
              <span>Decision reason</span>
              <textarea maxLength={20000} rows={2} placeholder="Which inclusion or exclusion rule applies?" value={paper.reason} onChange={event => editPaper(paper.id, { reason: event.target.value })} />
            </label>
            <label className="field">
              <span>Screening decision</span>
              <select value={paper.decision} onChange={event => setDecision(paper, event.target.value as Paper['decision'])}>
                <option value="unreviewed">Unreviewed</option>
                <option value="include" disabled={!paper.reason.trim() && paper.decision !== 'include'}>Include</option>
                <option value="exclude" disabled={!paper.reason.trim() && paper.decision !== 'exclude'}>Exclude</option>
              </select>
            </label>
            <button type="button" className="text-button danger" onClick={() => {
              if (window.confirm('Remove this paper and its saved evidence notes?')) {
                update({ papers: project.papers.filter(item => item.id !== paper.id) });
              }
            }}>Remove paper</button>
          </div>
        </details>
      ))}
      <CitationNeighborhood papers={project.papers} />
      <PublicationTimeline papers={project.papers} />
    </>
  );
}

const extractionFields = [
  { key: 'methods', label: 'Methods and sample', hint: 'Record the design, sample, and analysis used.' },
  { key: 'finding', label: 'Extracted finding', hint: 'Summarize what the authors reported in your own words.' },
  { key: 'limitations', label: 'Limitations', hint: 'Record weaknesses or limits the authors identify.' },
  { key: 'locator', label: 'Evidence level and page / section', hint: 'For example, full text, page 8, Table 2.' },
  { key: 'notes', label: 'Your notes', hint: 'Keep your interpretation separate from the authors’ finding.' },
] as const;

function Extract({ project, update }: Pick<EvidenceWorkspaceProps, 'project' | 'update'>) {
  const [order, setOrder] = usePaperOrder();
  const ordered = orderPapers(project.papers, order);
  const active = ordered.filter(paper => paper.decision !== 'exclude');

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <h2>Evidence matrix</h2>
          <button type="button" className="button secondary" disabled={!project.papers.length} onClick={() => download('literature-matrix.csv', matrixCsv({ ...project, papers: ordered }), 'text/csv;charset=utf-8')}>
            <Download size={16} aria-hidden="true" /> Export CSV
          </button>
        </div>
        <details>
          <summary>How to extract comparable evidence</summary>
          <p>Read the source and record its methods, findings, limitations, and the page or section you checked. If you only read an abstract, say so. Keep a note of findings that challenge your interpretation.</p>
        </details>
        {project.papers.length > 0 && <OrderSelect label="Sort evidence" labels={paperOrderLabels} order={order} onChange={setOrder} />}
        <p className="muted">The matrix displays included and unreviewed sources. The export includes every saved record and its screening decision.</p>
        {active.length === 0 ? <p>Save or include a source to populate the matrix.</p> : (
          <div style={{ overflowX: 'auto' }} role="region" aria-label="Evidence comparison table" tabIndex={0}>
            <table style={{ width: '100%', textAlign: 'left', borderSpacing: '12px', tableLayout: 'fixed', minWidth: '40rem', overflowWrap: 'anywhere' }}>
              <caption>Compare {active.length} sources</caption>
              <thead><tr><th scope="col">Source</th><th scope="col">Methods</th><th scope="col">Finding</th><th scope="col">Limitations</th><th scope="col">Locator</th></tr></thead>
              <tbody>
                {active.map(paper => (
                  <tr key={paper.id}>
                    <th scope="row">{paper.title}<br /><small>{decisionLabels[paper.decision]}</small></th>
                    <td>{paper.methods || '—'}</td>
                    <td>{paper.finding || '—'}</td>
                    <td>{paper.limitations || '—'}</td>
                    <td>{paper.locator || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {active.map(paper => (
        <details className="panel matrix-paper" key={paper.id}>
          <summary>
            <span><strong>Edit notes for {paper.title}</strong><small>{paper.year ?? 'Year unknown'} · {decisionLabels[paper.decision]}</small></span>
          </summary>
          <div className="lesson-body">
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
          </div>
        </details>
      ))}
      <section className="panel">
        <h2>Document a possible research gap</h2>
        <p>Compare the evidence you have reviewed. State where findings agree, differ, or leave a question unresolved. Describe the limits of your search and the records that support or challenge the claim.</p>
        <label className="field">
          <span>Candidate gap and supporting / conflicting evidence</span>
          <textarea rows={5} maxLength={20000} value={project.gap} onChange={event => update({ gap: event.target.value })} placeholder="Within the searches I ran, these sources agree on … but leave … unclear." />
        </label>
        <label className="field">
          <span>Review state</span>
          <select value={project.gapStatus} onChange={event => update({ gapStatus: event.target.value as Project['gapStatus'] })}>
            <option value="idea">Provisional idea</option>
            <option value="search underway">Search underway</option>
            <option value="evidence-supported candidate">Evidence-supported candidate</option>
            <option value="human-reviewed candidate">Human-reviewed candidate</option>
            <option value="contradicted">Contradicted by evidence</option>
            <option value="needs-update">Needs review</option>
          </select>
        </label>
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
