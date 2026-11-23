import { useRef, useState } from 'react';
import { Link2 } from 'lucide-react';
import type { Paper } from '@/lib/model';
import { linkLibraryEntry, parseLibraryTags, updateLibraryEntry, type LibraryEntry, type LibraryLink } from '@/lib/atlas-library';
import { External } from '@/components/shared/External';
import { RelatedDiscovery } from '@/components/discovery/RelatedDiscovery';
import { PaperImpact, PublicationIdentity } from '@/components/shared/publication/RankingControls';
import type { Props } from './atlas-library-props';
import { ReferenceMetadataEditor } from './ReferenceMetadataEditor';

export function LibraryRecord({ entry, projects, activeProjectId, onChangeProjects, onOpenProject, notify }: Props & { entry: LibraryEntry }) {
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
    <div className="library-project-links"><strong>Screen this source in</strong>{[...linkedIds].map(id => { const link = entry.links.find(item => item.projectId === id)!; return <button type="button" className="text-button" key={id} onClick={() => onOpenProject(id, link.paperId)}>Open {link.projectTitle}</button>; })}</div>
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
