import { External } from '@/components/shared/External';
import type { Paper } from '@/lib/model';
import { priceText } from './publication-price';
import { JournalFee } from './JournalFee';

export function PaperCosts({ paper }: { paper: Paper }) {
  const price = paper.readingCost;
  const free = price?.amount === 0 || (!price && Boolean(paper.oa));
  return <dl className="paper-costs">
    <div>
      <dt>Access status</dt>
      <dd>{free
        ? <strong>{paper.oa ? 'Free open copy' : 'Open access reported'}</strong>
        : price ? <strong>{priceText(price.amount, price.currency)}</strong> : 'Price unavailable'}</dd>
      {price && !paper.oa && <dd className="price-source">{price.url ? <External href={price.url}>{price.source}</External> : price.source}</dd>}
    </div>
    {(paper.venueType === 'journal' || paper.journalFee) && <JournalFee fee={paper.journalFee} />}
  </dl>;
}
