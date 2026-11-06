import { normalizeIssn } from './ranking';

export type Quartile = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export type JournalQuartile = {
  quartile: Quartile;
  source: string;
  year: number;
  category: string;
  url: string;
  provisional?: boolean;
};

type QuartileIndex = {
  source: string;
  year: number;
  categories: string[];
  rows: string;
};

const categoryKeys = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const bucketCount = 8;
const rowWidth = 10;
const quartileIndexes = new Map<number, Promise<QuartileIndex | undefined>>();

function loadIndex(bucket: number): Promise<QuartileIndex | undefined> {
  let request = quartileIndexes.get(bucket);
  if (!request) {
    const base = import.meta.env?.BASE_URL || '/';
    request = fetch(`${base}data/journal-quartiles-${bucket}.json`, { signal: AbortSignal.timeout(4000) }).then(async response => {
      if (!response.ok) throw new Error('Journal quartiles are temporarily unavailable.');
      const index = await response.json() as Partial<QuartileIndex>;
      if (index?.source !== 'POSI' || !Number.isInteger(index.year) || !Array.isArray(index.categories)
          || typeof index.rows !== 'string' || index.rows.length % rowWidth !== 0) {
        throw new Error('Invalid journal quartile index.');
      }
      return index as QuartileIndex;
    }).catch(() => {
      // Bibliographic results remain usable when a rank shard cannot be loaded.
      quartileIndexes.delete(bucket);
      return undefined;
    });
    quartileIndexes.set(bucket, request);
  }
  return request;
}

function validIssns(values: readonly (string | null | undefined)[]): string[] {
  return values.flatMap(value => {
    if (!value) return [];
    try { return [normalizeIssn(value)]; } catch { return []; }
  });
}

/** Supply the venue's ISSN-L first. Print and electronic ISSNs are exact fallback keys. */
export async function findJournalQuartile(issns: readonly (string | null | undefined)[]): Promise<JournalQuartile | undefined> {
  const identifiers = [...new Set(validIssns(issns))];
  const matches = await Promise.all(identifiers.map(async issn => {
    const compact = issn.replace('-', '');
    const bucket = [...compact.slice(0, 7)].reduce((sum, digit) => sum + Number(digit), 0) % bucketCount;
    const index = await loadIndex(bucket);
    return index && findInIndex(index, compact);
  }));
  return matches.find(match => match !== undefined);
}

function findInIndex(index: QuartileIndex, compact: string): JournalQuartile | undefined {
  let low = 0;
  let high = index.rows.length / rowWidth - 1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const offset = middle * rowWidth;
    const key = index.rows.slice(offset, offset + 8);
    if (key < compact) { low = middle + 1; continue; }
    if (key > compact) { high = middle - 1; continue; }
    const rank = Number(index.rows[offset + 9]);
    const category = index.categories[categoryKeys.indexOf(index.rows[offset + 8])];
    if (!category || rank < 1 || rank > 8 || !Number.isInteger(rank)) return undefined;
    const quartile = (['Q1', 'Q2', 'Q3', 'Q4'] as const)[(rank - 1) % 4];
    return { quartile, source: index.source, year: index.year, category, provisional: rank > 4,
      url: 'https://posi.panorama-sg.com/rankings/' };
  }
  return undefined;
}
