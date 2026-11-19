import { External } from '@/components/shared/External';
import { safeUrl } from '@/lib/model';
import { metricNumber } from '@/lib/ranking';
import { JournalMetrics } from './JournalMetrics';
import type { Journal } from '@/components/workspace/execution-workspace-types';
import { VenueAssessment } from './VenueAssessment';
import { WorkspaceNotesField } from '@/components/planning/WorkspaceNotesField';
import { journalChecks } from './VenueAssessment';

export function JournalEditor({ journal, onChange, onRemove }: {
  journal: Journal;
  onChange: (patch: Partial<Journal>) => void;
  onRemove: () => void;
}) {
  const website = safeUrl(journal.url);
  return <details className="panel matrix-paper">
    <summary style={{ overflowWrap: 'anywhere' }}>
      <span><strong>{journal.title || 'Untitled candidate'}</strong>
        <small>{journal.metrics
          ? `Recent citations per paper ${journal.metrics.citedness == null ? 'unavailable' : metricNumber(journal.metrics.citedness)} · h-index ${journal.metrics.hIndex == null ? 'unavailable' : metricNumber(journal.metrics.hIndex)} · OpenAlex`
          : 'Journal metrics unavailable'}</small>
      </span>
    </summary>
    <div className="lesson-body">
      <label className="field"><span>Journal title</span><input maxLength={200} value={journal.title} onChange={event => onChange({ title: event.target.value })} /></label>
      <label className="field"><span>Official journal website</span><input type="url" maxLength={2000} value={journal.url} onChange={event => onChange({ url: event.target.value })} /></label>
      {website && <External href={website}>Open journal website</External>}
      {journal.url && !website && <p className="muted">Enter a complete website address beginning with https:// or http://.</p>}
      <JournalMetrics value={journal.metrics} onChange={metrics => onChange({ metrics })} />
      <VenueAssessment journal={journal} />
      {journal.matchEvidence && <details><summary>Why this journal was suggested</summary><p>OpenAlex query: “{journal.matchEvidence.query}” · Retrieved {new Date(journal.matchEvidence.retrievedAt).toLocaleString()} · Identity grouping: {journal.matchEvidence.identityBasis}. This is a related-publication suggestion, not an independent quality or acceptance assessment.</p><ol>{journal.matchEvidence.articles.map(article => <li key={article.id}><External href={article.url}>{article.title}</External> · {article.year ?? 'Year unknown'} · Search position {article.position}</li>)}</ol></details>}
      <WorkspaceNotesField label="Scope and article fit" value={journal.scope} onChange={scope => onChange({ scope })} rows={3} />
      <WorkspaceNotesField label="Fees and waivers" value={journal.cost} onChange={cost => onChange({ cost })} placeholder="Record the official cost, currency, or whether the fees are still unknown." rows={3} />
      <fieldset>
        <legend>My verification checklist</legend>
        {journalChecks.map(check => <div key={check.id}>
          <label className="checkbox">
            <input type="checkbox" checked={journal.checks.includes(check.id)} onChange={event => onChange({
              checks: event.target.checked ? [...journal.checks, check.id] : journal.checks.filter(id => id !== check.id),
            })} />{' '}{check.label}
          </label>
        </div>)}
      </fieldset>
      <WorkspaceNotesField label="Verification sources and notes" value={journal.verification} onChange={verification => onChange({ verification })} placeholder="Record which official sources you checked, the dates, and what remains uncertain." rows={4} />
      <button className="text-button danger" onClick={onRemove}>Remove journal from shortlist</button>
    </div>
  </details>;
}
