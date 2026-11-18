import { useState } from 'react';
import { screeningCriterionLimit, type ScreeningCriterion } from '@/lib/evidence-ledger';

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
      <label className="field"><span>Criterion type</span><select aria-label="Criterion type" value={kind} onChange={event => setKind(event.target.value === 'exclude' ? 'exclude' : 'include')}>
        <option value="include">Inclusion rule</option><option value="exclude">Exclusion rule</option>
      </select></label>
      <label className="field"><span>Criterion rule</span><input value={rule} maxLength={300} onChange={event => setRule(event.target.value)} required /></label>
      <button type="submit" className="button secondary small" disabled={!rule.trim()}>Add criterion</button>
    </form> : <p>You have 50 active criteria. Retire a rule to make space. Past decisions keep the rule used at the time.</p>}
  </details>;
}
