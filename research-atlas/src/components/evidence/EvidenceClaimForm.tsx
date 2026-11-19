import { useState } from 'react';
import { claimTypeLabels, evidenceLevelLabels, type EvidenceClaim } from '@/lib/evidence-ledger';
import { type Paper } from '@/lib/model';

export function EvidenceClaimForm({ claim, paper, onSave, onCancel }: {
  claim?: EvidenceClaim;
  paper: Paper;
  onSave: (claim: EvidenceClaim) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState(() => claim ?? {
    id: '', claimType: 'finding', evidenceLevel: 'abstract', claimText: paper.finding.slice(0, 4000),
    locator: paper.locator.slice(0, 500), interpretation: '', uncertainty: '',
    createdAt: '', reviewStatus: 'draft', gapRole: 'none',
  } satisfies EvidenceClaim);
  const [levelChosen, setLevelChosen] = useState(Boolean(claim));
  const edit = (values: Partial<EvidenceClaim>) => setDraft(previous => ({ ...previous, ...values }));
  return <form className="evidence-ledger-fields" onSubmit={event => {
    event.preventDefault();
    if (!draft.claimText.trim() || !draft.locator.trim() || !levelChosen) return;
    onSave({ ...draft, claimText: draft.claimText.trim(), locator: draft.locator.trim(),
      id: draft.id || crypto.randomUUID(), createdAt: draft.createdAt || new Date().toISOString() });
  }}>
    <label className="field"><span>Claim type</span><select aria-label="Claim type" value={draft.claimType} onChange={event => edit({ claimType: event.target.value as EvidenceClaim['claimType'] })}>
      {Object.entries(claimTypeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>
    <label className="field"><span>Evidence claim</span><textarea aria-label="Evidence claim" rows={3} maxLength={4000} value={draft.claimText} onChange={event => edit({ claimText: event.target.value })} required /></label>
    <label className="field"><span>Evidence source level</span><select aria-label="Evidence source level" value={levelChosen ? draft.evidenceLevel : ''} onChange={event => {
      setLevelChosen(Boolean(event.target.value));
      if (event.target.value) edit({ evidenceLevel: event.target.value as EvidenceClaim['evidenceLevel'] });
    }} required>
      <option value="">Choose what you read</option>
      {Object.entries(evidenceLevelLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>
    {levelChosen && draft.evidenceLevel === 'metadata' && <p className="muted">Metadata can establish details such as a title or publication date. Read the abstract or full text for claims about the study’s results.</p>}
    <label className="field"><span>Source locator</span><input maxLength={500} value={draft.locator} placeholder="Abstract, page 8, Table 2, or another exact location" onChange={event => edit({ locator: event.target.value })} required /></label>
    <label className="field"><span>Your interpretation</span><textarea aria-label="Your interpretation" maxLength={3000} rows={2} value={draft.interpretation} onChange={event => edit({ interpretation: event.target.value })} /></label>
    <label className="field"><span>Uncertainty or limitation</span><textarea aria-label="Uncertainty or limitation" maxLength={1500} rows={2} value={draft.uncertainty} onChange={event => edit({ uncertainty: event.target.value })} /></label>
    <div className="button-row"><button type="submit" className="button small" disabled={!draft.claimText.trim() || !draft.locator.trim() || !levelChosen}>Save evidence claim</button><button type="button" className="text-button" onClick={onCancel}>Cancel</button></div>
  </form>;
}
