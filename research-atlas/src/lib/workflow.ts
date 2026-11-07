import type { Project, Stage } from './model';
import { canSupportGap } from './evidence-ledger';
import { dmpFields } from './study-planning';

export const roadmap: { id: Stage; title: string; detail: string; group: string }[] = [
  { id: 'profile', title: 'Set your research direction', detail: 'Choose your field, experience, and goal.', group: 'Define' },
  { id: 'topic', title: 'Explore a feasible topic', detail: 'Compare possibilities and choose a direction.', group: 'Define' },
  { id: 'question', title: 'Frame your question', detail: 'Record the question and what you want to learn.', group: 'Define' },
  { id: 'discover', title: 'Discover literature', detail: 'Search and save relevant references.', group: 'Gather evidence' },
  { id: 'screen', title: 'Screen your references', detail: 'Document inclusion and exclusion decisions.', group: 'Gather evidence' },
  { id: 'extract', title: 'Synthesize evidence', detail: 'Compare findings, limitations, and gaps.', group: 'Gather evidence' },
  { id: 'methods', title: 'Plan methods and ethics', detail: 'Record your design, sampling, and ethics needs.', group: 'Run the study' },
  { id: 'data', title: 'Manage data and analysis', detail: 'Plan storage and record the analysis you perform.', group: 'Run the study' },
  { id: 'writing', title: 'Write with your evidence', detail: 'Develop a manuscript using saved references.', group: 'Share results' },
  { id: 'publication', title: 'Evaluate publication options', detail: 'Check venues and save your verification notes.', group: 'Share results' },
];

export type TaskStatus = 'Not started' | 'In progress' | 'Needs review' | 'Blocked' | 'Complete';

const present = (text: string) => Boolean(text.trim());
const hasDraftBody = (text: string) => text.split('\n').some(line => present(line) && !/^#{1,6}\s/.test(line.trim()));

function stageProgress(project: Project, stage: Stage): { started: boolean; complete: boolean; blocked?: boolean } {
  const papers = project.papers;
  const included = papers.filter(paper => paper.decision === 'include');
  const needsReason = papers.some(paper => paper.decision !== 'unreviewed' && !present(paper.reason));
  switch (stage) {
    case 'profile': return { started: Boolean(project.experience || project.goal), complete: Boolean(project.discipline && project.experience && project.goal) };
    case 'topic': return { started: present(project.topic) || present(project.topicIdeas), complete: present(project.topic) && present(project.topicRationale) };
    case 'question': return { started: present(project.question) || present(project.problem), complete: present(project.question) && present(project.objectives) };
    case 'discover': return { started: Boolean(project.searches.length || papers.length), complete: Boolean(papers.length) };
    case 'screen': return { started: papers.some(paper => paper.decision !== 'unreviewed' || paper.screeningEvents?.length), complete: papers.length > 0 && !needsReason && papers.every(paper => paper.decision === 'include' || paper.decision === 'exclude'), blocked: !papers.length };
    case 'extract': return { started: present(project.gap) || papers.some(paper => paper.evidenceClaims?.length || present(paper.researchProblem) || present(paper.dataset) || present(paper.finding) || present(paper.methods) || present(paper.limitations)), complete: included.length > 0 && included.every(paper => paper.evidenceClaims?.some(claim => claim.claimType === 'finding' && claim.reviewStatus === 'reviewed') || (present(paper.finding) && present(paper.locator))), blocked: !included.length };
    case 'methods': return { started: present(project.design) || present(project.ethics) || present(project.analysis) || Boolean(project.methodContext && Object.values(project.methodContext).some(present)), complete: present(project.design) && present(project.ethics) && present(project.analysis) };
    case 'data': return { started: present(project.dataPlan) || present(project.analysisRecord) || Boolean(project.structuredDmp && dmpFields.some(([key]) => present(project.structuredDmp![key]))), complete: (hasDraftBody(project.dataPlan) || Boolean(project.structuredDmp && dmpFields.every(([key]) => present(project.structuredDmp![key])))) && hasDraftBody(project.analysisRecord) };
    case 'writing': return { started: present(project.manuscript), complete: hasDraftBody(project.manuscript) };
    case 'publication': return { started: Boolean(project.journalCandidates.length), complete: project.journalCandidates.some(venue => present(venue.verification) && venue.checks.length > 0) };
  }
}

export function taskStatus(project: Project, stage: Stage): TaskStatus {
  if (project.needsReview.includes(stage)) return 'Needs review';
  const progress = stageProgress(project, stage);
  if (progress.complete) return 'Complete';
  if (progress.blocked && !progress.started) return 'Blocked';
  return progress.started ? 'In progress' : 'Not started';
}

export function nextTask(project: Project) {
  return roadmap.find(task => taskStatus(project, task.id) === 'Needs review')
    ?? roadmap.find(task => ['Not started', 'In progress'].includes(taskStatus(project, task.id)));
}

export function updateProject(project: Project, patch: Partial<Project>, at = new Date().toISOString()): Project {
  const next = { ...project, ...patch, updatedAt: at };
  if ((next.gapStatus === 'evidence-supported candidate' || next.gapStatus === 'human-reviewed candidate') &&
      ((patch.gapStatus && !canSupportGap(next)) || (patch.gap != null && patch.gap.trim() !== project.gap.trim()) ||
        (patch.papers && canSupportGap(project) && !canSupportGap(next)))) next.gapStatus = 'needs-update';
  if (patch.question === undefined || !project.question.trim() || project.question.trim() === patch.question.trim()) return next;

  if (next.gapStatus === 'evidence-supported candidate' || next.gapStatus === 'human-reviewed candidate') next.gapStatus = 'needs-update';

  const affected = roadmap.slice(3).filter(task => stageProgress(project, task.id).started || stageProgress(project, task.id).complete);
  const newlyFlagged = affected.map(task => task.id).filter(stage => !project.needsReview.includes(stage));
  if (project.papers.some(paper => paper.evidenceClaims?.some(claim => claim.reviewStatus === 'reviewed'))) {
    next.papers = next.papers.map(paper => paper.evidenceClaims?.some(claim => claim.reviewStatus === 'reviewed') ? {
      ...paper,
      evidenceClaims: paper.evidenceClaims.map(claim => claim.reviewStatus === 'reviewed' ? { ...claim, reviewStatus: 'needs_review' } : claim),
    } : paper);
  }
  if (!newlyFlagged.length) return next;

  next.needsReview = [...new Set([...project.needsReview, ...newlyFlagged])];
  next.decisions = [...project.decisions.slice(-299), {
    at,
    note: `Question revised. Previous wording: ${project.question.slice(0, 18000)}. Review ${affected.map(task => task.title.toLowerCase()).join(', ')}.`,
  }];
  return next;
}
