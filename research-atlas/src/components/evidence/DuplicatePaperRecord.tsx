import type { Paper } from '@/lib/model';
import { External } from '@/components/shared/External';

export function DuplicatePaperRecord({ paper, label }: { paper: Paper; label: string }) {
  return <article><span className="eyebrow">RECORD {label}</span><h3>{paper.title}</h3><p>{paper.authors} · {paper.year ?? 'Year unknown'}</p><p>{paper.journal} · {paper.source}</p><p>DOI: {paper.doi ?? 'Unknown'}</p><p>{paper.decision} · {paper.evidenceClaims?.length ?? 0} claims · {paper.screeningEvents?.length ?? 0} screening events</p><External href={paper.url}>Inspect source {label}</External></article>;
}
