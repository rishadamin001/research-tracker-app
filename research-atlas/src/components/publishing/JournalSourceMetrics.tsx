import type { JournalMetrics as MetricRecord } from '@/lib/model';
import { metricNumber } from '@/lib/ranking';
import { External } from '@/components/shared/External';
import { JournalFee, QuartileBadge } from '@/components/shared/publication/RankingControls';

export function JournalSourceMetrics({ value }: { value: MetricRecord }) {
  return <>
    <p><strong>{value.title}</strong> · ISSN {value.issn}</p>
    <QuartileBadge value={value.journalQuartile} />
    <dl className="paper-costs"><JournalFee fee={value.journalFee} /></dl>
    <div className="chips">
      <span className="tag">Recent citations per paper {value.citedness == null ? 'unavailable' : metricNumber(value.citedness)}</span>
      <span className="tag">Journal h-index {value.hIndex == null ? 'unavailable' : metricNumber(value.hIndex)}</span>
    </div>
    <p className="muted">OpenAlex · checked <time dateTime={value.checkedAt}>{new Date(value.checkedAt).toLocaleDateString()}</time></p>
    <External href={value.sourceId}>OpenAlex journal record</External>
  </>;
}
