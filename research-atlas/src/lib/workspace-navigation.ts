import type { Project, Stage } from './model';
import { nextTask } from './workflow';

export const projectTabs = [
  ['roadmap', 'Overview'], ['question', 'Question'], ['screen', 'Literature'],
  ['methods', 'Study'], ['extract', 'Evidence'], ['writing', 'Write'], ['publication', 'Publish'],
] as const;
export type ProjectDestination = typeof projectTabs[number][0] | Stage | 'history' | 'projects' | 'guide' | 'paper-search';
export function projectTab(view: string) {
  if (['profile', 'topic', 'question'].includes(view)) return 'question';
  if (['discover', 'screen'].includes(view)) return 'screen';
  if (['methods', 'data'].includes(view)) return 'methods';
  if (view === 'history') return 'roadmap';
  return view;
}
export function primaryDestination(view: string) {
  if (['roadmap', 'projects', 'history', 'profile', 'topic', 'question', 'screen', 'extract', 'methods', 'data', 'writing', 'publication'].includes(view)) return 'roadmap';
  if (view === 'explore') return 'paper-search';
  if (view === 'discover') return 'paper-search';
  if (view === 'conferences') return 'publish-hub';
  if (view === 'primer') return 'guide';
  return view;
}
export function nextUsefulAction(project: Project): { target: Stage; title: string; detail: string } {
  const review = project.needsReview[0];
  if (review) return { target: review, title: 'Review work affected by your question', detail: 'Earlier notes are preserved. Check that they still fit the current question.' };
  if (!project.question.trim()) return { target: 'question', title: 'Draft a focused research question', detail: 'Name what you want to understand, who or what you will study, and the setting.' };
  const pending = project.papers.filter(p => p.decision === 'unreviewed' || p.decision === 'maybe').length;
  if (pending) return { target: 'screen', title: `Screen ${pending} reference${pending === 1 ? '' : 's'}`, detail: 'Apply your criteria and record Include, Maybe, or Exclude with a reason.' };
  const claims = project.papers.reduce((sum, paper) => sum + (paper.evidenceClaims?.filter(c => c.reviewStatus !== 'reviewed').length ?? 0), 0);
  if (claims) return { target: 'extract', title: `Review ${claims} evidence claim${claims === 1 ? '' : 's'}`, detail: 'Check each claim against its source, evidence level, and page or section locator.' };
  if (!project.papers.length) return { target: 'discover', title: 'Find evidence for your question', detail: 'Run a focused keyword search and save promising sources. Search coverage has limits.' };
  if (!project.design.trim()) return { target: 'methods', title: 'Plan a study that fits your evidence', detail: 'Work through evidence access, ethics, and feasibility before choosing a design.' };
  const task = nextTask(project);
  return { target: task?.id ?? 'publication', title: task?.title ?? 'Review your publication plan', detail: task?.detail ?? 'Recheck your venue, declarations, and remaining uncertainties.' };
}
