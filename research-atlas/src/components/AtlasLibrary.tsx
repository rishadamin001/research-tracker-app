import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { BookOpen, Link2, Search } from 'lucide-react';
import type { Paper, Project } from '@/lib/model';
import { collectLibrary, correctLibraryMetadata, filterLibrary, linkLibraryEntry, parseLibraryTags, referenceMetadataFields, updateLibraryEntry, type LibraryEntry, type LibraryLink } from '@/lib/atlas-library';
import { paperOrderLabels } from '@/lib/ranking';
import { External } from './External';
import { RelatedDiscovery } from './EvidenceWorkspace';
import { OrderSelect, PaperImpact, PaperOrderHelp, PublicationIdentity, usePaperOrder } from './RankingControls';
import { ReferenceExchange } from './ReferenceExchange';
import './atlas-library.css';

type Props = {
  projects: Project[];
  activeProjectId: string;
  ready: boolean;
  onChangeProjects: (projects: Project[]) => void;
  onOpenProject: (id: string) => void;
  onCreateProject: (onCreated?: (id: string) => void) => void;
  onFindPapers: () => void;
  notify: (message: string) => void;
};

function ReferenceMetadataEditor({ link, projects, onSave, onCancel }: { link: LibraryLink; projects: Project[]; onSave: (projects: Project[]) => void; onCancel: () => void }) {
  const heading = useId();
  const titleInput = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState(() => referenceMetadataFields(link.paper));
  const [refreshDraft, setRefreshDraft] = useState(true);
  const [error, setError] = useState('');
  const field = (name: keyof typeof fields, value: string) => setFields(current => ({ ...current, [name]: value }));
  const unsaved = JSON.stringify(fields) !== JSON.stringify(referenceMetadataFields(link.paper));
  useEffect(() => { titleInput.current?.focus(); }, []);
  return <form aria-labelledby={heading} onSubmit={event => {
    event.preventDefault();
    try { onSave(correctLibraryMetadata(projects, link, fields, refreshDraft)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save the reference details.'); }
  }}>
    <h3 id={heading}>Edit reference in {link.projectTitle}</h3>
    <label className="field"><span>Reference title</span><input ref={titleInput} required maxLength={20000} value={fields.title} onChange={event => field('title', event.target.value)} /></label>
    <div className="field"><label htmlFor={`${heading}-authors`}>Authors, one name per line</label><textarea id={`${heading}-authors`} rows={3} maxLength={20000} value={fields.authors} onChange={event => field('authors', event.target.value)} /></div>
    <div className="two-col">
      <label className="field"><span>Publication name</span><input maxLength={20000} value={fields.journal} onChange={event => field('journal', event.target.value)} /></label>
      <label className="field"><span>Publication year</span><input inputMode="numeric" maxLength={4} value={fields.year} onChange={event => field('year', event.target.value)} /></label>
    </div>
    <label className="field"><span>Publisher</span><input maxLength={500} value={fields.publisher} onChange={event => field('publisher', event.target.value)} /></label>
    <p className="muted">Changing the publication name clears the previous venue identifiers, quartile and publishing-fee estimate.</p>
    <label className="checkbox"><input type="checkbox" checked={refreshDraft} onChange={event => setRefreshDraft(event.target.checked)} /> Update linked Writing Studio references in this project</label>
    {unsaved && <p className="muted">Reference details have unsaved changes.</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="button-row">
      <button type="submit" className="button">Save reference details</button>
      <button type="button" className="button secondary" onClick={onCancel}>Cancel editing</button>
    </div>
  </form>;
}

function LibraryRecord({ entry, projects, activeProjectId, onChangeProjects, onOpenProject, notify }: Props & { entry: LibraryEntry }) {
  const [target, setTarget] = useState(activeProjectId);
  const savedTags = entry.tags.join(', ');
  const [tagDraft, setTagDraft] = useState<{ value: string; base: string } | null>(null);
  const [metadataTarget, setMetadataTarget] = useState<LibraryLink | null>(null);
  const metadataSummary = useRef<HTMLElement>(null);
  const tags = tagDraft?.value ?? savedTags;
  const tagsChanged = tagDraft !== null && tagDraft.base !== savedTags;
  const linkedIds = new Set(entry.links.map(link => link.projectId));
  const statuses = [...new Set(entry.links.map(link => link.paper.readingStatus ?? 'unread'))];
  const readingStatus = statuses.length === 1 ? statuses[0] : '';
  const activeProject = projects.find(project => project.id === activeProjectId);
  const metadataVaries = entry.links.some(link => ['title', 'authors', 'year', 'journal', 'publisher'].some(field => link.paper[field as keyof Paper] !== entry.paper[field as keyof Paper]));
  function apply(patch: Pick<Partial<Paper>, 'readingStatus' | 'tags'>) {
    try { onChangeProjects(updateLibraryEntry(projects, entry.key, patch)); notify('Library organization updated across linked projects. Project notes and screening decisions stay separate.'); return true; }
    catch (error) { notify(error instanceof Error ? error.message : 'Could not update this reference.'); return false; }
  }
  function closeMetadataEditor() {
    setMetadataTarget(null);
    metadataSummary.current?.focus();
  }
  return <article className="panel library-record" aria-label={`Library reference: ${entry.paper.title}`}>
    <div className="library-record-heading"><div><span className="eyebrow">{entry.paper.publicationDate ?? entry.paper.year ?? 'DATE UNKNOWN'}</span><h2>{entry.paper.title}</h2><p>{entry.paper.authors || 'Authors unavailable'}</p></div><span className="tag">{linkedIds.size} project{linkedIds.size === 1 ? '' : 's'}</span></div>
    <PublicationIdentity title={entry.paper.journal} publisher={entry.paper.publisher} type={entry.paper.venueType} />
    <PaperImpact paper={entry.paper} />
    <p className="muted">Source: {entry.sources.join(' · ')}{entry.paper.doi ? ` · DOI ${entry.paper.doi}` : ` · Record ${entry.paper.id}`}</p>
    <div className="button-row"><External href={entry.paper.url}>Open source</External>{entry.paper.oa && entry.paper.oa !== entry.paper.url && <External href={entry.paper.oa}>Read open copy</External>}</div>
    <div className="library-project-links"><strong>Used in</strong>{[...linkedIds].map(id => { const link = entry.links.find(item => item.projectId === id)!; return <button type="button" className="text-button" key={id} onClick={() => onOpenProject(id)}>Open {link.projectTitle}</button>; })}</div>
    <details><summary ref={metadataSummary}>Edit reference details</summary>
      {metadataTarget ? <ReferenceMetadataEditor link={metadataTarget} projects={projects} onCancel={closeMetadataEditor} onSave={items => {
        onChangeProjects(items);
        closeMetadataEditor();
        notify(`Reference details updated in ${metadataTarget.projectTitle}.`);
      }} /> : <div className="button-row">{entry.links.map((link, index) => <button type="button" className="button secondary" key={`${link.projectId}-${link.paperId}-${index}`} onClick={() => setMetadataTarget(link)}>Edit in {link.projectTitle}</button>)}</div>}
    </details>
    <details><summary>Organize this reference</summary><p>Reading status and tags apply to all linked copies. Evidence, notes, and screening decisions remain specific to each project.</p>
      <div className="two-col"><label className="field"><span>Reading status</span><select value={readingStatus} onChange={event => apply({ readingStatus: event.target.value as Paper['readingStatus'] })}>{readingStatus === '' && <option value="">Different statuses across projects</option>}<option value="unread">Unread</option><option value="reading">Reading</option><option value="read">Read</option></select></label>
      <div><label className="field"><span>Tags, separated by commas</span><input value={tags} maxLength={1250} onChange={event => setTagDraft({ value: event.target.value, base: tagDraft?.base ?? savedTags })} placeholder="Methods, housing, Bangladesh" /></label><button type="button" className="button secondary small" disabled={tagsChanged} onClick={() => { if (apply({ tags: parseLibraryTags(tags) })) setTagDraft(null); }}>Save tags</button>{tagsChanged && <p role="status">The saved tags changed while you were editing. Keep a copy of your draft before <button type="button" className="text-button" onClick={() => setTagDraft(null)}>Load current tags</button>.</p>}</div></div>
      <h3>Link to another project</h3><p>Copy bibliographic information into the project’s reference list. The new project starts with an unreviewed decision and empty evidence notes.</p>
      <div className="library-link-control"><label className="field"><span>Link reference to project</span><select value={target} onChange={event => setTarget(event.target.value)}><option value="">Choose project</option>{projects.map(project => <option key={project.id} value={project.id}>{project.title}{linkedIds.has(project.id) ? ' · already linked' : ''}</option>)}</select></label><button type="button" className="button secondary" disabled={!target || linkedIds.has(target)} onClick={() => { try { onChangeProjects(linkLibraryEntry(projects, entry, target)); notify('Reference linked. Screen it within the destination project before relying on it.'); } catch (error) { notify(error instanceof Error ? error.message : 'Could not link this reference.'); } }}><Link2 size={15} aria-hidden="true" />Link reference</button></div>
      <h3>Project-specific records</h3>{metadataVaries && <p>Some linked copies contain different bibliographic values. Atlas displays one project copy above and retains each project’s original metadata below; it does not silently reconcile them.</p>}<ul>{entry.links.map((link, index) => <li key={`${link.projectId}-${link.paperId}-${index}`}><strong>{link.projectTitle}</strong>: {link.paper.decision} · {link.paper.evidenceClaims?.length ?? 0} evidence claims{link.paper.libraryLinkProvenance && <> · linked from {link.paper.libraryLinkProvenance.fromProjectTitle} on {new Date(link.paper.libraryLinkProvenance.linkedAt).toLocaleDateString()}</>}{metadataVaries && <p className="muted">{link.paper.title} · {link.paper.authors} · {link.paper.year ?? 'Year unknown'} · {link.paper.journal}</p>}</li>)}</ul>
    </details>
    <div className="library-connections"><p><strong>What came before? What came after?</strong> Explore earlier references and later citing papers from this source. These are suggestions to inspect.</p>{activeProject && <p className="muted">Related papers saved here go to the active project: <strong>{activeProject.title}</strong>.</p>}<RelatedDiscovery paper={entry.paper} project={activeProject} update={activeProject ? patch => onChangeProjects(projects.map(project => project.id === activeProject.id ? { ...project, ...patch } : project)) : undefined} notify={notify} /></div>
  </article>;
}

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
