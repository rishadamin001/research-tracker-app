import { useState } from 'react';
import { paperOrderLabels, type PaperOrder } from '@/lib/ranking';

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

export function usePaperOrder(fallback: PaperOrder = 'quartile') {
  return useStoredOrder<PaperOrder>('atlas-literature-sort-v2', paperOrderLabels, fallback);
}
