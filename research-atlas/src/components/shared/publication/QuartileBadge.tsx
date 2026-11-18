import { External } from '@/components/shared/External';
import type { Paper } from '@/lib/model';

export function QuartileBadge({ value, fallback = 'Quartile unavailable' }: { value: Paper['journalQuartile']; fallback?: string }) {
  if (!value) return <span className="quartile-badge unavailable">{fallback}</span>;
  return <div className="quartile-marker">
    <span className={`quartile-badge ${value.quartile.toLowerCase()}`} title={`Venue metric, not a paper-quality score. ${value.source} Citation Quartile for the journal in ${value.category}. SJR and JCR publish separate rankings.`}>{value.source} {value.quartile} · {value.year}</span>
    <div className="quartile-provenance"><small>{value.category}{value.provisional ? ' · Provisional' : ''}</small><External href={value.url}>{value.source} ranking source</External></div>
  </div>;
}
