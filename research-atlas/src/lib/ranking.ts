import type { Paper, Project } from './model';

export const paperOrderLabels = {
  quartile: 'Journal quartile · Q1 first',
  impact: 'Field-adjusted citations · highest first',
  citations: 'Citation count · highest first',
  newest: 'Publication year · newest first',
  original: 'Original order',
} as const;

export const journalOrderLabels = {
  quartile: 'Journal quartile · Q1 first',
  citedness: 'Recent citations per paper · highest first',
  hIndex: 'Journal h-index · highest first',
  original: 'Shortlist order',
} as const;

export type PaperOrder = keyof typeof paperOrderLabels;
export type JournalOrder = keyof typeof journalOrderLabels;

function descending(a: number | null | undefined, b: number | null | undefined) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return b - a;
}

const quartilePosition = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 } as const;

function compareQuartile(a: Paper['journalQuartile'], b: Paper['journalQuartile']) {
  return (a ? quartilePosition[a.quartile] : 5) - (b ? quartilePosition[b.quartile] : 5);
}

export function orderPapers(papers: Paper[], order: PaperOrder) {
  if (order === 'original') return papers;
  if (order === 'quartile') {
    return [...papers].sort((a, b) => compareQuartile(a.journalQuartile, b.journalQuartile) || descending(a.citedByCount, b.citedByCount));
  }
  const key = { impact: 'fwci', citations: 'citedByCount', newest: 'year' } as const;
  return [...papers].sort((a, b) => descending(a[key[order]], b[key[order]]));
}

type Journal = Project['journalCandidates'][number];

export function orderJournals(journals: Journal[], order: JournalOrder) {
  if (order === 'original') return journals;
  if (order === 'quartile') {
    return [...journals].sort((a, b) => compareQuartile(a.metrics?.journalQuartile, b.metrics?.journalQuartile) || descending(a.metrics?.citedness, b.metrics?.citedness));
  }
  return [...journals].sort((a, b) => descending(a.metrics?.[order], b.metrics?.[order]));
}

export function normalizeIssn(value: string) {
  const raw = value.trim().toUpperCase().replace(/^ISSN\s+/i, '');
  const match = /^(\d{4})-?(\d{3}[\dX])$/.exec(raw);
  if (!match) throw Error('Enter an eight-character ISSN such as 0028-0836.');
  const digits = match[1] + match[2];
  const weighted = Array.from(digits.slice(0, 7)).reduce((sum, digit, index) => sum + Number(digit) * (8 - index), 0);
  const check = (11 - weighted % 11) % 11;
  if (digits[7] !== (check === 10 ? 'X' : String(check))) throw Error('That ISSN has an invalid check digit. Check it on the journal’s website.');
  return match[1] + '-' + match[2];
}

export function metricNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}
