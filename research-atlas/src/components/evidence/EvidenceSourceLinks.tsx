import { type Paper } from '@/lib/model';
import { External } from '@/components/shared/External';

export function EvidenceSourceLinks({ paper }: { paper: Paper }) {
  return <div className="button-row">{paper.url && <External href={paper.url}>Open source</External>}{paper.oa && paper.oa !== paper.url && <External href={paper.oa}>Read open copy</External>}</div>;
}
