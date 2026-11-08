import { projectSchema, type Project, type Stage } from './model';
import { evidenceLevelLabels, claimReviewLabels, screeningStages } from './evidence-ledger';
import { dmpFields } from './study-planning';
import { pathwayFor } from './research-pathway';
import { hasStructuredDraft, writingReviewPrompts } from './writing-studio';
import { appVersion } from './backup';

export type ReadinessPrompt = { id: string; area: Stage; title: string; detail: string };

/** Checks recorded completeness and explicit contradictions only; never evaluates scientific validity. */
export function researchReadiness(project: Project): ReadinessPrompt[] {
  const prompts: ReadinessPrompt[] = [];
  const add = (id: string, area: Stage, title: string, detail: string) => prompts.push({ id, area, title, detail });
  if (!project.question.trim()) add('question', 'question', 'Record an intentional question version', 'Exploration can continue while the question is provisional. Commit the wording when you are ready to plan the study.');
  if (project.questionDraft !== undefined && project.questionDraft.trim() !== project.question.trim()) add('question-draft', 'question', 'Review the uncommitted question draft', 'Your saved draft differs from the committed version. Choose whether to commit or continue editing it.');
  if (!project.setting.trim() || !project.objectives.trim()) add('scope', 'question', 'Clarify scope and objectives', 'Record the population, setting or corpus and the concrete steps your question requires.');
  if (!project.studyType) add('pathway', 'profile', 'Choose or review the research pathway', 'A pathway changes planning examples, not the validity of your design. Choosing one remains reversible.');
  if (!project.papers.length) add('sources', 'discover', 'Save sources for your question', 'A small or empty search cannot establish an absence of earlier research. Record actual terms and coverage.');
  const unresolved = project.papers.filter(paper => paper.decision === 'unreviewed' || paper.decision === 'maybe' || !paper.reason.trim()).length;
  if (unresolved) add('screening', 'screen', 'Resolve source-selection records', `${unresolved} saved sources have unresolved selection or a missing reason. Preserve exclusions and reasons in the review history.`);
  const idCounts = new Map<string, number>();
  for (const paper of project.papers) idCounts.set(paper.id, (idCounts.get(paper.id) ?? 0) + 1);
  if (project.papers.some(paper => !paper.id || (idCounts.get(paper.id) ?? 0) > 1)) add('source-identity', 'screen', 'Review missing or repeated source identifiers', 'Source-specific writing links require an unambiguous record identifier. The existing notes and records are preserved.');
  const kept = project.papers.filter(paper => paper.decision === 'include');
  const missingEvidence = kept.filter(paper => !paper.evidenceClaims?.some(claim => claim.claimType === 'finding' && claim.reviewStatus === 'reviewed' && claim.evidenceLevel !== 'metadata' && claim.locator.trim())).length;
  if (missingEvidence) add('located-evidence', 'extract', 'Check findings against their source locations', `${missingEvidence} included sources lack a reviewed finding with a locator beyond metadata. Legacy notes remain available, but a bibliographic record does not substantiate a result.`);
  const needsClaimReview = project.papers.reduce((count, paper) => count + (paper.evidenceClaims?.filter(claim => claim.reviewStatus !== 'reviewed').length ?? 0), 0);
  if (needsClaimReview) add('claim-review', 'extract', 'Review evidence interpretations', `${needsClaimReview} claims are draft or need another review. Inspect the source, interpretation and uncertainty.`);
  if (!project.design.trim() || !project.analysis.trim()) add('methods', 'methods', 'Document the method and analysis plan', project.studyType === 'literature' ? 'Explain source selection, synthesis and appropriate appraisal for your literature-based study.' : 'Explain how the design, sampling or case selection, measures and analysis can answer the question.');
  if (!project.ethics.trim()) add('ethics', 'methods', 'Record the ethics and access assessment', 'Explain which permissions, confidentiality or consent considerations apply, including a reason when participant recruitment does not apply. Atlas does not grant approval.');
  if (project.studyType === 'literature' && project.methodContext?.evidence === 'new') add('pathway-access', 'methods', 'Recheck the evidence-access choice', 'The literature pathway is selected, while the methods context says newly collected evidence. Clarify whether this is source coding, participant collection or a different plan.');
  const unansweredDmp = dmpFields.filter(([key]) => !project.structuredDmp?.[key].trim()).length;
  if (unansweredDmp) add('dmp', 'data', 'Finish or explain data-plan items', `${unansweredDmp} structured items remain blank. Describe data, documents or code as applicable; record why an item does not apply instead of inventing a requirement. Earlier freeform notes are preserved.`);
  if (!project.manuscript.trim() && !hasStructuredDraft(project)) add('writing', 'writing', 'Develop an evidence-linked draft', 'Build sections from located evidence, preserve uncertainty, and review the draft bibliography before exporting.');
  else {
    const writing = writingReviewPrompts(project);
    if (writing.length) add('writing-support', 'writing', 'Review draft support and references', `${writing.length} writing prompts remain, including missing or changed support where recorded. Inspect them in Writing Studio; these are review aids, not automatic judgments.`);
  }
  if (!project.journalCandidates.some(venue => venue.scope.trim() && venue.verification.trim() && venue.checks.includes('scope') && venue.checks.includes('fees'))) add('venue', 'publication', 'Check the target venue and requirements', 'Record scope, requirements, fees or waivers, sources and verification dates. A stored checklist does not guarantee journal legitimacy or acceptance.');
  if (project.needsReview.length) add('upstream', project.needsReview[0], 'Revisit work affected by an earlier change', `Recorded stages needing review: ${project.needsReview.join(', ')}. Earlier work remains available.`);
  return prompts;
}

