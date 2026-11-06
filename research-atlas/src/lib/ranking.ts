import type { Paper, Project } from './model';

export const paperOrderLabels = {
  impact: 'Field-adjusted citations · highest first',
  citations: 'Citation count · highest first',
  newest: 'Publication year · newest first',
  original: 'Original order',
} as const;

export const journalOrderLabels = {
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

export function orderPapers(papers: Paper[], order: PaperOrder) {
  if (order === 'original') return papers;
  const key = { impact: 'fwci', citations: 'citedByCount', newest: 'year' } as const;
  return [...papers].sort((a, b) => descending(a[key[order]], b[key[order]]));
}

type Journal = Project['journalCandidates'][number];

export function orderJournals(journals: Journal[], order: JournalOrder) {
  if (order === 'original') return journals;
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
