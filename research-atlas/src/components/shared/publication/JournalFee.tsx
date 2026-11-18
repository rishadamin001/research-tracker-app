import { External } from '@/components/shared/External';
import type { Paper } from '@/lib/model';
import { priceText } from './publication-price';

export function JournalFee({ fee }: { fee: Paper['journalFee'] }) {
  return <div>
    <dt>Author publication fee</dt>
    <dd>{fee ? <><strong>{priceText(fee.amount, fee.currency)}</strong> <small>Listed open access APC</small></> : 'Unknown — verify with publisher'}</dd>
    {fee && <dd className="price-source">{fee.url ? <External href={fee.url}>{fee.source}</External> : fee.source}</dd>}
    {fee?.checkedAt && <dd className="muted">Retrieved <time dateTime={fee.checkedAt}>{new Date(fee.checkedAt).toLocaleDateString()}</time> · confirm current options with publisher</dd>}
  </div>;
}
