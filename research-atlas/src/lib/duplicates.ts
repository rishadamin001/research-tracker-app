import { normalizeDoi, paperSchema, type Paper, type Project } from './model';

function identity(paper: Paper) { try { return paper.doi ? normalizeDoi(paper.doi) : ''; } catch { return ''; } }
function normalized(value: string) { return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function author(paper: Paper) { return normalized(paper.referenceAuthors?.[0] ?? paper.authors.split(',')[0]); }
export type DuplicatePair = { a: Paper; b: Paper; kind: 'Exact DOI' | 'Possible match'; reason: string };

export function duplicatePairs(project: Pick<Project, 'papers' | 'duplicateReviews'>) {
  const dismissed = new Set((project.duplicateReviews ?? []).filter(x => x.action === 'both' && !x.undoneAt).map(x => [x.keptId, x.otherId].sort().join('|')));
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < project.papers.length && pairs.length < 50; i++) {
    const a = project.papers[i];
    for (const b of project.papers.slice(i + 1)) {
      if (pairs.length >= 50) break;
      if (dismissed.has([a.id, b.id].sort().join('|'))) continue;
      if (identity(a) && identity(a) === identity(b)) { pairs.push({ a, b, kind: 'Exact DOI', reason: 'The normalized DOI is identical. Review the records before combining.' }); continue; }
      const ta = normalized(a.title), tb = normalized(b.title);
      if (!ta || !tb || !a.year || a.year !== b.year || !author(a) || author(a) !== author(b)) continue;
      const tokens = new Set(ta.split(' ')); const other = new Set(tb.split(' '));
      const intersection = [...tokens].filter(x => other.has(x)).length;
      const score = intersection / new Set([...tokens, ...other]).size;
      if (ta === tb || (tokens.size >= 5 && score >= .85)) pairs.push({ a, b, kind: 'Possible match', reason: 'Similar title with the same year and first author. This may be a distinct version or study.' });
    }
  }
  return pairs.slice(0, 50);
}

function mergeText(a: string, b: string) { return !a ? b : !b || a === b ? a : `${a}\n\n[From duplicate record]\n${b}`; }
function mergeHistory<T extends { id: string }>(a: T[] = [], b: T[] = []): T[] {
  const records = [...a];
  for (const candidate of b) {
    const sameId = records.find(record => record.id === candidate.id);
    if (!sameId) records.push(candidate);
    else if (JSON.stringify(sameId) !== JSON.stringify(candidate)) records.push({ ...candidate, id: crypto.randomUUID() });
  }
  return records;
}
function mergePapers(a: Paper, b: Paper): Paper {
  const combined = { ...a };
  for (const key of ['notes', 'finding', 'methods', 'limitations', 'locator', 'reason', 'researchProblem', 'dataset'] as const) combined[key] = mergeText(a[key], b[key]);
  combined.referenceIds = [...new Set([...(a.referenceIds ?? []), ...(b.referenceIds ?? [])])];
  combined.screeningEvents = mergeHistory(a.screeningEvents, b.screeningEvents);
  combined.evidenceClaims = mergeHistory(a.evidenceClaims, b.evidenceClaims);
  if (combined.screeningEvents.length > 60 || combined.evidenceClaims.length > 30 || Object.values(combined).some(x => typeof x === 'string' && x.length > 20000)) throw Error('Combined notes or history exceed the record limit. Keep both records instead.');
  // Conflicting screening decisions must be reconsidered by the researcher.
  if (a.decision !== b.decision) combined.decision = 'maybe';
  const validated = paperSchema.safeParse(combined);
  if (!validated.success) throw Error('The combined record exceeds a metadata or reference limit. Keep both records instead.');
  return validated.data;
}

export function resolveDuplicate(project: Project, pair: DuplicatePair, action: 'a' | 'b' | 'both' | 'merge'): Partial<Project> {
  if ((project.duplicateReviews?.length ?? 0) >= 50) throw Error('This project has reached 50 duplicate-review records. Export a backup before continuing in a new project.');
  if (pair.a.id === pair.b.id) throw Error('These records share an identifier. Keep a backup and resolve their identifiers before combining them.');
  if (!project.papers.some(x => x.id === pair.a.id) || !project.papers.some(x => x.id === pair.b.id)) throw Error('This pair changed. Review the current records again.');
  const kept = action === 'b' ? pair.b : pair.a;
  const removed = action === 'b' ? pair.a : pair.b;
  const result = action === 'merge' ? mergePapers(kept, removed) : kept;
  const entry = { id: crypto.randomUUID(), at: new Date().toISOString(), action, keptId: kept.id, otherId: removed.id, sourceA: pair.a.source, sourceB: pair.b.source,
    archived: action === 'both' ? undefined : removed, before: action === 'merge' ? kept : undefined, after: action === 'merge' ? result : undefined };
  return { papers: action === 'both' ? project.papers : project.papers.filter(x => x.id !== removed.id).map(x => x.id === kept.id ? result : x), duplicateReviews: [...(project.duplicateReviews ?? []), entry] };
}

export function undoDuplicate(project: Project, id: string): Partial<Project> {
  const entry = project.duplicateReviews?.find(x => x.id === id && !x.undoneAt);
  if (!entry) throw Error('This action was already undone.');
  let papers = project.papers;
  if (entry.archived) {
    if (papers.length >= 2000 || papers.some(x => x.id === entry.archived!.id)) throw Error('Cannot restore this record: the library is full or the record already exists.');
    if (entry.before && entry.after && JSON.stringify(papers.find(x => x.id === entry.keptId)) === JSON.stringify(entry.after)) papers = papers.map(x => x.id === entry.keptId ? entry.before! : x);
    papers = [...papers, entry.archived];
  }
  return { papers, duplicateReviews: project.duplicateReviews!.map(x => x.id === id ? { ...x, undoneAt: new Date().toISOString() } : x) };
}
