import { useEffect, useRef, useState } from 'react';
import type { Project } from '@/lib/model';
import { fetchJournalIdentity, journalSuggestions, prepareJournalQuery, suggestionCandidate, type JournalIdentity, type JournalSuggestion } from '@/lib/journal-match';
import { runPublicationSearch } from '@/lib/search-publications';
import { External } from './External';
import { JournalFee, PublicationIdentity, QuartileBadge } from './RankingControls';

export function JournalMatch({ project, update, onProjects }: { project?: Project; update: (patch: Partial<Project>) => void; onProjects: () => void }) {
  const [draft, setDraft] = useState(project?.journalMatchDraft ?? { title: '', abstract: '', keywords: '', query: '' });
  const [suggestions, setSuggestions] = useState<JournalSuggestion[]>([]);
  const [identities, setIdentities] = useState<Record<string, JournalIdentity>>({});
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const request = useRef<AbortController | null>(null);
  const identityRequests = useRef(new Map<string, AbortController>());
  useEffect(() => { const identities = identityRequests.current; return () => { request.current?.abort(); identities.forEach(controller => controller.abort()); }; }, []);
  function edit(patch: Partial<typeof draft>) { const next = { ...draft, ...patch }; setDraft(next); if (project) update({ journalMatchDraft: next }); }
  async function search() {
    request.current?.abort(); const controller = new AbortController(); request.current = controller;
    identityRequests.current.forEach(request => request.abort()); identityRequests.current.clear();
    setBusy(true); setNotice('');
    try {
      const result = await runPublicationSearch('OpenAlex', draft.query.trim(), '', false, controller.signal, { sourceType: 'journal' });
      if (request.current !== controller) return;
      setSuggestions(journalSuggestions(result.papers, result.run)); setIdentities({});
      setNotice(`${result.papers.length} article records examined. Suggestions reflect this limited search, not all journals.`);
    } catch (error) { if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'Search unavailable. Try again.'); }
    finally { if (request.current === controller) { request.current = null; setBusy(false); } }
  }
  async function identify(item: JournalSuggestion) {
    identityRequests.current.get(item.key)?.abort(); const controller = new AbortController(); identityRequests.current.set(item.key, controller);
    try { const identity = await fetchJournalIdentity(item.issns[0], controller.signal); if (!controller.signal.aborted) setIdentities(previous => ({ ...previous, [item.key]: identity })); }
    catch (error) { if (!controller.signal.aborted) setNotice(error instanceof Error ? error.message : 'Identity lookup unavailable.'); }
    finally { if (identityRequests.current.get(item.key) === controller) identityRequests.current.delete(item.key); }
  }
  function save(item: JournalSuggestion) {
    if (!project) { onProjects(); return; }
    if (project.journalCandidates.length >= 100) { setNotice('Your shortlist is full. Remove an older candidate first.'); return; }
    if (project.journalCandidates.some(candidate => candidate.title === item.title && candidate.matchEvidence?.query === item.run.userQuery)) { setNotice('This suggestion is already in your shortlist.'); return; }
    update({ journalCandidates: [...project.journalCandidates, suggestionCandidate(item, identities[item.key])] }); setNotice('Saved with supporting articles and search provenance. Complete the venue checks in your shortlist.');
  }
  return <section aria-labelledby="journal-match-heading">
    <div className="panel"><h2 id="journal-match-heading">Journal Match</h2><p>Find journals that published related work. Start with your idea, inspect real articles, then check the journal’s current author instructions.</p>
      <p className="muted">Your title and abstract stay on this device. Only the editable search query is sent to OpenAlex when you search. This free tool does not predict acceptance or independently verify journal quality.</p>
      <label className="field"><span>Manuscript title</span><input value={draft.title} maxLength={300} onChange={event => edit({ title: event.target.value })} /></label>
      <label className="field"><span>Draft abstract (optional)</span><textarea aria-label="Draft abstract (optional)" value={draft.abstract} maxLength={5000} rows={4} onChange={event => edit({ abstract: event.target.value })} /></label>
      <label className="field"><span>Keywords (optional)</span><input value={draft.keywords} maxLength={500} onChange={event => edit({ keywords: event.target.value })} /></label>
      <button className="button secondary" onClick={() => edit({ query: prepareJournalQuery(draft.title, draft.abstract, draft.keywords) })}>Prepare search query</button>
      <label className="field"><span>Query to send to OpenAlex</span><input value={draft.query} maxLength={300} onChange={event => edit({ query: event.target.value })} /></label>
      <button className="button" disabled={busy || draft.query.trim().length < 3} onClick={() => void search()}>{busy ? 'Finding related articles…' : 'Find candidate journals'}</button>
    </div>
    {notice && <p className="notice" role="status">{notice}</p>}
    {suggestions.length > 0 && <p>Ordered by the number and relevance positions of related articles in this search. Quartiles are a separate journal measure, not proof of fit. Showing up to six candidates.</p>}
    {suggestions.slice(0, 6).map(item => { const identity = identities[item.key]; return <article className="panel" key={item.key}>
      <PublicationIdentity title={item.title} publisher={identity?.publisher ?? item.publisher} type="journal" />
      <QuartileBadge value={item.papers[0].paper.journalQuartile} /><JournalFee fee={identity?.fee} />
      <p>{item.papers.length} related article{item.papers.length === 1 ? '' : 's'} · Matched by {item.identityBasis} · ISSN: {item.issns.join(', ') || 'not supplied'}</p>
      <p className="muted">OpenAlex query: “{item.run.userQuery}” · Retrieved {new Date(item.run.completedAt).toLocaleString()}</p>
      <details><summary>Inspect supporting articles</summary><ol>{item.papers.map(({ paper, position }) => <li key={paper.id}><External href={paper.url}>{paper.title}</External> · {paper.year ?? 'Year unknown'} · Search position {position}</li>)}</ol></details>
      {item.issns.length > 0 && <button className="button secondary" onClick={() => void identify(item)}>Check journal identity & listed fees</button>}
      {identity && <p>OpenAlex identity checked {new Date(identity.checkedAt).toLocaleDateString()}. {identity.homepage && <External href={identity.homepage}>Journal website</External>} Provider-reported DOAJ listing: {identity.inDoaj == null ? 'unknown' : identity.inDoaj ? 'yes' : 'no'}. Verify current indexing independently.</p>}
      <p>Before submitting: check aims and scope, accepted article types, editorial board, review policy, current fees and waivers. A missing fee is unknown, not free.</p>
      <button className="button" onClick={() => save(item)}>{project ? 'Save to journal shortlist' : 'Choose a project to save'}</button>
    </article>; })}
  </section>;
}
