import { useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { collectLibrary, filterLibrary } from '@/lib/atlas-library';
import { paperOrderLabels } from '@/lib/ranking';
import { OrderSelect, PaperOrderHelp, usePaperOrder } from '@/components/shared/publication/RankingControls';
import { ReferenceExchange } from './ReferenceExchange';
import './atlas-library.css';
import type { Props } from './atlas-library-props';
import { LibraryRecord } from './LibraryRecord';

export function AtlasLibrary(props: Props) {
  const { projects, activeProjectId, ready, onChangeProjects, onCreateProject, onFindPapers } = props;
  const [query, setQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [readingFilter, setReadingFilter] = useState('');
  const [page, setPage] = useState(0);
  const [importProjectId, setImportProjectId] = useState<string>();
  const [order, setOrder] = usePaperOrder();
  const entries = useMemo(() => collectLibrary(projects), [projects]);
  const filtered = useMemo(() => filterLibrary(entries, query, projectFilter, readingFilter, order), [entries, query, projectFilter, readingFilter, order]);
  const pageSize = 20;
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / pageSize) - 1));
  const shown = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const activeProject = projects.find(project => project.id === activeProjectId);
  const empty = entries.length === 0;
  const importing = activeProject !== undefined && importProjectId === activeProject.id;
  return <div className="atlas-library"><div className="page-heading"><div><span className="eyebrow">YOUR SHARED SOURCE VIEW</span><h1>Atlas Library</h1><p>Find a saved source once and see every project that uses it.</p></div><BookOpen size={28} aria-hidden="true" /></div>
    {ready && empty && <section className="panel" aria-labelledby="library-start-title">
      <h2 id="library-start-title">Your Library starts with a source</h2>
      <p>{activeProject ? <>Find papers to save or import a RIS or BibTeX file into <strong>{activeProject.title}</strong>.</> : 'You can search for papers now. Create a project to save papers or import a RIS or BibTeX file.'}</p>
      <div className="button-row">
        <a className="button secondary" href="#paper-search" onClick={onFindPapers}>Find papers</a>
        <button type="button" className="button secondary" aria-expanded={activeProject ? importing : undefined} aria-haspopup={activeProject ? undefined : 'dialog'} onClick={() => {
          if (activeProject) setImportProjectId(importing ? undefined : activeProject.id);
          else onCreateProject(setImportProjectId);
        }}>Import references</button>
        <button type="button" className="button secondary" aria-haspopup="dialog" onClick={() => onCreateProject()}>Create project</button>
      </div>
    </section>}
    {!empty && <section className="panel"><h2>All your project references</h2><p role="status">{entries.length} unique reference{entries.length === 1 ? '' : 's'} across {projects.length} project{projects.length === 1 ? '' : 's'}.</p>
      <label className="field"><span><Search size={15} aria-hidden="true" />Search your Library</span><input value={query} maxLength={300} onChange={event => { setQuery(event.target.value); setPage(0); }} placeholder="Title, author, DOI, journal, or tag" /></label>
      <div className="two-col"><label className="field"><span>Filter by project</span><select value={projectFilter} onChange={event => { setProjectFilter(event.target.value); setPage(0); }}><option value="">All projects</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}</select></label><label className="field"><span>Filter by reading status</span><select value={readingFilter} onChange={event => { setReadingFilter(event.target.value); setPage(0); }}><option value="">Any reading status</option><option value="unread">Unread</option><option value="reading">Reading</option><option value="read">Read</option></select></label></div>
      <OrderSelect label="Sort Library" labels={paperOrderLabels} order={order} onChange={value => { setOrder(value); setPage(0); }} /><PaperOrderHelp />
      <details><summary>How this Library works</summary><p>Atlas groups records with the same normalized DOI, or the same record identifier when a DOI is missing. One project copy supplies the displayed bibliography; the project records retain their original metadata. Near-matching titles are kept separate. The Library is a shared view of project references in this release; independent reference storage and automatic metadata reconciliation are future work.</p><p>Notes, evidence, and screening decisions belong to their projects. Removing a project can remove its final reference copy, so export a backup before deleting project records.</p></details>
    </section>}
    {activeProject && <ReferenceExchange key={activeProject.id} project={activeProject} importOnlyOpen={empty ? importing : undefined} onImport={papers => onChangeProjects(projects.map(project => project.id === activeProject.id ? { ...project, papers } : project))} />}
    {!empty && <>
      <p role="status">Showing {shown.length ? currentPage * pageSize + 1 : 0}–{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length} matching references.</p>
      {!filtered.length && <p className="panel">No references match these filters. Try a broader phrase or another project.</p>}
      {shown.map(entry => <LibraryRecord key={entry.key} {...props} entry={entry} />)}
      {filtered.length > pageSize && <nav className="button-row" aria-label="Library pages"><button type="button" className="button secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous page</button><span>Page {currentPage + 1} of {Math.ceil(filtered.length / pageSize)}</span><button type="button" className="button secondary" disabled={(currentPage + 1) * pageSize >= filtered.length} onClick={() => setPage(currentPage + 1)}>Next page</button></nav>}
    </>}
  </div>;
}
