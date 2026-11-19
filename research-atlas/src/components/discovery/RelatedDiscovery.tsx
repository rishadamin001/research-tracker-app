'use client';

import { useEffect, useRef, useState } from 'react';
import { addPaper, type Paper, type Project } from '@/lib/model';
import { relatedPapers } from '@/lib/providers';
import { orderPapers } from '@/lib/ranking';
import { PaperImpact, PublicationIdentity } from '@/components/shared/publication/RankingControls';
import type { EvidenceWorkspaceProps } from '@/components/evidence/evidence-workspace-types';
import { DiscoverySourceLinks } from './DiscoverySourceLinks';

export function RelatedDiscovery({ paper, project, update, notify }: { paper: Paper; project?: Project; update?: EvidenceWorkspaceProps['update']; notify: EvidenceWorkspaceProps['notify'] }) {
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
    {papers.map(item => <section className="audit" key={item.id}><h5>{item.title}</h5><PublicationIdentity title={item.journal} publisher={item.publisher} type={item.venueType} /><PaperImpact paper={item} /><DiscoverySourceLinks paper={item} />{project && update && <button type="button" className="button secondary small" disabled={project.papers.length >= 2000 || project.papers.some(saved => saved.id === item.id || !!saved.doi && saved.doi === item.doi)} onClick={() => { const next = addPaper(project, item); update({ papers: next.papers }); notify('Related source saved. Screen it before treating it as evidence.'); }}>Save related paper</button>}</section>)}
  </details>;
}
