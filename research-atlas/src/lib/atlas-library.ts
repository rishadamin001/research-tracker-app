import { normalizeDoi, paperSchema, type Paper, type Project } from './model';
import { orderPapers, type PaperOrder } from './ranking';

export type LibraryLink = { projectId: string; projectTitle: string; paperId: string; paper: Paper };
export type LibraryEntry = { key: string; paper: Paper; links: LibraryLink[]; tags: string[]; sources: string[] };

export function libraryIdentity(paper: Pick<Paper, 'doi' | 'id'>) {
  if (paper.doi) { try { return `doi:${normalizeDoi(paper.doi)}`; } catch { /* Retain an unrecognized DOI as metadata; do not merge by it. */ } }
  return `id:${paper.id}`;
}

export function collectLibrary(projects: Project[]): LibraryEntry[] {
  const entries = new Map<string, LibraryEntry>();
  for (const project of projects) for (const [index, paper] of project.papers.entries()) {
    const identity = libraryIdentity(paper);
    const key = identity === 'id:' ? `unidentified:${project.id}:${index}` : identity;
    let entry = entries.get(key);
    if (!entry) { entry = { key, paper, links: [], tags: [], sources: [] }; entries.set(key, entry); }
    entry.links.push({ projectId: project.id, projectTitle: project.title, paperId: paper.id, paper });
    entry.tags = [...new Set([...entry.tags, ...(paper.tags ?? [])])];
    if (!entry.sources.includes(paper.source)) entry.sources.push(paper.source);
  }
  return [...entries.values()];
}

export function filterLibrary(entries: LibraryEntry[], search: string, projectId: string, status: string, order: PaperOrder) {
  const query = search.trim().toLocaleLowerCase();
  const selected = entries.filter(entry => {
    const links = projectId ? entry.links.filter(link => link.projectId === projectId) : entry.links;
    return links.length > 0 && (!status || links.some(link => (link.paper.readingStatus ?? 'unread') === status))
      && (!query || [...entry.links.flatMap(link => [link.paper.title, link.paper.authors, link.paper.doi ?? '', link.paper.journal]), ...entry.tags].join(' ').toLocaleLowerCase().includes(query));
  });
  // Reuse the existing, tested quartile/date/cost ordering without conflating distinct records sharing an id.
  const byKey = new Map(selected.map(entry => [entry.key, entry]));
  return orderPapers(selected.map(entry => ({ ...entry.paper, id: entry.key })), order).map(paper => byKey.get(paper.id)!);
}

export function linkLibraryEntry(projects: Project[], entry: LibraryEntry, targetProjectId: string): Project[] {
  const target = projects.find(project => project.id === targetProjectId);
  if (!target) throw Error('Choose an existing project to link this reference.');
  if (entry.key.startsWith('unidentified:')) throw Error('This reference needs a usable DOI or record identifier before it can be linked across projects.');
  if (target.papers.some(paper => libraryIdentity(paper) === entry.key)) return projects;
  if (target.papers.some(paper => paper.id === entry.paper.id)) throw Error('Another reference in this project uses that record identifier. Review the conflicting metadata before linking.');
  if (target.papers.length >= 2000) throw Error('This project has reached its 2,000-reference limit.');
  if (entry.tags.length > 20) throw Error('This source has more than 20 combined tags. Save a smaller tag list before linking it.');
  const origin = entry.links[0];
  if (!origin || !projects.some(project => project.id === origin.projectId && project.papers.some(paper => paper.id === origin.paperId))) throw Error('This reference changed. Reopen the Library before linking it.');
  const paper = paperSchema.parse({ ...entry.paper,
    notes: '', researchProblem: '', dataset: '', finding: '', methods: '', limitations: '', locator: '', decision: 'unreviewed', reason: '',
    screeningEvents: undefined, screeningDraft: undefined, evidenceClaims: undefined,
    readingStatus: entry.paper.readingStatus ?? 'unread', tags: entry.tags,
    libraryLinkProvenance: { fromProjectId: origin.projectId, fromProjectTitle: origin.projectTitle, linkedAt: new Date().toISOString() },
  });
  return projects.map(project => project.id === targetProjectId ? { ...project, papers: [...project.papers, paper] } : project);
}

export function updateLibraryEntry(projects: Project[], key: string, patch: Pick<Partial<Paper>, 'readingStatus' | 'tags'>): Project[] {
  const validated = paperSchema.shape.tags.safeParse(patch.tags);
  if (!validated.success) throw Error('Use at most 20 tags, each between 1 and 60 characters.');
  if (patch.readingStatus !== undefined && !['unread', 'reading', 'read'].includes(patch.readingStatus)) throw Error('Choose a recognized reading status.');
  const entry = collectLibrary(projects).find(item => item.key === key);
  if (!entry) throw Error('This reference changed. Reopen the Library before editing it.');
  const linkedPapers = new Set(entry.links.map(link => link.paper));
  const normalized = { ...(patch.readingStatus !== undefined ? { readingStatus: patch.readingStatus } : {}), ...(patch.tags !== undefined ? { tags: validated.data } : {}) };
  return projects.map(project => {
    let changed = false;
    const papers = project.papers.map(paper => {
      if (!linkedPapers.has(paper)) return paper;
      changed = true;
      return { ...paper, ...normalized };
    });
    return changed ? { ...project, papers } : project;
  });
}

export function parseLibraryTags(raw: string) {
  return [...new Set(raw.split(',').map(tag => tag.trim()).filter(Boolean))];
}
