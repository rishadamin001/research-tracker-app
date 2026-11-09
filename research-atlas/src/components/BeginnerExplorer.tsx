import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, Search, Sparkles } from 'lucide-react';
import { disciplines } from '@/lib/content';
import { safeUrl, type Project } from '@/lib/model';
import { runPublicationSearch } from '@/lib/search-publications';
import { PaperSearchError } from '@/lib/search-provenance';
import { scholarlySearchLinks } from '@/lib/links';
import { beginnerAngles, beginnerApproaches, beginnerDirections, beginnerExamples, beginnerPaperKey, beginnerProjectSeed, beginnerSearchRecord, beginnerSessionKey, emptyBeginnerStarter, parseBeginnerStarter, type BeginnerGroup, type BeginnerProjectSeed, type BeginnerStarter } from '@/lib/beginner-exploration';
import { External } from './External';
import { PublicationIdentity, QuartileBadge } from './RankingControls';
import './beginner-explorer.css';

function readStarter() {
  try { return parseBeginnerStarter(JSON.parse(sessionStorage.getItem(beginnerSessionKey) ?? 'null')); } catch { return emptyBeginnerStarter(); }
}
export function BeginnerExplorer({ ready, onCreateProject, onOpenSearch, onLearn }: {
  ready: boolean; onCreateProject: (seed: BeginnerProjectSeed) => void; onOpenSearch: (query: string) => void; onLearn: () => void;
}) {
  const [starter, setStarter] = useState(readStarter);
  const [groups, setGroups] = useState<BeginnerGroup[]>([]);
  const [searches, setSearches] = useState<Project['searches']>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const request = useRef<AbortController | null>(null);
  const ownInterest = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const examples = beginnerExamples(groups);
  const visiblePapers = examples.flatMap(group => group.examples);
  const canExplore = starter.interest.trim().length >= 3;
  const field = disciplines.find(item => item.name === starter.discipline);
  useEffect(() => {
    try { sessionStorage.setItem(beginnerSessionKey, JSON.stringify(starter)); } catch { /* Optional tab storage must not prevent exploration. */ }
  }, [starter]);
  useEffect(() => () => { request.current?.abort(); request.current = null; }, []);
  function change(patch: Partial<BeginnerStarter>, changesSearch = false) {
    if (changesSearch) { request.current?.abort(); request.current = null; setBusy(false); setGroups([]); setSelected([]); }
    setStarter(previous => ({ ...previous, ...patch })); setNotice('');
  }
  function go(step: BeginnerStarter['step']) {
    if (step < 3) { request.current?.abort(); request.current = null; setBusy(false); }
    change({ step }); requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  function remember(run: Parameters<typeof beginnerSearchRecord>[0]) {
    const item = beginnerSearchRecord(run);
    setSearches(previous => [...previous.filter(search => search.run?.id !== run.id), item].slice(-20));
  }
  async function explore() {
    if (!canExplore || busy) return;
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    const angles = beginnerAngles(starter);
    setStarter(previous => ({ ...previous, step: 3 })); setBusy(true); setNotice('');
    setGroups(previous => angles.map(angle => ({ ...angle, papers: previous.find(group => group.query === angle.query)?.papers ?? [], pending: true })));
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    await Promise.allSettled(angles.map(async angle => {
      try {
        const result = await runPublicationSearch('OpenAlex', angle.query, '', false, controller.signal);
        if (request.current !== controller || controller.signal.aborted) return;
        setGroups(previous => previous.map(group => group.id === angle.id ? { ...angle, papers: result.papers, run: result.run } : group));
        remember(result.run);
      } catch (failure) {
        if (request.current !== controller || controller.signal.aborted) return;
        const error = failure instanceof Error ? failure.message : 'The paper service could not be reached. Try again or open the full paper search.';
        setGroups(previous => previous.map(group => group.id === angle.id ? { ...group, pending: false, error } : group));
        if (failure instanceof PaperSearchError && failure.run) remember(failure.run);
      }
    }));
    if (request.current === controller) { request.current = null; setBusy(false); }
  }
  function clear() {
    request.current?.abort(); request.current = null; setBusy(false); setStarter(emptyBeginnerStarter()); setGroups([]); setSearches([]); setSelected([]); setNotice('Starter choices cleared for this tab. Existing projects were not changed.');
    try { sessionStorage.removeItem(beginnerSessionKey); } catch { /* The visible reset still succeeds. */ }
  }
  function toggle(key: string) { setSelected(previous => previous.includes(key) ? previous.filter(item => item !== key) : [...previous, key]); }
  return <div className="beginner-explorer">
    <header className="starter-heading"><span className="eyebrow">START WITH CURIOSITY</span><h1>Find your first research direction</h1><p>You can explore real papers before choosing a title, writing a formal question or deciding on a study design.</p></header>
    <ol className="starter-progress" aria-label="Your first research steps">{[['Interest', Compass], ['Choose a starting approach', Search], ['Meet the evidence', BookOpen]].map(([label, Icon], index) => {
      const StepIcon = Icon as typeof Compass;
      return <li key={String(label)} aria-current={starter.step === index + 1 ? 'step' : undefined}><StepIcon size={19} aria-hidden="true" /><span><small>Step {index + 1}</small>{String(label)}</span>{starter.step > index + 1 && <Check size={16} aria-hidden="true" />}</li>;
    })}</ol>
    {notice && <p className="notice" role="status">{notice}</p>}
    <section className="panel starter-step" aria-labelledby="starter-active-heading">
      <h2 id="starter-active-heading" ref={heading} tabIndex={-1}>{starter.step === 1 ? 'What are you curious about?' : starter.step === 2 ? 'How would you like to start?' : 'Meet a few real papers'}</h2>
      {starter.step === 1 && <>
        <p>Choose a field for examples, tap a topic, or use your own words. A broad interest is enough.</p>
        <fieldset className="starter-fields"><legend>Choose a field (optional)</legend><div className="starter-field-grid">{disciplines.map(item => <button type="button" className="starter-field" key={item.name} aria-pressed={starter.discipline === item.name} onClick={() => change({ discipline: item.name }, true)}>{item.name}</button>)}</div></fieldset>
        {field && <div className="starter-topics" role="group" aria-label={`Try a topic in ${field.name}`}>{field.domains.map(topic => <button type="button" className="button secondary small" key={topic} aria-pressed={starter.interest === topic} onClick={() => change({ interest: topic }, true)}>{topic}</button>)}</div>}
        <button type="button" className="text-button" onClick={() => ownInterest.current?.focus()}>I have my own idea <ArrowRight size={15} aria-hidden="true" /></button>
        <label className="field"><span>Your interest</span><input ref={ownInterest} aria-label="Your interest" maxLength={180} value={starter.interest} onChange={event => change({ interest: event.target.value }, true)} placeholder="For example, student housing or digital payments" /></label>
        <p className="muted">Use a few keywords. No formal research question is needed. Keep personal or confidential details out of this search.</p>
        <button type="button" className="button" disabled={!canExplore} onClick={() => go(2)}>Choose how to explore <ArrowRight size={16} aria-hidden="true" /></button>
      </>}
      {starter.step === 2 && <>
        <p>Your interest: <strong>{starter.interest}</strong>. These choices change the search angle; they do not choose your research design.</p>
        <fieldset className="starter-approaches"><legend>Choose a starting approach</legend>{beginnerApproaches.map(approach => <label className="starter-choice" data-selected={starter.approach === approach.id} key={approach.id}><input type="radio" name="starter-approach" aria-label={approach.title} value={approach.id} checked={starter.approach === approach.id} onChange={() => change({ approach: approach.id }, true)} /><span><strong>{approach.title}</strong><small>{approach.detail}</small></span></label>)}</fieldset>
        {starter.approach === 'topics' && <fieldset className="starter-directions"><legend>Pick a direction to investigate</legend><p>These are editable question prompts, not findings or claims that a research gap exists.</p>{beginnerDirections(starter.interest).map(direction => <label className="starter-choice" data-selected={starter.direction === direction.id} key={direction.id}><input type="radio" name="starter-direction" aria-label={direction.title} checked={starter.direction === direction.id} onChange={() => change({ direction: direction.id }, true)} /><span><strong>{direction.title}</strong><small>{direction.prompt}</small></span></label>)}</fieldset>}
        {starter.approach === 'idea' && <label className="field"><span>A group, place or process to explore (optional)</span><input aria-label="A group, place or process to explore (optional)" maxLength={80} value={starter.context} onChange={event => change({ context: event.target.value }, true)} placeholder="For example, commuter students or local shops" /></label>}
        <details><summary>What will Atlas search?</summary><p>Clicking below sends these two keyword searches to the free OpenAlex service. Atlas shows up to three examples per search angle, in the provider’s returned order.</p><ul>{beginnerAngles(starter).map(angle => <li key={angle.id}>{angle.title}: <code>{angle.query}</code></li>)}</ul><p>The groups reflect search terms, not a verified thematic analysis.</p></details>
        <div className="button-row"><button type="button" className="button secondary" onClick={() => go(1)}><ArrowLeft size={16} aria-hidden="true" />Change interest</button><button type="button" className="button" disabled={!canExplore || busy} onClick={() => void explore()}><Search size={16} aria-hidden="true" />Show real papers</button></div>
      </>}
      {starter.step === 3 && <>
        <p>Start by opening one paper and asking: “What did its authors investigate, and would it help me understand my interest?”</p>
        <div className="button-row"><button type="button" className="button secondary" onClick={() => go(2)}><ArrowLeft size={16} aria-hidden="true" />Change approach</button><button type="button" className="button secondary" disabled={busy} onClick={() => void explore()}>{busy ? 'Looking for papers…' : groups.length ? 'Search these angles again' : 'Find example papers'}</button><button type="button" className="text-button" onClick={() => onOpenSearch(starter.interest)}>Open full paper search <ArrowRight size={15} aria-hidden="true" /></button></div>
        {busy && <p role="status">Retrieving real records from OpenAlex. Each successful search appears here as it arrives.</p>}
        {!groups.length && <p>Your starter choices are available for this tab. Run the search to retrieve current papers; result cards are not kept in tab storage.</p>}
        {examples.map(group => <section className="starter-evidence-group" key={group.id} aria-label={`Search angle: ${group.title}`}><div className="starter-angle-heading"><Search size={20} aria-hidden="true" /><div><h3>{group.title}</h3><p>{group.explanation}</p></div></div><p className="starter-query">Search words: <code>{group.query}</code></p>
          {group.run && <p className="muted">{group.run.provider} · searched <time dateTime={group.run.completedAt}>{new Date(group.run.completedAt).toLocaleString()}</time> · {group.papers.length} records retrieved{group.run.resultCountReported !== undefined && ` of ${group.run.resultCountReported.toLocaleString()} reported matches`}. These totals are per query and may overlap.</p>}
          {group.pending && <p role="status">Loading this search angle…</p>}
          {group.error && <div className="error" role="alert"><p>{group.error}</p>{group.papers.length > 0 && <p>Earlier examples from this search angle remain below.</p>}<External href={scholarlySearchLinks(group.query)[0].url}>Try this search on Google Scholar</External></div>}
          {!group.pending && !group.error && !group.examples.length && <p>{group.overlap ? 'These returned records also appeared above, so they are not repeated here.' : 'No example records were returned for these words. This does not establish that no research exists. Try another angle or the full paper search.'}</p>}
          <div className="starter-paper-grid">{group.examples.map(paper => {
            const key = beginnerPaperKey(paper), url = safeUrl(paper.oa) ?? safeUrl(paper.url);
            return <article className="starter-paper" key={key}><span className="eyebrow">{paper.source} · {paper.year ?? 'Year not supplied'}</span><h4>{paper.title}</h4><p className="starter-authors">{paper.authors ? paper.authors.slice(0, 260) : 'Author details not supplied'}</p><PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} /><div className="starter-metrics"><QuartileBadge value={paper.journalQuartile} /><span>{paper.citedByCount == null ? 'Citation count not supplied' : `${paper.citedByCount.toLocaleString()} citations · ${paper.source}`}</span></div><p className="starter-reading">{paper.oa ? 'A free open copy is linked.' : 'Reading price not supplied; check the publisher or your library.'}{paper.journalFee && ` Listed open-access publishing fee: ${new Intl.NumberFormat(undefined, { style: 'currency', currency: paper.journalFee.currency }).format(paper.journalFee.amount)}. Reading and publishing are separate costs.`}</p>
              {paper.abstract ? <details><summary>Read the supplied abstract excerpt</summary><p className="starter-abstract">{paper.abstract.slice(0, 900)}{paper.abstract.length > 900 ? '…' : ''}</p><small>Source-provided text, not an Atlas summary. Open the source to check the full abstract, methods and findings.</small></details> : <p className="muted">No abstract was supplied. The title and metadata do not establish what the study found.</p>}
              {url ? <External href={url}>Open paper source</External> : <p>Source link unavailable. Verify the title or DOI before using this record.</p>}<label className="checkbox starter-keep"><input type="checkbox" aria-label={`Keep for my project: ${paper.title.slice(0, 200)}`} checked={selected.includes(key)} onChange={() => toggle(key)} />Keep for my project</label><p className="muted">Keeping a paper saves a reference for later review. It does not mark it included or endorse its findings.</p>
            </article>;
          })}</div>{group.overlap > 0 && group.examples.length > 0 && <p className="muted">Overlapping identifiers were not repeated. Each actual query remains recorded in the project search history.</p>}
        </section>)}
        {visiblePapers.length > 0 && <section className="starter-project" aria-label="Turn exploration into a project"><h3><Sparkles size={19} aria-hidden="true" />Make this an editable project</h3><p>You have seen real source records. Keep exploring, or save this starting point. A design and final research question can come later.</p><label className="field"><span>Working project title (optional)</span><input aria-label="Working project title (optional)" maxLength={200} value={starter.title} onChange={event => change({ title: event.target.value })} placeholder={`Exploring ${starter.interest}`} /></label><label className="field"><span>A question to explore (optional draft)</span><textarea aria-label="A question to explore (optional draft)" rows={3} maxLength={2000} value={starter.questionDraft} onChange={event => change({ questionDraft: event.target.value })} placeholder="Write a question only when you are ready. You can revise it later." /></label>{starter.approach === 'topics' && <button type="button" className="text-button" onClick={() => change({ questionDraft: beginnerDirections(starter.interest).find(item => item.id === starter.direction)!.prompt })}>Use the selected question prompt as a draft</button>}<p>{selected.length} reference{selected.length === 1 ? '' : 's'} selected. Actual search records are kept with the project. Optional question wording remains an uncommitted draft.</p><button type="button" className="button" disabled={!ready || busy} onClick={() => onCreateProject(beginnerProjectSeed(starter, groups, selected, searches))}>Create project from this exploration <ArrowRight size={16} aria-hidden="true" /></button></section>}
      </>}
    </section>
    <footer className="starter-support"><button type="button" className="text-button" onClick={onLearn}><BookOpen size={16} aria-hidden="true" />See the research journey and lessons</button><button type="button" className="text-button" onClick={clear}>Clear starter choices</button><p className="muted">Your starter choices and optional wording use this tab’s session storage. Clear them here when finished. Retrieved papers are kept only when you explicitly create a project. No AI service writes findings or declares a research gap.</p></footer>
  </div>;
}
