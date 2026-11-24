'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { AtlasDialog } from '@/components/shared/AtlasDialog';
import { csvCell, type Project } from '@/lib/model';
import { download } from '@/lib/storage';
import { SearchRunDetails } from './SearchRunDetails';

export function SearchLog({ searches, reuseSearch, termsOnly = false }: { searches: Project['searches']; reuseSearch: (search: Project['searches'][number]) => void; termsOnly?: boolean }) {
  const [open,setOpen] = useState(false);
  return (
    <div className="search-activity"><button type="button" className="button secondary small" aria-haspopup="dialog" onClick={()=>setOpen(true)}><History size={16}/>Search activity ({searches.length})</button>
      {open && <AtlasDialog title="Search activity" sheet onClose={()=>setOpen(false)}>
      {searches.length === 0 && <p>Search attempts will appear here.</p>}
      {searches.length > 0 && <div className="button-row"><button type="button" className="button secondary small" onClick={() => download('search-history.json', JSON.stringify({ format: 'research-atlas-search-log', exportedAt: new Date().toISOString(), searches }, null, 2), 'application/json')}>Export search JSON</button><button type="button" className="button secondary small" onClick={() => download('search-history.csv', [['Provider', 'Entered query', 'Executed query', 'Filters', 'Completed at', 'Retrieved', 'Reported matches', 'Page numbers', 'Outcome'], ...searches.map(item => [item.source, item.run?.userQuery ?? item.query, item.run?.executedQuery ?? item.query, item.run?.filters.join(',') ?? item.filters, item.date, item.count, item.run?.resultCountReported, item.run?.pages.map(page => `${page.page}:${page.returnedCount ?? 'failed'}`).join(';'), item.run?.error?.message ?? 'completed'])].map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8')}>Export search CSV</button></div>}
      {searches.slice().reverse().map((search, index) => (
        <div className="audit" key={search.run?.id ?? `${search.date}-${index}`}>
          <p>{new Date(search.date).toLocaleString()} · {search.source} · “{search.query}” · {search.filters} · {search.run?.error ? 'Search failed' : `${search.count} results`}</p>
          {search.run && <SearchRunDetails run={search.run} />}
          <button type="button" className="text-button" onClick={() => { setOpen(false); requestAnimationFrame(()=>reuseSearch(search)); }}>{termsOnly ? 'Search these terms again' : search.run ? 'Reuse search terms and filters' : 'Reuse search terms'}</button>
        </div>
      ))}
      <p className="muted">This log records the searches run here. A systematic review may need additional databases and full search strategies.</p>
    </AtlasDialog>}</div>
  );
}
