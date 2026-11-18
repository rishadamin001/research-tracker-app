'use client';

import { useState } from 'react';
import { type Project } from '@/lib/model';
import { readLocalSearches } from './local-search-history';
import { SearchLog } from './SearchLog';

export function SearchNotebook({ project, onReuse }: { project?: Project; onReuse: (search: Project['searches'][number]) => void }) {
  const [localSearches] = useState(readLocalSearches);
  const searches = project?.searches ?? localSearches;
  return <section><h2>Search notebook</h2><p>{project ? `Searches recorded for ${project.title}.` : 'The last 50 standalone searches recorded in this browser.'} Search records preserve the terms, filters, provider, pages and limitations. Reuse starts a fresh search with the recorded provider and filters when available. New results may differ.</p>
    {project && searches.length > 0 && <div className="panel"><h3>Sources found through your searches</h3>{searches.slice(-20).reverse().map((search, index) => {
      const ids = search.run?.resultIds;
      const saved = ids ? project.papers.filter(p => ids.includes(p.id)) : [];
      return <p key={search.run?.id ?? index}>“{search.query}” · {search.count} retrieved · {ids ? `${saved.length} currently saved · ${saved.filter(p=>p.decision !== 'unreviewed').length} with screening decisions` : 'Saved-source attribution was not recorded in this older search.'}</p>;
    })}<p className="muted">Counts describe current project records matched by returned IDs, not an immutable record of every save or removal.</p></div>}
    <SearchLog searches={searches} reuseSearch={onReuse} />
  </section>;
}
