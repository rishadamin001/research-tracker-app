import { useState } from 'react';
import { claimReviewLabels, claimTypeLabels, evidenceClaimLimit, evidenceLevelLabels, gapRoles, type EvidenceClaim } from '@/lib/evidence-ledger';
import { type Paper } from '@/lib/model';
import { EvidenceClaimForm } from './EvidenceClaimForm';

export function EvidenceClaims({ paper, onChange, onEditingChange }: { paper: Paper; onChange: (claims: EvidenceClaim[]) => void; onEditingChange?: (editing: boolean) => void }) {
  const claims = paper.evidenceClaims ?? [];
  const [editingId, setEditingId] = useState<string>();
  function edit(id?: string) { setEditingId(id); onEditingChange?.(Boolean(id)); }
  const editing = claims.find(item => item.id === editingId);
  function editClaim(claim: EvidenceClaim) {
    onChange(claims.map(item => item.id === claim.id ? claim : item));
  }

  return <section className="evidence-ledger-claims">
    <h3>Evidence ledger</h3>
    <p>Record one claim per entry in your own words. A precise locator makes it easier to check later.</p>
    {claims.length > 0 && <ul className="evidence-ledger-list">{claims.map(claim => <li key={claim.id}>
      <strong>{claim.claimText}</strong>
      <div><small>{claimTypeLabels[claim.claimType]} · {evidenceLevelLabels[claim.evidenceLevel]} · {claim.locator} · {claimReviewLabels[claim.reviewStatus]}</small></div>
      {claim.interpretation && <p><strong>Interpretation</strong> · {claim.interpretation}</p>}
      {claim.uncertainty && <p><strong>Uncertainty</strong> · {claim.uncertainty}</p>}
      {claim.reviewedAt && <small>Last reviewed <time dateTime={claim.reviewedAt}>{new Date(claim.reviewedAt).toLocaleDateString()}</time></small>}
      <label className="field"><span>Role in the candidate gap</span><select aria-label="Role in the candidate gap" value={claim.gapRole} onChange={event => editClaim({ ...claim, gapRole: event.target.value as EvidenceClaim['gapRole'] })}>
        {Object.entries(gapRoles).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <div className="button-row">
        <button type="button" className="text-button" onClick={() => edit(claim.id)}>Edit claim</button>
        {claim.reviewStatus !== 'reviewed' && <button type="button" className="text-button" onClick={() => editClaim({ ...claim, reviewStatus: 'reviewed', reviewedAt: new Date().toISOString() })}>Mark claim reviewed</button>}
        <button type="button" className="text-button danger" onClick={() => {
          if (!window.confirm('Remove this evidence claim and its link to the candidate gap?')) return;
          onChange(claims.filter(item => item.id !== claim.id));
          if (editingId === claim.id) edit();
        }}>Remove claim</button>
      </div>
    </li>)}</ul>}
    {editingId && <EvidenceClaimForm key={editingId} claim={editing} paper={paper} onCancel={() => edit()} onSave={claim => {
      if (editing) editClaim({ ...claim, gapRole: editing.gapRole, reviewedAt: editing.reviewedAt,
        reviewStatus: editing.reviewStatus === 'reviewed' ? 'needs_review' : editing.reviewStatus });
      else if (claims.length < evidenceClaimLimit) onChange([...claims, claim]);
      edit();
    }} />}
    {!editingId && claims.length < evidenceClaimLimit && <button type="button" className="button secondary small" onClick={() => edit('new')}>Add evidence claim</button>}
    {claims.length >= evidenceClaimLimit && <p>This paper has 30 evidence claims. Export a project backup to keep a copy.</p>}
  </section>;
}
