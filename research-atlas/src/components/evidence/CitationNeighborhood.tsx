'use client';

import { useState } from 'react';
import { type Paper } from '@/lib/model';
import { External } from '@/components/shared/External';

export function CitationNeighborhood({ papers }: { papers: Paper[] }) {
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