export function researchPassport(project: Project, exportedAt = new Date().toISOString()) {
  const p = projectSchema.parse(project);
  return {
    format: 'research-atlas-research-passport', version: 1, projectSchemaVersion: 1, appVersion, exportedAt,
    project: { id: p.id, title: p.title, createdAt: p.createdAt, updatedAt: p.updatedAt, discipline: p.discipline, domain: p.domain, goal: p.goal, constraints: p.constraints, studyType: p.studyType ?? null, pathway: pathwayFor(p)?.label ?? 'Pathway not selected' },
    question: { committed: p.question, uncommittedDraft: p.questionDraft ?? null, draftReason: p.questionDraftReason ?? null, problem: p.problem, scope: p.setting, objectives: p.objectives, hypothesis: p.hypothesis, versions: p.questionVersions ?? [] },
    searches: p.searches,
    selectionCriteria: p.screeningCriteria ?? [],
    sources: p.papers.map(paper => ({ id: paper.id, title: paper.title, authors: paper.authors, year: paper.year, doi: paper.doi, url: paper.url, openCopy: paper.oa, provider: paper.source, journal: paper.journal, publisher: paper.publisher, quartile: paper.journalQuartile, metricsRetrievedAt: paper.metricsRetrievedAt, decision: paper.decision, reason: paper.reason, screeningEvents: paper.screeningEvents ?? [], claims: paper.evidenceClaims ?? [], context: { problem: paper.researchProblem, methods: paper.methods, dataset: paper.dataset, limitations: paper.limitations, legacyFinding: paper.finding, legacyLocator: paper.locator, interpretationNotes: paper.notes } })),
    study: { purpose: p.purpose, evidenceRoute: p.data, design: p.design, sampling: p.sampling, instruments: p.instruments, ethics: p.ethics, ethicsStatus: p.ethicsStatus, analysis: p.analysis, context: p.methodContext, dataManagement: p.structuredDmp, earlierDataPlan: p.dataPlan, analysisRecord: p.analysisRecord },
    synthesis: { candidateGap: p.gap, state: p.gapStatus, searchLimits: p.gapSearchLimits },
    writing: { legacyDraft: p.manuscript, studio: p.writingStudio },
    publication: { candidates: p.journalCandidates, plan: p.researchPlan },
    decisions: p.decisions, activity: p.projectEvents ?? [], reviewPrompts: researchReadiness(p),
    limitations: ['This local passport is not a portable restore backup or tamper-proof audit.', 'Question versions and activity are bounded; earlier missing history cannot be reconstructed.', 'User judgments, draft statements and imported histories are not independently verified.', 'Search records describe actual bounded retrieval, not exhaustive coverage or proof of a novel gap.', 'This export can contain private notes and unpublished drafts. Review it before sharing.'],
  };
}

