import { useState } from 'react';
import { External } from './External';
import { metricNumber, paperOrderLabels } from '@/lib/ranking';
import type { Paper } from '@/lib/model';

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
  return useStoredOrder('atlas-literature-sort', paperOrderLabels, 'impact');
}

export function PaperImpact({ paper }: { paper: Paper }) {
  return <div>
    <div className="chips">
      <span className="tag">Field-adjusted citations {paper.fwci == null ? 'unavailable' : `${metricNumber(paper.fwci)}×`}</span>
      <span className="tag">Citations {paper.citedByCount == null ? 'unavailable' : metricNumber(paper.citedByCount)}</span>
      {paper.workType && <span className="tag">{paper.workType.replaceAll('-', ' ')}</span>}
    </div>
    {paper.isRetracted && <p className="error">OpenAlex flags this work as retracted. Check the publisher’s notice.</p>}
  </div>;
}

export function PaperOrderHelp() {
  return <details>
    <summary>What does this order measure?</summary>
    <p>OpenAlex compares a paper’s citations with similar papers from the same year, subfield, and publication type. 1× is the expected count. Missing values go last. Use the order to decide what to read first, then check the methods, relevance, and publication status yourself.</p>
    <External href="https://help.openalex.org/data/works/citations/">OpenAlex citation metrics</External>
  </details>;
}
