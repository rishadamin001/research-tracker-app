import { useState } from 'react';
import type { Paper, Project } from '@/lib/model';
import { duplicatePairs, resolveDuplicate, undoDuplicate, type DuplicatePair } from '@/lib/duplicates';
import { External } from './External';

function Record({ paper, label }: { paper: Paper; label: string }) {
  return <article><span className="eyebrow">RECORD {label}</span><h3>{paper.title}</h3><p>{paper.authors} · {paper.year ?? 'Year unknown'}</p><p>{paper.journal} · {paper.source}</p><p>DOI: {paper.doi ?? 'Unknown'}</p><p>{paper.decision} · {paper.evidenceClaims?.length ?? 0} claims · {paper.screeningEvents?.length ?? 0} screening events</p><External href={paper.url}>Inspect source {label}</External></article>;
}

export function DuplicateReview({ project, update }: { project: Project; update: (patch: Partial<Project>) => void }) {
  const [message, setMessage] = useState('');
  const pairs = duplicatePairs(project);
  const history = project.duplicateReviews ?? [];
  function resolve(pair: DuplicatePair, action: 'a' | 'b' | 'both' | 'merge') {
    try { update(resolveDuplicate(project, pair, action)); setMessage(action === 'both' ? 'Both records kept. This pair is marked reviewed.' : 'Duplicate review recorded. The removed record is archived in this project and can be restored.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not resolve this pair.'); }
  }
  return <section className="panel duplicate-review" aria-label="Duplicate review"><h2>Review duplicate references</h2><p>Exact DOI matches and possible title, year, and author matches appear here. Nothing is combined automatically. Merging preserves both records in the review history; conflicting decisions become Maybe.</p>
    <p role="status">{message || `${pairs.length}${pairs.length === 50 ? '+' : ''} candidate pairs · ${history.length} recorded reviews`}</p>
    {!pairs.length && <p>No unreviewed duplicate candidates in this project.</p>}
    {pairs.map(pair => <details key={`${pair.a.id}|${pair.b.id}`}><summary>{pair.kind}: {pair.a.title}</summary><p>{pair.reason}</p><div className="duplicate-pair"><Record paper={pair.a} label="A" /><Record paper={pair.b} label="B" /></div><div className="button-row"><button className="button secondary" onClick={() => resolve(pair, 'a')}>Keep A</button><button className="button secondary" onClick={() => resolve(pair, 'b')}>Keep B</button><button className="button secondary" onClick={() => resolve(pair, 'both')}>Keep both</button><button className="button" onClick={() => resolve(pair, 'merge')}>Merge into A</button></div><p className="muted">Keep A/B archives the other record. Merge combines notes and histories while keeping A’s bibliographic metadata. Compare conflicting metadata before choosing.</p></details>)}
    {history.length > 0 && <details><summary>Duplicate review history ({history.length})</summary><p>Undo restores an archived record. If the kept record was edited after merging, those newer edits stay in place.</p><ol>{[...history].reverse().map(entry => <li key={entry.id}><p>{new Date(entry.at).toLocaleString()} · {entry.action === 'merge' ? 'Merged' : entry.action === 'both' ? 'Kept both' : `Kept ${entry.action.toUpperCase()}`} · {entry.sourceA} / {entry.sourceB}</p>{entry.undoneAt ? <span>Undone</span> : <button className="button secondary" onClick={() => { try { update(undoDuplicate(project, entry.id)); setMessage('Duplicate review undone.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Could not restore the record.'); } }}>Undo review</button>}</li>)}</ol></details>}
  </section>;
}
