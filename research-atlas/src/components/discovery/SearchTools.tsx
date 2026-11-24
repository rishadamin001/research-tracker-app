import { CircleHelp, Globe, SlidersHorizontal } from 'lucide-react';
export type SearchTool = 'filters' | 'tips' | 'databases';
export const searchToolNames = { filters: 'Filters', tips: 'Search tips', databases: 'Search other databases' } as const;
const icons = { filters: SlidersHorizontal, tips: CircleHelp, databases: Globe };
export function SearchTools({ count, onOpen }: { count: number; onOpen: (tool: SearchTool) => void }) {
  return <div className="search-tools" role="group" aria-label="Search tools">{(Object.keys(icons) as SearchTool[]).map(key=>{
    const Icon=icons[key];
    return <button key={key} type="button" aria-haspopup="dialog" className="button secondary small" onClick={()=>onOpen(key)}><Icon size={16}/>{searchToolNames[key]}{key==='filters' && <span className="filter-count">{count}</span>}</button>;
  })}</div>;
}
