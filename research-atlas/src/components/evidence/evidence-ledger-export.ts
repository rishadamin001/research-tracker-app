import { claimReviewLabels, claimTypeLabels, evidenceLevelLabels, gapRoles } from '@/lib/evidence-ledger';
import { csvCell, type Project } from '@/lib/model';

export function evidenceLedgerCsv(project: Project) {
  const headings = ['Paper', 'DOI', 'Source record', 'Claim type', 'Claim', 'Evidence source', 'Locator', 'Interpretation', 'Uncertainty', 'Created at', 'Review status', 'Reviewed at', 'Gap role'];
  const rows = project.papers.flatMap(paper => (paper.evidenceClaims ?? []).map(claim => [
    paper.title, paper.doi, paper.id, claimTypeLabels[claim.claimType], claim.claimText,
    evidenceLevelLabels[claim.evidenceLevel], claim.locator, claim.interpretation, claim.uncertainty,
    claim.createdAt, claimReviewLabels[claim.reviewStatus], claim.reviewedAt, gapRoles[claim.gapRole],
  ]));
  return [headings, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
