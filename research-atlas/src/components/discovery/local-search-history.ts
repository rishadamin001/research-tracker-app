import { type Project } from '@/lib/model';
import { searchRunSchema } from '@/lib/search-provenance';

export const searchHistoryKey = 'research-atlas-search-history-v1';

export function readLocalSearches(): Project['searches'] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(searchHistoryKey) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.slice(-50).flatMap(item => {
      const parsed = searchRunSchema.safeParse(item);
      if (!parsed.success) return [];
      const run = parsed.data;
      return [{ query: run.executedQuery, source: run.provider, date: run.completedAt, count: run.resultIds?.length ?? run.pages.reduce((sum, page) => sum + (page.returnedCount ?? 0), 0), filters: run.filters.join(', '), run }];
    });
  } catch { return []; }
}
