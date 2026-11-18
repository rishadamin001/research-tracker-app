import { decisionLabels, screeningEventLimit, screeningStages, type ScreeningCriterion, type ScreeningDraft, type ScreeningEvent } from '@/lib/evidence-ledger';
import { type Paper } from '@/lib/model';

export function PaperScreening({ paper, criteria, onDraft, onRecord, quickActions = false, compact = false }: {
  paper: Paper;
  criteria: ScreeningCriterion[];
  onDraft: (draft: ScreeningDraft) => void;
  onRecord: (event: ScreeningEvent) => void;
  quickActions?: boolean;
  compact?: boolean;
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
      {!compact && <p>Choose a stage and rule, then write why. Selecting a decision adds a dated entry. Use Maybe when you need more evidence.</p>}
      <label className="field"><span>Screening stage</span><select aria-label="Screening stage" value={stage} onChange={event => onDraft({ ...draft, stage: event.target.value === 'full_text' ? 'full_text' : 'title_abstract' })}>
        {Object.entries(screeningStages).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
      </select></label>
      <label className="field"><span>Screening criterion</span><select aria-label="Screening criterion" value={criterion?.id ?? ''} onChange={event => onDraft({ ...draft, criterionId: event.target.value })}>
        <option value="">No saved criterion selected</option>
        {criteria.map(item => <option key={item.id} value={item.id}>{item.kind === 'include' ? 'Include' : 'Exclude'} · {item.rule}</option>)}
      </select></label>
      <label className="field"><span>Reviewer name or initials</span><input maxLength={120} value={reviewer} placeholder="Local reviewer" onChange={event => onDraft({ ...draft, reviewer: event.target.value })} /></label>
      <label className="field"><span>Decision reason</span><textarea aria-label="Decision reason" maxLength={20000} rows={2} placeholder="What did you find and how does it relate to your rules?" value={reason} onChange={event => onDraft({ ...draft, reason: event.target.value })} /></label>
      <label className="field"><span>Screening decision</span><select aria-label="Screening decision" value={paper.decision} onChange={event => record(event.target.value as ScreeningEvent['decision'])}>
        <option value="unreviewed">Unreviewed</option>
        <option value="include" disabled={!reason.trim() && paper.decision !== 'include'}>Include</option>
        <option value="exclude" disabled={!reason.trim() && paper.decision !== 'exclude'}>Exclude</option>
        <option value="maybe" disabled={!reason.trim() && paper.decision !== 'maybe'}>Maybe</option>
      </select></label>
      {quickActions && <div className="button-row" role="group" aria-label="Quick screening decisions">{(['include', 'maybe', 'exclude'] as const).map(decision => <button key={decision} type="button" className="button secondary small" aria-pressed={paper.decision === decision} disabled={!reason.trim()} onClick={() => record(decision)}>{decision === 'include' ? 'Include' : decision === 'exclude' ? 'Exclude' : 'Maybe'}</button>)}</div>}
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
