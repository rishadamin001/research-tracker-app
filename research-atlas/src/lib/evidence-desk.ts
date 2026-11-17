import { z } from 'zod';
import { screeningDecisionSchema } from './evidence-ledger';
import type { Paper, Project } from './model';

const sourceFilterKey = 'research-atlas-evidence-filters-v1';
const filterSchema = z.object({ query: z.string().max(300), decision: z.union([z.literal('all'), screeningDecisionSchema]) });
const savedFilterSchema = filterSchema.extend({ projectId: z.string().min(1).max(500) });
const filterCache = z.array(savedFilterSchema).max(100);
export type DeskSourceFilters = z.infer<typeof filterSchema>;
export const defaultDeskSourceFilters: DeskSourceFilters = { query: '', decision: 'all' };

function loadFilters(): z.infer<typeof filterCache> {
  try {
    const raw = localStorage.getItem(sourceFilterKey);
    if (!raw || raw.length > 100_000) return [];
    return filterCache.safeParse(JSON.parse(raw)).data ?? [];
  } catch { return []; }
}

function writeFilters(filters: z.infer<typeof filterCache>) {
  try {
    if (filters.length) localStorage.setItem(sourceFilterKey, JSON.stringify(filters.slice(-100)));
    else localStorage.removeItem(sourceFilterKey);
  } catch { /* Filters remain usable in the current view. */ }
}

export function readDeskSourceFilters(projectId: string): DeskSourceFilters {
  const saved = loadFilters().find(item => item.projectId === projectId);
  return saved ? { query: saved.query, decision: saved.decision } : defaultDeskSourceFilters;
}

export function saveDeskSourceFilters(projectId: string, filters: DeskSourceFilters) {
  const remaining = loadFilters().filter(item => item.projectId !== projectId);
  if (filters.query || filters.decision !== 'all') {
    const current = savedFilterSchema.safeParse({ ...filters, projectId });
    if (current.success) remaining.push(current.data);
  }
  writeFilters(remaining);
}

export function retainDeskSourceFilters(projectIds: ReadonlySet<string>) {
  writeFilters(loadFilters().filter(item => projectIds.has(item.projectId)));
}

/** Preserve independent legacy records even when their provider identifiers collide or are absent. */
export function replaceDeskPaper(project: Project, index: number, patch: Partial<Paper>): Paper[] {
  return project.papers.map((paper, at) => at === index ? { ...paper, ...patch } : paper);
}
