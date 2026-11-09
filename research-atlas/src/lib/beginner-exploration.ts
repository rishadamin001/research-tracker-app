import { disciplines } from './content';
import { normalizeDoi, type Paper, type Project } from './model';
import type { SearchRun } from './search-provenance';

export const beginnerSessionKey = 'atlas-beginner-exploration-v1';
export const beginnerApproaches = [
  { id: 'papers', title: 'Show what researchers have already studied', detail: 'Start with real papers and learn the words researchers use.' },
  { id: 'topics', title: 'Suggest a few possible research topics', detail: 'Try editable question prompts, then inspect related papers.' },
  { id: 'idea', title: 'Help me develop my own idea', detail: 'Add an optional setting or group and explore the literature.' },
] as const;
export type BeginnerApproach = typeof beginnerApproaches[number]['id'];
export type BeginnerStarter = {
  step: 1 | 2 | 3; interest: string; discipline: string; approach: BeginnerApproach;
  direction: 'experiences' | 'patterns' | 'evaluation'; context: string; title: string; questionDraft: string;
};
export const emptyBeginnerStarter = (): BeginnerStarter => ({ step: 1, interest: '', discipline: '', approach: 'papers', direction: 'patterns', context: '', title: '', questionDraft: '' });

/** Store only bounded tab-local choices, never provider responses or source notes. */
export function parseBeginnerStarter(raw: unknown): BeginnerStarter {
  const empty = emptyBeginnerStarter();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return empty;
  const value = raw as Record<string, unknown>;
  const text = (key: string, limit: number) => typeof value[key] === 'string' ? value[key].slice(0, limit) : '';
  const interest = text('interest', 180);
  return { step: interest.trim().length >= 3 && (value.step === 2 || value.step === 3) ? value.step : 1,
    interest, discipline: disciplines.some(field => field.name === value.discipline) ? String(value.discipline) : '',
    approach: beginnerApproaches.some(item => item.id === value.approach) ? value.approach as BeginnerApproach : 'papers',
    direction: ['experiences', 'patterns', 'evaluation'].includes(String(value.direction)) ? value.direction as BeginnerStarter['direction'] : 'patterns',
    context: text('context', 80), title: text('title', 200), questionDraft: text('questionDraft', 2000) };
}
export function beginnerDirections(interest: string) {
  return [
    { id: 'experiences', title: 'People and experiences', query: `${interest.trim()} experiences`, prompt: `How do people experience ${interest.trim()} in a setting I can examine?` },
    { id: 'patterns', title: 'Practices and patterns', query: `${interest.trim()} outcomes`, prompt: `What patterns are reported about ${interest.trim()}, and in which settings?` },
    { id: 'evaluation', title: 'Tools and possible solutions', query: `${interest.trim()} evaluation`, prompt: `How have approaches to ${interest.trim()} been evaluated?` },
  ] as const;
}
export type BeginnerAngle = { id: string; title: string; query: string; explanation: string };
export function beginnerAngles(starter: BeginnerStarter): BeginnerAngle[] {
  const interest = starter.interest.trim();
  if (starter.approach === 'topics') {
    const direction = beginnerDirections(interest).find(item => item.id === starter.direction)!;
    return [{ id: 'interest', title: 'Your interest', query: interest, explanation: 'A broad first look before narrowing your topic.' },
      { id: 'direction', title: direction.title, query: direction.query, explanation: 'A search angle to investigate, not a verified theme or a new research gap.' }];
  }
  const query = starter.approach === 'idea' ? [interest, starter.context.trim()].filter(Boolean).join(' ') : interest;
  return [{ id: 'interest', title: starter.approach === 'idea' ? 'Your idea and setting' : 'Start with your interest', query, explanation: 'Inspect the actual title, source and abstract before deciding whether a paper fits.' },
    { id: 'overview', title: 'Look for overviews', query: `${query} review`, explanation: 'The added word “review” is a search term. It does not establish that every result is a review article.' }];
}
export function beginnerPaperKey(paper: Paper) {
  if (paper.doi) { try { return `doi:${normalizeDoi(paper.doi)}`; } catch { /* Retain the provider identifier if a DOI cannot be normalized. */ } }
  return `id:${paper.id}`;
}
export type BeginnerGroup = BeginnerAngle & { papers: Paper[]; run?: SearchRun; error?: string; pending?: boolean };
export function beginnerExamples(groups: BeginnerGroup[]) {
  const seen = new Set<string>();
  return groups.map(group => {
    const papers = group.papers.filter(paper => { const key = beginnerPaperKey(paper); if (seen.has(key)) return false; seen.add(key); return true; });
    return { ...group, examples: papers.slice(0, 3), overlap: group.papers.length - papers.length };
  });
}
export function beginnerSearchRecord(run: SearchRun): Project['searches'][number] {
  return { query: run.executedQuery, source: run.provider, date: run.completedAt,
    count: run.resultIds?.length ?? run.pages.reduce((count, page) => count + (page.returnedCount ?? 0), 0), filters: run.filters.join(' · '), run };
}
export type BeginnerProjectSeed = Pick<Project, 'title' | 'discipline' | 'topic' | 'goal' | 'papers' | 'searches'> & { experience: 'Beginner'; questionDraft?: string };
export function beginnerProjectSeed(starter: BeginnerStarter, groups: BeginnerGroup[], selected: readonly string[], searches: Project['searches']): BeginnerProjectSeed {
  const wanted = new Set(selected), seen = new Set<string>();
  const papers = groups.flatMap(group => group.papers).filter(paper => {
    const key = beginnerPaperKey(paper); if (!wanted.has(key) || seen.has(key)) return false; seen.add(key); return true;
  }).map(paper => ({ ...paper, decision: 'unreviewed' as const, reason: '' }));
  return { title: starter.title.trim() || `Exploring ${starter.interest.trim()}`, discipline: starter.discipline,
    topic: starter.interest.trim(), goal: 'Exploring a topic', experience: 'Beginner', papers, searches,
    ...(starter.questionDraft.trim() ? { questionDraft: starter.questionDraft.trim() } : {}) };
}