export function researchPassportMarkdown(project: Project, exportedAt = new Date().toISOString()) {
  const passport = researchPassport(project, exportedAt);
  const parts = [`# Research Passport: ${passport.project.title}`, `Exported ${exportedAt} · Atlas ${passport.appVersion}`, `Project ID: ${passport.project.id}\nPathway: ${passport.project.pathway}\nGoal: ${passport.project.goal || 'Not recorded'}\nConstraints: ${passport.project.constraints || 'Not recorded'}`,
    '## What this document means', ...passport.limitations.map(text => `- ${text}`),
    '## Current research question', passport.question.committed || 'No committed version yet.', `Problem: ${passport.question.problem || 'Not recorded'}\nScope: ${passport.question.scope || 'Not recorded'}\nObjectives: ${passport.question.objectives || 'Not recorded'}\nHypothesis (where applicable): ${passport.question.hypothesis || 'Not recorded'}`];
  if (passport.question.uncommittedDraft !== null) parts.push('### Uncommitted question draft', passport.question.uncommittedDraft, `Draft reason: ${passport.question.draftReason || 'Not recorded'}`);
  parts.push('## Intentional question versions');
  for (const version of passport.question.versions) parts.push(`### Version ${version.version} — ${version.recordedAt}`, version.wording, `Reason: ${version.reason}\nOrigin: ${version.origin}\nAffected stages: ${version.affectedStages.join(', ') || 'None recorded'}`);
  parts.push('## Search provenance');
  for (const search of passport.searches) parts.push(`### ${search.source} — ${search.date}`, `Entered query: ${search.run?.userQuery ?? search.query}\nExecuted query: ${search.run?.executedQuery ?? search.query}\nFilters: ${search.run?.filters.join('; ') || search.filters || 'None recorded'}\nRetrieved: ${search.count}\nPages: ${search.run?.pages.map(page => `${page.page} (${page.returnedCount ?? 'no readable response'})`).join(', ') || 'Not recorded'}\nOutcome: ${search.run?.error?.message ?? search.run?.stopReason ?? 'Recorded result'}\nLimit: bounded discovery; not exhaustive.`);
  parts.push('## Source-selection criteria', ...passport.selectionCriteria.map(criterion => `- ${criterion.kind}: ${criterion.rule}`));
  for (const source of passport.sources) {
    parts.push(`## Source: ${source.title || 'Untitled source'}`, `${source.authors || 'Authors unavailable'} (${source.year ?? 'date unavailable'}). ${source.journal || 'Venue unavailable'}\nRecord ID: ${source.id || 'Unavailable'}\nDOI: ${source.doi || 'Unavailable'}\nSource URL: ${source.url || 'Unavailable'}\nProvider: ${source.provider}\nSelection: ${source.decision}; ${source.reason || 'Reason not recorded'}`, '### Screening history');
    for (const event of source.screeningEvents) parts.push(`- ${event.at} · ${screeningStages[event.stage]} · ${event.decision} · ${event.reviewer}\n  Reason: ${event.reason}\n  Criterion: ${event.criterion?.rule ?? 'Not selected'}\n  Source record: ${event.sourceReference}`);
    parts.push('### Located evidence');
    for (const claim of source.claims) parts.push(`- Claim ${claim.id}: ${claim.claimText}\n  ${evidenceLevelLabels[claim.evidenceLevel]} · ${claim.locator}\n  ${claimReviewLabels[claim.reviewStatus]} · ${claim.gapRole}\n  Interpretation: ${claim.interpretation || 'Not recorded'}\n  Uncertainty: ${claim.uncertainty || 'Not recorded'}`);
    parts.push('### Study context and earlier notes', `Problem: ${source.context.problem}\nMethods: ${source.context.methods}\nDataset: ${source.context.dataset}\nLimitations: ${source.context.limitations}\nEarlier finding: ${source.context.legacyFinding}\nEarlier locator: ${source.context.legacyLocator}\nInterpretation notes: ${source.context.interpretationNotes}`);
  }
  parts.push('## Study and methods', `Purpose: ${passport.study.purpose}\nEvidence route: ${passport.study.evidenceRoute}\nDesign: ${passport.study.design}\nSampling or source selection: ${passport.study.sampling}\nInstruments: ${passport.study.instruments}\nEthics/access assessment: ${passport.study.ethics}\nEthics status: ${passport.study.ethicsStatus}\nAnalysis: ${passport.study.analysis}`);
  if (passport.study.context) parts.push('### Recorded methods decisions', ...Object.entries(passport.study.context).map(([key, value]) => `- ${key}: ${value || 'Not recorded'}`));
  parts.push('## Data management');
  for (const [key, label] of dmpFields) parts.push(`### ${label}`, passport.study.dataManagement?.[key] || 'Not yet recorded');
  parts.push('### Earlier planning notes', passport.study.earlierDataPlan, '### Analysis record', passport.study.analysisRecord, '## Candidate gap and uncertainty', passport.synthesis.candidateGap, `State: ${passport.synthesis.state}\nSearch limits: ${passport.synthesis.searchLimits}`, '## Publication checks', `Target: ${passport.publication.plan.venue || 'Not selected'}\nType: ${passport.publication.plan.venueType}\nDeadline: ${passport.publication.plan.deadline || 'Not recorded'} ${passport.publication.plan.deadlineTime} ${passport.publication.plan.deadlineZone}\nRequirements: ${passport.publication.plan.requirements.manuscript}; ${passport.publication.plan.requirements.abstract}; ${passport.publication.plan.requirements.figures}`);
  for (const venue of passport.publication.candidates) parts.push(`### ${venue.title || 'Unnamed candidate'}`, `URL: ${venue.url}\nScope: ${venue.scope}\nFees/waivers: ${venue.cost}\nRecorded checks: ${venue.checks.join(', ')}\nVerification sources and notes: ${venue.verification}`);
  parts.push('## Major decisions', ...passport.decisions.map(decision => `- ${decision.at}: ${decision.note}`), '## Current completeness prompts', ...passport.reviewPrompts.map(prompt => `- ${prompt.title}: ${prompt.detail}`), '## Bounded activity trail', ...passport.activity.map(event => `- ${event.at} · ${event.kind} · ${event.detail}${event.entityId ? ` · Record ${event.entityId}` : ''}`));
  return parts.join('\n\n') + '\n';
}
