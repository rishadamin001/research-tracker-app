'use client';

import { useState } from 'react';
import { type Paper } from '@/lib/model';
import { orderPapers, paperOrderLabels } from '@/lib/ranking';
import { External } from '@/components/shared/External';
import { PaperScreening, ScreeningCriteria } from './EvidenceLedger';
import { decisionLabels, type ScreeningEvent } from '@/lib/evidence-ledger';
import { OrderSelect, PaperImpact, PaperOrderHelp, PublicationIdentity, usePaperOrder } from '@/components/shared/publication/RankingControls';
import type { EvidenceWorkspaceProps } from './evidence-workspace-types';
import { EvidencePaperPanel } from './EvidencePaperPanel';
import { PaperPublished } from '@/components/discovery/PaperPublished';
import { DiscoverySourceLinks } from '@/components/discovery/DiscoverySourceLinks';
import { CitationNeighborhood } from './CitationNeighborhood';
import { PublicationTimeline } from './PublicationTimeline';

export function ScreenPapers({ project, update, onNote }: Pick<EvidenceWorkspaceProps, 'project' | 'update' | 'onNote'>) {
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
        <EvidencePaperPanel key={paper.id} title={paper.title} detail={<><PaperPublished paper={paper} /> · {decisionLabels[paper.decision]}{paper.decision !== 'unreviewed' && !paper.reason.trim() ? ' · Reason needed' : ''}</>}>
            <p>{paper.authors || 'Authors not supplied'}</p>
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <PaperImpact paper={paper} />
            <DiscoverySourceLinks paper={paper} />
            {onNote && <button type="button" className="button secondary small" onClick={() => onNote(paper.id)}>Add my note</button>}
          <PaperScreening quickActions paper={paper} criteria={criteria} onDraft={screeningDraft => update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, screeningDraft } : item) })} onRecord={event => recordDecision(paper, event)} />
            <button type="button" className="text-button danger" onClick={() => {
              if (window.confirm('Remove this paper, its screening history, and its saved evidence notes?')) {
                update({ papers: project.papers.filter(item => item.id !== paper.id) });
              }
            }}>Remove paper</button>
        </EvidencePaperPanel>
      ))}
      <CitationNeighborhood papers={project.papers} />
      <PublicationTimeline papers={project.papers} />
    </>
  );
}
