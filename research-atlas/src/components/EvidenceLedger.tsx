import { useState } from 'react';
import {
  claimReviewLabels, claimTypeLabels, decisionLabels, evidenceClaimLimit, evidenceLevelLabels,
  gapRoles, screeningCriterionLimit, screeningEventLimit, screeningStages,
  type EvidenceClaim, type ScreeningCriterion, type ScreeningDraft, type ScreeningEvent,
} from '@/lib/evidence-ledger';
import { csvCell, type Paper, type Project } from '@/lib/model';
import './evidence-ledger.css';

export function ScreeningCriteria({ criteria, onChange }: {
  criteria: ScreeningCriterion[];
  onChange: (criteria: ScreeningCriterion[]) => void;
}) {
  const [rule, setRule] = useState('');
  const [kind, setKind] = useState<ScreeningCriterion['kind']>('include');
  return <details className="panel">
    <summary>Screening criteria ({criteria.length})</summary>
    <p>Write the same rule you will apply to each paper. Example: include studies that sampled university students.</p>
    {criteria.length > 0 && <ul>{criteria.map(criterion => <li key={criterion.id}><strong>{criterion.kind === 'include' ? 'Include' : 'Exclude'}</strong> · {criterion.rule} <button className="text-button small" type="button" onClick={() => onChange(criteria.filter(item => item.id !== criterion.id))}>Retire rule</button></li>)}</ul>}
    {criteria.length < screeningCriterionLimit ? <form onSubmit={event => {
      event.preventDefault();
      if (!rule.trim()) return;
      onChange([...criteria, { id: crypto.randomUUID(), kind, rule: rule.trim() }]);
      setRule('');
    }}>
      <label className="field"><span>Criterion type</span><select value={kind} onChange={event => setKind(event.target.value === 'exclude' ? 'exclude' : 'include')}>
        <option value="include">Inclusion rule</option><option value="exclude">Exclusion rule</option>
      </select></label>
      <label className="field"><span>Criterion rule</span><input value={rule} maxLength={300} onChange={event => setRule(event.target.value)} required /></label>
      <button type="submit" className="button secondary small" disabled={!rule.trim()}>Add criterion</button>
    </form> : <p>You have 50 active criteria. Retire a rule to make space. Past decisions keep the rule used at the time.</p>}
  </details>;
}

