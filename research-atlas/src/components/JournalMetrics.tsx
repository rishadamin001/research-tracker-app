import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { JournalMetrics as MetricRecord } from '@/lib/model';
import { checkJournalMetrics } from '@/lib/providers';
import { metricNumber } from '@/lib/ranking';
import { External } from './External';
import { QuartileBadge } from './RankingControls';

function SourceMetrics({ value }: { value: MetricRecord }) {
  return <>
    <p><strong>{value.title}</strong> · ISSN {value.issn}</p>
    <QuartileBadge value={value.journalQuartile} />
    <div className="chips">
      <span className="tag">Recent citations per paper {value.citedness == null ? 'unavailable' : metricNumber(value.citedness)}</span>
      <span className="tag">Journal h-index {value.hIndex == null ? 'unavailable' : metricNumber(value.hIndex)}</span>
    </div>
    <p className="muted">OpenAlex · checked <time dateTime={value.checkedAt}>{new Date(value.checkedAt).toLocaleDateString()}</time></p>
    <External href={value.sourceId}>OpenAlex journal record</External>
  </>;
}

export function JournalMetrics({ value, onChange }: {
  value: MetricRecord | undefined;
  onChange: (metrics: MetricRecord | undefined) => void;
}) {
  const [issn, setIssn] = useState(value?.issn ?? '');
  const [candidate, setCandidate] = useState<MetricRecord>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => {
    request.current?.abort();
    request.current = null;
  }, []);

  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort(), 15000);
    setBusy(true);
    setCandidate(undefined);
    setError('');
    try {
      const result = await checkJournalMetrics(issn, controller.signal);
      if (request.current === controller) setCandidate(result);
    } catch (failure) {
      if (request.current !== controller) return;
      const message = failure instanceof Error && failure.name !== 'ZodError' ? failure.message : 'OpenAlex could not supply readable journal data.';
      setError(controller.signal.aborted ? 'The lookup timed out. Please try again.' : message);
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }

  return <section className="recommendation" aria-label="Journal citation metrics">
    <h3>Compare journal citation metrics</h3>
    <p>Enter the journal’s print or online ISSN from the publisher’s page. Check the returned title before saving the match.</p>
    <form onSubmit={lookup}>
      <label className="field">
        <span>Journal ISSN</span>
        <input maxLength={16} value={issn} onChange={event => { setIssn(event.target.value); setCandidate(undefined); setError(''); }} disabled={busy} placeholder="0028-0836" required />
      </label>
      <button className="button secondary" disabled={busy || !issn.trim()}>{busy ? 'Looking up journal…' : 'Look up journal metrics'}</button>
    </form>
    {error && <p className="error" role="alert">{error}</p>}
    {candidate ? (
      <div aria-label="Journal match">
        <SourceMetrics value={candidate} />
        <button type="button" className="button" onClick={() => { onChange(candidate); setCandidate(undefined); }}>Use matched journal</button>
      </div>
    ) : value && (
      <div>
        <SourceMetrics value={value} />
        <button type="button" className="text-button" onClick={() => onChange(undefined)}>Clear saved metrics</button>
      </div>
    )}
  </section>;
}
