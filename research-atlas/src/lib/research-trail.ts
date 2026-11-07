import { z } from 'zod';
import type { Project, Stage } from './model';

export const questionVersionLimit = 200;
export const projectEventLimit = 1000;
const stages = z.enum(['profile', 'topic', 'question', 'discover', 'screen', 'extract', 'methods', 'data', 'writing', 'publication']);
export const questionVersionSchema = z.object({
  id: z.uuid(), version: z.number().int().positive(), recordedAt: z.iso.datetime(),
  wording: z.string().max(20000), reason: z.string().max(2000),
  origin: z.enum(['recorded', 'legacy-baseline']),
  affectedStages: z.array(stages).max(10), affectedPaperIds: z.array(z.string().max(500)).max(2000),
  affectedClaimCount: z.number().int().nonnegative(),
});
export type QuestionVersion = z.infer<typeof questionVersionSchema>;
export const projectEventKinds = {
  PROJECT_CREATED: 'Project created', QUESTION_CREATED: 'Question recorded', QUESTION_CHANGED: 'Question revised',
  SEARCH_RUN: 'Search run', REFERENCE_SAVED: 'Reference saved', REFERENCE_REMOVED: 'Reference removed',
  REFERENCE_MERGED: 'Duplicate review', SCREENING_DECISION: 'Screening decision', EVIDENCE_CREATED: 'Evidence recorded',
  EVIDENCE_CHANGED: 'Evidence updated', METHOD_CHANGED: 'Methods changed', DATA_PLAN_CHANGED: 'Data plan changed',
  MANUSCRIPT_CHANGED: 'Writing updated', VENUE_CHANGED: 'Publication plan changed', DECISION_RECORDED: 'Decision recorded',
} as const;
export type ProjectEventKind = keyof typeof projectEventKinds;
export const projectEventSchema = z.object({
  id: z.uuid(), kind: z.enum(Object.keys(projectEventKinds) as [ProjectEventKind, ...ProjectEventKind[]]),
  at: z.iso.datetime(), updatedAt: z.iso.datetime(), detail: z.string().max(2000),
  entityId: z.string().max(500).optional(), source: z.enum(['recorded', 'existing-record']),
});
export type ProjectEvent = z.infer<typeof projectEventSchema>;

export function makeProjectEvent(kind: ProjectEventKind, detail: string, at: string, entityId?: string): ProjectEvent {
  return { id: crypto.randomUUID(), kind, at, updatedAt: at, detail: detail.slice(0, 2000), entityId, source: 'recorded' };
}

export function versionQuestion(project: Project, next: Project, at: string, affectedStages: Stage[], reason = '') {
  const existing = [...(project.questionVersions ?? [])];
  // The timestamp is when Atlas captured the older text, not a fabricated original edit date.
  if (!existing.length && project.question.trim()) existing.push({
    id: crypto.randomUUID(), version: 1, recordedAt: at, wording: project.question,
    reason: 'Current wording captured when version tracking began; its original edit time was not recorded.',
    origin: 'legacy-baseline', affectedStages: [], affectedPaperIds: [], affectedClaimCount: 0,
  });
  if (existing.length >= questionVersionLimit) return undefined;
  const papers = project.papers.filter(paper => paper.evidenceClaims?.some(claim => claim.reviewStatus === 'reviewed'));
  existing.push({
    id: crypto.randomUUID(), version: (existing.at(-1)?.version ?? 0) + 1, recordedAt: at,
    wording: next.question, reason: reason.trim().slice(0, 2000) || (project.question.trim() ? 'Reason not recorded.' : 'Initial research question.'),
    origin: 'recorded', affectedStages, affectedPaperIds: papers.map(paper => paper.id),
    affectedClaimCount: papers.reduce((count, paper) => count + (paper.evidenceClaims?.filter(claim => claim.reviewStatus === 'reviewed').length ?? 0), 0),
  });
  return existing;
}

function different(a: unknown, b: unknown) { return JSON.stringify(a) !== JSON.stringify(b); }