export function PaperScreening({ paper, criteria, onDraft, onRecord }: {
  paper: Paper;
  criteria: ScreeningCriterion[];
  onDraft: (draft: ScreeningDraft) => void;
  onRecord: (event: ScreeningEvent) => void;
}) {
  const history = paper.screeningEvents ?? [];
  const latest = history.at(-1);
  const draft: ScreeningDraft = paper.screeningDraft ?? {
    reason: paper.reason,
    stage: latest?.stage ?? 'title_abstract',
    criterionId: latest?.criterion?.id ?? '',
    reviewer: latest?.reviewer === 'Local reviewer' ? '' : latest?.reviewer ?? '',
  };
  const { reason, stage, reviewer, criterionId } = draft;
  const locked = history.length >= screeningEventLimit;
  const criterion = criteria.find(item => item.id === criterionId);

  function record(decision: ScreeningEvent['decision']) {
    if (locked || (decision !== 'unreviewed' && !reason.trim())) return;
    onRecord({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      stage,
      decision,
      reason: reason.trim(),
      reviewer: reviewer.trim() || 'Local reviewer',
      sourceReference: [paper.source, paper.doi || paper.id].filter(Boolean).join(' · ').slice(0, 1200),
      criterion,
    });
  }

  return <>
    <fieldset disabled={locked} className="evidence-ledger-fields">
      <legend>Record a screening decision</legend>
      <p>Choose a stage and rule, then write why. Selecting a decision adds a dated entry. Use Maybe when you need more evidence.</p>
      <label className="field"><span>Screening stage</span><select value={stage} onChange={event => onDraft({ ...draft, stage: event.target.value === 'full_text' ? 'full_text' : 'title_abstract' })}>
        {Object.entries(screeningStages).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label className="field"><span>Screening criterion</span><select value={criterion?.id ?? ''} onChange={event => onDraft({ ...draft, criterionId: event.target.value })}>
        <option value="">No saved criterion selected</option>
        {criteria.map(item => <option key={item.id} value={item.id}>{item.kind === 'include' ? 'Include' : 'Exclude'} · {item.rule}</option>)}
      </select></label>
      <label className="field"><span>Reviewer name or initials</span><input maxLength={120} value={reviewer} placeholder="Local reviewer" onChange={event => onDraft({ ...draft, reviewer: event.target.value })} /></label>
      <label className="field"><span>Decision reason</span><textarea maxLength={20000} rows={2} placeholder="What did you find and how does it relate to your rules?" value={reason} onChange={event => onDraft({ ...draft, reason: event.target.value })} /></label>
      <label className="field"><span>Screening decision</span><select value={paper.decision} onChange={event => record(event.target.value as ScreeningEvent['decision'])}>
        <option value="unreviewed">Unreviewed</option>
        <option value="include" disabled={!reason.trim() && paper.decision !== 'include'}>Include</option>
        <option value="exclude" disabled={!reason.trim() && paper.decision !== 'exclude'}>Exclude</option>
        <option value="maybe" disabled={!reason.trim() && paper.decision !== 'maybe'}>Maybe</option>
      </select></label>
      {paper.decision !== 'unreviewed' && <button type="button" className="button secondary small" disabled={!reason.trim()} onClick={() => record(paper.decision)}>Record current decision again</button>}
    </fieldset>
    {locked && <p role="status">This paper has 60 recorded decisions. Export a backup to preserve the complete history.</p>}
    <details>
      <summary>Decision history ({history.length})</summary>
      {history.length > 0 ? <ol className="evidence-ledger-list">{history.slice().reverse().map(entry => <li key={entry.id}>
        <strong>{decisionLabels[entry.decision]}</strong> · {screeningStages[entry.stage]} · {entry.reviewer} · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
        {entry.criterion && <div>Criterion · {entry.criterion.kind === 'include' ? 'Include' : 'Exclude'} · {entry.criterion.rule}</div>}
        {entry.reason && <p>{entry.reason}</p>}
        <small>Source record · {entry.sourceReference || 'Unavailable'}</small>
      </li>)}</ol> : <p>{paper.decision === 'unreviewed' ? 'Decisions appear here after recording.' : `Existing decision · ${decisionLabels[paper.decision]}. ${paper.reason}`}</p>}
    </details>
  </>;
}

function ClaimForm({ claim, paper, onSave, onCancel }: {
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
    <label className="field"><span>Claim type</span><select value={draft.claimType} onChange={event => edit({ claimType: event.target.value as EvidenceClaim['claimType'] })}>
      {Object.entries(claimTypeLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>
    <label className="field"><span>Evidence claim</span><textarea rows={3} maxLength={4000} value={draft.claimText} onChange={event => edit({ claimText: event.target.value })} required /></label>
    <label className="field"><span>Evidence source level</span><select value={levelChosen ? draft.evidenceLevel : ''} onChange={event => {
      setLevelChosen(Boolean(event.target.value));
      if (event.target.value) edit({ evidenceLevel: event.target.value as EvidenceClaim['evidenceLevel'] });
    }} required>
      <option value="">Choose what you read</option>
      {Object.entries(evidenceLevelLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>
    {levelChosen && draft.evidenceLevel === 'metadata' && <p className="muted">Metadata can establish details such as a title or publication date. Read the abstract or full text for claims about the study’s results.</p>}
    <label className="field"><span>Source locator</span><input maxLength={500} value={draft.locator} placeholder="Abstract, page 8, Table 2, or another exact location" onChange={event => edit({ locator: event.target.value })} required /></label>
    <label className="field"><span>Your interpretation</span><textarea maxLength={3000} rows={2} value={draft.interpretation} onChange={event => edit({ interpretation: event.target.value })} /></label>
    <label className="field"><span>Uncertainty or limitation</span><textarea maxLength={1500} rows={2} value={draft.uncertainty} onChange={event => edit({ uncertainty: event.target.value })} /></label>
    <div className="button-row"><button type="submit" className="button small" disabled={!draft.claimText.trim() || !draft.locator.trim() || !levelChosen}>Save evidence claim</button><button type="button" className="text-button" onClick={onCancel}>Cancel</button></div>
  </form>;
}

export function EvidenceClaims({ paper, onChange }: { paper: Paper; onChange: (claims: EvidenceClaim[]) => void }) {
  const claims = paper.evidenceClaims ?? [];
  const [editingId, setEditingId] = useState<string>();
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
      <label className="field"><span>Role in the candidate gap</span><select value={claim.gapRole} onChange={event => editClaim({ ...claim, gapRole: event.target.value as EvidenceClaim['gapRole'] })}>
        {Object.entries(gapRoles).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <div className="button-row">
        <button type="button" className="text-button" onClick={() => setEditingId(claim.id)}>Edit claim</button>
        {claim.reviewStatus !== 'reviewed' && <button type="button" className="text-button" onClick={() => editClaim({ ...claim, reviewStatus: 'reviewed', reviewedAt: new Date().toISOString() })}>Mark claim reviewed</button>}
        <button type="button" className="text-button danger" onClick={() => {
          if (!window.confirm('Remove this evidence claim and its link to the candidate gap?')) return;
          onChange(claims.filter(item => item.id !== claim.id));
          if (editingId === claim.id) setEditingId(undefined);
        }}>Remove claim</button>
      </div>
    </li>)}</ul>}
    {editingId && <ClaimForm key={editingId} claim={editing} paper={paper} onCancel={() => setEditingId(undefined)} onSave={claim => {
      if (editing) editClaim({ ...claim, gapRole: editing.gapRole, reviewedAt: editing.reviewedAt,
        reviewStatus: editing.reviewStatus === 'reviewed' ? 'needs_review' : editing.reviewStatus });
      else if (claims.length < evidenceClaimLimit) onChange([...claims, claim]);
      setEditingId(undefined);
    }} />}
    {!editingId && claims.length < evidenceClaimLimit && <button type="button" className="button secondary small" onClick={() => setEditingId('new')}>Add evidence claim</button>}
    {claims.length >= evidenceClaimLimit && <p>This paper has 30 evidence claims. Export a project backup to keep a copy.</p>}
  </section>;
}

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

export function evidenceLedgerCsv(project: Project) {
  const headings = ['Paper', 'DOI', 'Source record', 'Claim type', 'Claim', 'Evidence source', 'Locator', 'Interpretation', 'Uncertainty', 'Created at', 'Review status', 'Reviewed at', 'Gap role'];
  const rows = project.papers.flatMap(paper => (paper.evidenceClaims ?? []).map(claim => [
    paper.title, paper.doi, paper.id, claimTypeLabels[claim.claimType], claim.claimText,
    evidenceLevelLabels[claim.evidenceLevel], claim.locator, claim.interpretation, claim.uncertainty,
    claim.createdAt, claimReviewLabels[claim.reviewStatus], claim.reviewedAt, gapRoles[claim.gapRole],
  ]));
  return [headings, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
