import { claimReviewLabels, decisionLabels, evidenceLevelLabels } from '@/lib/evidence-ledger';
import { type Paper } from '@/lib/model';

export function GapEvidence({ papers }: { papers: Paper[] }) {
  const entries = papers.flatMap(paper => (paper.evidenceClaims ?? []).flatMap(claim => claim.gapRole === 'none' ? [] : [{ claim, paper }]));
  return <div className="evidence-ledger-gap">
    {(['supports', 'challenges'] as const).map(role => {
      const related = entries.filter(({ claim }) => claim.gapRole === role);
      return <section key={role}>
        <h3>{role === 'supports' ? 'What supports this?' : 'What challenges this?'}</h3>
        {related.length ? <ul className="evidence-ledger-list">{related.map(({ claim, paper }) => <li key={`${paper.id}-${claim.id}`}>
          <strong>{claim.claimText}</strong>
          <div>{paper.title} · {evidenceLevelLabels[claim.evidenceLevel]} · {claim.locator}</div>
          <small>{claimReviewLabels[claim.reviewStatus]} · Screening: {decisionLabels[paper.decision]}</small>
        </li>)}</ul> : <p>Link an entry from a paper’s evidence ledger.</p>}
      </section>;
    })}
  </div>;
}