export function recordProjectChanges(project: Project, next: Project, patch: Partial<Project>, at: string): ProjectEvent[] {
  const events = [...(project.projectEvents ?? [])];
  if (!events.length) events.push({ ...makeProjectEvent('PROJECT_CREATED', 'Project record available. Earlier activity is shown from dated source records where available.', Number.isFinite(Date.parse(project.createdAt)) ? new Date(project.createdAt).toISOString() : at), source: 'existing-record' });
  function add(kind: ProjectEventKind, detail: string, entityId?: string, coalesce = false) {
    const latest = events.at(-1);
    // Consecutive typing edits become one draft-edit session; committed questions and individual decisions never coalesce.
    if (coalesce && latest?.kind === kind && latest.entityId === entityId && Date.parse(at) - Date.parse(latest.updatedAt) <= 30_000 && Date.parse(at) >= Date.parse(latest.updatedAt)) {
      events[events.length - 1] = { ...latest, detail: detail.slice(0, 2000), updatedAt: at };
    } else events.push(makeProjectEvent(kind, detail, at, entityId));
  }
  if (patch.question !== undefined && project.question.trim() !== next.question.trim()) add(project.question.trim() ? 'QUESTION_CHANGED' : 'QUESTION_CREATED', `Question version ${next.questionVersions?.at(-1)?.version ?? 1}: ${next.question.slice(0, 1600)}`, next.questionVersions?.at(-1)?.id);
  for (const search of next.searches) {
    const before = project.searches.find(item => search.run?.id ? item.run?.id === search.run.id : item === search);
    if (!before || different(before.run, search.run)) add('SEARCH_RUN', `${search.source}: “${search.query.slice(0, 250)}” · ${search.count} retrieved${search.run ? ` · ${search.run.pages.filter(page => page.returnedCount !== undefined).length} pages${search.run.error ? ' · provider failure recorded' : ''}` : ''}`, search.run?.id, true);
  }
  const previousPapers = new Map(project.papers.map(paper => [paper.id, paper]));
  for (const paper of next.papers) {
    const before = previousPapers.get(paper.id);
    if (!before) { add('REFERENCE_SAVED', `${paper.title.slice(0, 1600)} · ${paper.source}`, paper.id); continue; }
    const oldScreening = new Set(before.screeningEvents?.map(event => event.id));
    const newScreening = paper.screeningEvents?.filter(event => !oldScreening.has(event.id)) ?? [];
    for (const screening of newScreening) add('SCREENING_DECISION', `${paper.title.slice(0, 500)} · ${screening.stage === 'full_text' ? 'Full text' : 'Title / abstract'} · ${screening.decision} · ${screening.reason.slice(0, 800)}`, screening.id);
    if (!newScreening.length && (paper.decision !== before.decision || paper.reason !== before.reason)) add('SCREENING_DECISION', `${paper.title.slice(0, 500)} · ${paper.decision} · ${paper.reason.slice(0, 800)}`, paper.id, true);
    const oldClaims = new Map(before.evidenceClaims?.map(claim => [claim.id, claim]));
    for (const claim of paper.evidenceClaims ?? []) {
      const earlier = oldClaims.get(claim.id);
      if (!earlier || different(earlier, claim)) add(earlier ? 'EVIDENCE_CHANGED' : 'EVIDENCE_CREATED', `${paper.title.slice(0, 400)} · ${claim.claimText.slice(0, 900)} · ${claim.evidenceLevel} · ${claim.locator.slice(0, 250)} · ${claim.reviewStatus}`, claim.id, !!earlier);
    }
    if (['finding', 'methods', 'limitations', 'locator', 'dataset', 'researchProblem'].some(key => paper[key as keyof typeof paper] !== before[key as keyof typeof before])) add('EVIDENCE_CHANGED', `Extraction notes updated for ${paper.title.slice(0, 1600)}.`, paper.id, true);
  }
  for (const paper of project.papers) if (!next.papers.some(item => item.id === paper.id)) add('REFERENCE_REMOVED', `Removed from this project: ${paper.title.slice(0, 1500)}. Check duplicate review history for archived records.`, paper.id);
  for (const review of next.duplicateReviews ?? []) if (!project.duplicateReviews?.some(item => item.id === review.id && item.undoneAt === review.undoneAt)) add('REFERENCE_MERGED', `${review.undoneAt ? 'Undid' : 'Recorded'} duplicate review: ${review.action}. Original records are preserved in duplicate history.`, review.id);
  if (['design', 'sampling', 'instruments', 'ethics', 'ethicsStatus', 'analysis', 'methodContext'].some(key => different(project[key as keyof Project], next[key as keyof Project]))) add('METHOD_CHANGED', 'Study design, sampling, ethics, or analysis planning updated. Check the current Study fields and their conditions.', 'methods', true);
  if (different(project.structuredDmp, next.structuredDmp) || project.dataPlan !== next.dataPlan || project.analysisRecord !== next.analysisRecord) add('DATA_PLAN_CHANGED', 'Data management or analysis record updated.', 'data', true);
  if (project.manuscript !== next.manuscript) add('MANUSCRIPT_CHANGED', 'Manuscript draft updated.', 'writing', true);
  if (different(project.journalCandidates, next.journalCandidates) || different(project.researchPlan, next.researchPlan)) add('VENUE_CHANGED', 'Publication, submission, budget, or deadline plan updated.', 'publication', true);
  for (const decision of next.decisions) if (!project.decisions.some(item => item.at === decision.at && item.note === decision.note)) add('DECISION_RECORDED', decision.note, `${decision.at}-${decision.note.slice(0, 100)}`, false);
  return events.slice(-projectEventLimit);
}

export function projectHistory(project: Project): ProjectEvent[] {
  const recorded = project.projectEvents ?? [];
  const recordedLinks = new Set(recorded.filter(event => event.entityId).map(event => `${event.kind}|${event.entityId}`));
  const derived: ProjectEvent[] = [];
  const append = (kind: ProjectEventKind, at: string, detail: string, entityId?: string) => {
    if (!Number.isFinite(Date.parse(at)) || (entityId && recordedLinks.has(`${kind}|${entityId}`))) return;
    // Derived rows use stable identifiers and are labelled as existing records, not invented original events.
    derived.push({ id: `existing-${kind}-${entityId ?? at}` as ProjectEvent['id'], kind, at, updatedAt: at, detail, entityId, source: 'existing-record' });
  };
  if (!recorded.some(event => event.kind === 'PROJECT_CREATED')) append('PROJECT_CREATED', project.createdAt, 'Project created. Original source record.');
  for (const [index, search] of project.searches.entries()) append('SEARCH_RUN', search.date, `${search.source}: “${search.query.slice(0, 250)}” · ${search.count} retrieved`, search.run?.id ?? `legacy-search-${index}`);
  for (const paper of project.papers) {
    for (const event of paper.screeningEvents ?? []) append('SCREENING_DECISION', event.at, `${paper.title.slice(0, 450)} · ${event.stage} · ${event.decision} · ${event.reason.slice(0, 800)}`, event.id);
    for (const claim of paper.evidenceClaims ?? []) append('EVIDENCE_CREATED', claim.createdAt, `${paper.title.slice(0, 450)} · ${claim.claimText.slice(0, 900)} · ${claim.locator.slice(0, 200)}`, claim.id);
  }
  for (const decision of project.decisions) append('DECISION_RECORDED', decision.at, decision.note, `${decision.at}-${decision.note.slice(0, 100)}`);
  return [...recorded, ...derived].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}
