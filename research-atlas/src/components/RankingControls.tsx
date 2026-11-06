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
    <span className={`quartile-badge ${value.quartile.toLowerCase()}`} aria-label={`Journal quartile ${value.quartile}`}>{value.quartile}</span>
    <div className="quartile-provenance"><External href={value.url}>{value.source} {value.year}</External><small>{value.category}{value.provisional ? ' · Provisional' : ''}</small></div>
  </div>;
}

export function PaperImpact({ paper }: { paper: Paper }) {
  return <div>
    <div className="paper-rank-row">
      <QuartileBadge value={paper.journalQuartile} fallback={paper.venueType && paper.venueType !== 'journal' ? 'Non-journal venue' : undefined} />
      <span className="paper-citations"><strong>{paper.citedByCount == null ? '—' : metricNumber(paper.citedByCount)}</strong> citations{paper.citedByCount == null ? ' · count unavailable' : ''}</span>
    </div>
    <div className="chips">
      <span className="tag">Field-adjusted citations {paper.fwci == null ? 'unavailable' : `${metricNumber(paper.fwci)}×`}</span>
      {paper.inDoaj && <span className="tag">DOAJ</span>}
      {paper.workType && <span className="tag">{paper.workType.replaceAll('-', ' ')}</span>}
    </div>
    {paper.isRetracted && <p className="error">OpenAlex flags this work as retracted. Check the publisher’s notice.</p>}
  </div>;
}

export function PaperOrderHelp() {
  return <details>
    <summary>What does this order measure?</summary>
    <p>Quartile order matches the journal’s ISSN to the POSI citation ranking. Q1 comes first, then Q2–Q4, then venues without a match. Ties use the paper’s OpenAlex citation count. The quartile belongs to the journal in the displayed subject and edition. Use it alongside the paper’s relevance and methods.</p>
    <p>Field-adjusted citations compare a work with similar OpenAlex records. A value of 1× means the expected citation count.</p>
    <External href="https://posi.panorama-sg.com/rankings/">POSI journal citation rankings</External>
    <External href="https://help.openalex.org/data/works/citations/">OpenAlex citation metrics</External>
  </details>;
}
