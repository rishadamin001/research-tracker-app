import type { Paper, Project } from './model';

/** Preserve independent legacy records even when their provider identifiers collide or are absent. */
export function replaceDeskPaper(project: Project, index: number, patch: Partial<Paper>): Paper[] {
  return project.papers.map((paper, at) => at === index ? { ...paper, ...patch } : paper);
}
