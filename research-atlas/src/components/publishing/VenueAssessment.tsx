import { External } from '@/components/shared/External';
import { safeUrl } from '@/lib/model';
import type { Journal } from '@/components/workspace/execution-workspace-types';

export const journalChecks = [
  { id: 'identity', label: 'Checked the title, publisher, and ISSN against an authoritative source' },
  { id: 'scope', label: 'Read the journal scope and article requirements' },
  { id: 'fees', label: 'Checked fees, currency, and any waiver policy' },
  { id: 'review', label: 'Checked the review policy, editorial board, and archiving' },
];

export function VenueAssessment({ journal }: { journal: Journal }) {
  const metrics = journal.metrics;
  const warnings = [
    ...(journal.url && !safeUrl(journal.url) ? ['The entered website address is not a usable HTTP(S) link. Confirm the official publisher address.'] : []),
    ...(metrics && journal.title.trim().toLocaleLowerCase() !== metrics.title.trim().toLocaleLowerCase()
      ? ['The shortlist name differs from the matched metadata title. This may be an abbreviation; compare the title, publisher and ISSN before relying on the match.'] : []),
  ];
  const unknowns = [
    ...(!metrics ? ['A provider match for the journal identity has not been saved.'] : []),
    ...(!metrics?.journalQuartile ? ['A matched journal quartile is unavailable.'] : []),
    ...(!metrics?.journalFee ? ['The author publication fee is unknown; missing data does not mean free.'] : []),
    ...journalChecks.filter(check => !journal.checks.includes(check.id)).map(check => `Not recorded: ${check.label.replace(/^Checked /, '').replace(/^Read /, 'read ')}.`),
  ];
  return <section className="venue-assessment" aria-label={`Assessment of ${journal.title || 'journal candidate'}`}>
    <h3>Facts, warning signals, and unknowns</h3>
    <div className="guidance-group">
      <h4>Metadata facts and their source</h4>
      {metrics ? <><p>OpenAlex match: <strong>{metrics.title}</strong> · ISSN {metrics.issn}. Retrieved {new Date(metrics.checkedAt).toLocaleDateString()}.</p>
        <External href={metrics.sourceId}>Inspect the matched provider record</External>
        <p>Rank and fee values above retain their own source. Metadata matching establishes the recorded identity; it does not verify journal legitimacy, indexing claims, or article quality.</p></>
        : <p>No provider metadata has been matched. The title and website here are your entries.</p>}
    </div>
    <div className="guidance-group"><h4>Warning signals to investigate</h4>
      {warnings.length ? <ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul> : <p>No automatic mismatch signal was found in these fields. This is not a safety endorsement.</p>}
      <p>Check claims of guaranteed acceptance, unusually fast review, unexpected fees, or a committee you cannot verify against official sources.</p>
    </div>
    <div className="guidance-group"><h4>Unknowns and unfinished checks</h4>
      {unknowns.length ? <ul>{unknowns.map(unknown => <li key={unknown}>{unknown}</li>)}</ul> : <p>Your checklist entries are recorded. Recheck the current official sources before submission.</p>}
      <p>Any indexing claim, fee waiver, journal legitimacy, and acceptance remain unverified by Atlas. Record your evidence and dates below.</p>
    </div>
  </section>;
}
