import { useState } from 'react';
import { External } from './External';
import { metricNumber, paperOrderLabels } from '@/lib/ranking';
import type { Paper } from '@/lib/model';
import './publication-badges.css';

export function useStoredOrder<Order extends string>(
  key: string,
  labels: Readonly<Record<Order, string>>,
  fallback: Order,
) {
  const [order, setOrder] = useState<Order>(() => {
    try {
      const value = localStorage.getItem(key);
      if (value && Object.hasOwn(labels, value)) return value as Order;
    } catch { /* Continue with the default if storage is unavailable. */ }
    return fallback;
  });
  return [order, (value: Order) => {
    if (!Object.hasOwn(labels, value)) return;
    setOrder(value);
    try { localStorage.setItem(key, value); } catch { /* Keep the current session choice. */ }
  }] as const;
}

export function OrderSelect<Order extends string>({ label, labels, order, onChange }: {
  label: string;
  labels: Readonly<Record<Order, string>>;
  order: Order;
  onChange: (value: Order) => void;
}) {
  return <label className="field">
    <span>{label}</span>
    <select value={order} onChange={event => onChange(event.target.value as Order)}>
      {Object.entries(labels).map(([value, text]) => <option key={value} value={value}>{String(text)}</option>)}
    </select>
  </label>;
}

export function usePaperOrder() {
  return useStoredOrder('atlas-literature-sort-v2', paperOrderLabels, 'quartile');
}

const publisherMarks = [
  { pattern: /\belsevier\b/i, asset: 'elsevier.svg' },
  { pattern: /^sage(?:\s|$)/i, asset: 'sage.svg' },
  { pattern: /\bspringer nature\b/i, asset: 'springer-nature.svg' },
  { pattern: /\bwiley\b/i, asset: 'wiley.svg' },
] as const;

export function PublicationIdentity({ title, publisher, type }: { title: string; publisher?: string; type?: string }) {
  const mark = publisher && publisherMarks.find(item => item.pattern.test(publisher));
  const initial = (publisher || title).trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const venueLabel = type === 'journal' ? 'Journal' : type === 'conference' ? 'Conference' : type === 'repository' ? 'Repository' : 'Publication venue';
  return <div className="publication-identity">
    <span className="publication-mark" aria-hidden="true">
      {mark ? <img src={`${import.meta.env.BASE_URL}publisher-marks/${mark.asset}`} loading="lazy" alt="" /> : initial || '•'}
    </span>
    <span><small>{venueLabel}</small><strong>{title}</strong>{publisher && <small>{publisher}</small>}</span>
  </div>;
}

export function QuartileBadge({ value, fallback = 'Quartile unavailable' }: { value: Paper['journalQuartile']; fallback?: string }) {
  if (!value) return <span className="quartile-badge unavailable">{fallback}</span>;
  return <div className="quartile-marker">
    <span className={`quartile-badge ${value.quartile.toLowerCase()}`} title={`Venue metric, not a paper-quality score. ${value.source} Citation Quartile for the journal in ${value.category}. SJR and JCR publish separate rankings.`}>{value.source} {value.quartile} · {value.year}</span>
    <div className="quartile-provenance"><small>{value.category}{value.provisional ? ' · Provisional' : ''}</small><External href={value.url}>{value.source} ranking source</External></div>
  </div>;
}

function priceText(amount: number, currency: string) {
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, currencyDisplay: 'code' }).format(amount);
}

export function JournalFee({ fee }: { fee: Paper['journalFee'] }) {
  return <div>
    <dt>Author publication fee</dt>
    <dd>{fee ? <><strong>{priceText(fee.amount, fee.currency)}</strong> <small>Listed open access APC</small></> : 'Unknown — verify with publisher'}</dd>
    {fee && <dd className="price-source">{fee.url ? <External href={fee.url}>{fee.source}</External> : fee.source}</dd>}
    {fee?.checkedAt && <dd className="muted">Retrieved <time dateTime={fee.checkedAt}>{new Date(fee.checkedAt).toLocaleDateString()}</time> · confirm current options with publisher</dd>}
  </div>;
}

function PaperCosts({ paper }: { paper: Paper }) {
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

export function PaperImpact({ paper }: { paper: Paper }) {
  return <div>
    <div className="paper-rank-row">
      <QuartileBadge value={paper.journalQuartile} fallback={paper.venueType && paper.venueType !== 'journal' ? 'Non-journal venue' : undefined} />
      <span className="paper-citations"><strong>{paper.citedByCount == null ? '—' : metricNumber(paper.citedByCount)}</strong> citations{paper.citedByCount == null ? ' · count unavailable' : ''}</span>
    </div>
    <div className="chips">
      <span className="tag">Citation metadata: {['OpenAlex', 'Europe PMC', 'Crossref'].includes(paper.source) ? paper.source : 'source not recorded'}{paper.metricsRetrievedAt ? ` · retrieved ${new Date(paper.metricsRetrievedAt).toLocaleDateString()}` : ' · retrieval date not recorded'}</span>
      <span className="tag">Field-adjusted citations {paper.fwci == null ? 'unavailable' : `${metricNumber(paper.fwci)}×`}</span>
      {paper.inDoaj && <span className="tag">DOAJ</span>}
      {paper.workType && <span className="tag">{paper.workType.replaceAll('-', ' ')}</span>}
    </div>
    <PaperCosts paper={paper} />
    {paper.isRetracted && <p className="error">The recorded source flags this work as retracted. Check the publisher’s notice.</p>}
  </div>;
}

export function PaperOrderHelp() {
  return <details>
    <summary>What does this order measure?</summary>
    <p>Quartile order matches the journal’s ISSN to the POSI citation ranking. Q1 comes first, then Q2–Q4, then venues without a match. Ties use the recorded citation count. Counts from different providers cover different indexes. Each badge gives the POSI subject and edition. SJR and JCR use separate ranking systems. Use venue rank alongside the paper’s relevance and methods.</p>
    <p>Field-adjusted citations compare a work with similar OpenAlex records. A value of 1× means the expected citation count.</p>
    <p>Date sorting uses the recorded publication date when available, then the year. Price sorting puts unknown amounts last. Journal publishing fees are compared using available USD equivalents.</p>
    <External href="https://posi.panorama-sg.com/rankings/">POSI journal citation rankings</External>
    <External href="https://help.openalex.org/data/works/citations/">OpenAlex citation metrics</External>
  </details>;
}
