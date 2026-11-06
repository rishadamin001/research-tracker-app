import { z } from 'zod';
import type { Paper, Project } from './model';

export const screeningDecisionSchema = z.enum(['unreviewed', 'include', 'exclude', 'maybe']);
export type ScreeningDecision = z.infer<typeof screeningDecisionSchema>;

export const decisionLabels = {
  unreviewed: 'Unreviewed',
  include: 'Included',
  exclude: 'Excluded',
  maybe: 'Maybe',
} satisfies Record<ScreeningDecision, string>;

const screeningStage = z.enum(['title_abstract', 'full_text']);
export const screeningStages = { title_abstract: 'Title or abstract', full_text: 'Full text' } as const;

export const screeningCriterionSchema = z.object({
  id: z.uuid(),
  rule: z.string().trim().min(1).max(300),
  kind: z.enum(['include', 'exclude']),
});
export type ScreeningCriterion = z.infer<typeof screeningCriterionSchema>;

export const screeningEventSchema = z.object({
  id: z.uuid(),
  at: z.iso.datetime(),
  stage: screeningStage,
  decision: screeningDecisionSchema,
  reason: z.string().max(20000),
  reviewer: z.string().trim().min(1).max(120),
  sourceReference: z.string().max(1200),
  criterion: screeningCriterionSchema.optional(),
});
export type ScreeningEvent = z.infer<typeof screeningEventSchema>;
export const screeningDraftSchema = z.object({
  stage: screeningStage,
  reason: z.string().max(20000),
  reviewer: z.string().max(120),
  criterionId: z.union([z.uuid(), z.literal('')]),
});
export type ScreeningDraft = z.infer<typeof screeningDraftSchema>;
export const screeningEventLimit = 60;
export const screeningCriterionLimit = 50;

const evidenceLevel = z.enum(['metadata', 'abstract', 'full_text', 'user_observation']);
export const evidenceLevelLabels = {
  metadata: 'Metadata only',
  abstract: 'Abstract',
  full_text: 'Full text',
  user_observation: 'My observation',
} as const;
const claimType = z.enum(['finding', 'method', 'limitation', 'other']);
export const claimTypeLabels = { finding: 'Finding', method: 'Method', limitation: 'Limitation', other: 'Other' } as const;
export const gapRoles = { none: 'Unlinked', supports: 'Supports the candidate gap', challenges: 'Challenges the candidate gap' } as const;
export const claimReviewLabels = { draft: 'Draft', reviewed: 'Marked reviewed', needs_review: 'Needs review' } as const;

export const evidenceClaimSchema = z.object({
  id: z.uuid(),
  claimType,
  claimText: z.string().trim().min(1).max(4000),
  evidenceLevel,
  locator: z.string().trim().min(1).max(500),
  interpretation: z.string().max(3000),
  uncertainty: z.string().max(1500),
  createdAt: z.iso.datetime(),
  reviewStatus: z.enum(['draft', 'reviewed', 'needs_review']),
  reviewedAt: z.iso.datetime().optional(),
  gapRole: z.enum(['none', 'supports', 'challenges']).default('none'),
});
export type EvidenceClaim = z.infer<typeof evidenceClaimSchema>;
export const evidenceClaimLimit = 30;

export function findingSummary(paper: Pick<Paper, 'evidenceClaims' | 'finding' | 'locator'>) {
  const finding = paper.evidenceClaims?.find(claim => claim.claimType === 'finding' && claim.reviewStatus === 'reviewed')
    ?? paper.evidenceClaims?.find(claim => claim.claimType === 'finding');
  return finding ? { text: finding.claimText, locator: `${evidenceLevelLabels[finding.evidenceLevel]} · ${finding.locator}` }
    : { text: paper.finding, locator: paper.locator };
}

export function canSupportGap(project: Pick<Project, 'gap' | 'papers'>) {
  return Boolean(project.gap.trim() && project.papers.some(paper => paper.decision !== 'exclude' && paper.evidenceClaims?.some(claim =>
    claim.gapRole === 'supports' && claim.reviewStatus === 'reviewed' && claim.evidenceLevel !== 'metadata')));
}
