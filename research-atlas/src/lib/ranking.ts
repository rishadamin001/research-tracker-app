import type { Paper, Project } from './model';

export const paperOrderLabels = {
  quartile: 'POSI journal quartile · Q1 first',
  impact: 'Field-adjusted citations · highest first',
  citations: 'Citation count · highest first',
  newest: 'Publication date · newest first',
  oldest: 'Publication date · oldest first',
  readingCost: 'Reading price · lowest first',
  readingCostHigh: 'Reading price · highest first',
  journalFee: 'Journal publishing fee · lowest first',
  journalFeeHigh: 'Journal publishing fee · highest first',
  original: 'Original order',
} as const;

export const journalOrderLabels = {
  quartile: 'POSI journal quartile · Q1 first',
  citedness: 'Recent citations per paper · highest first',
  hIndex: 'Journal h-index · highest first',
  journalFee: 'Journal publishing fee · lowest first',
  journalFeeHigh: 'Journal publishing fee · highest first',
  original: 'Shortlist order',
} as const;

export type PaperOrder = keyof typeof paperOrderLabels;
export type JournalOrder = keyof typeof journalOrderLabels;

function compareNumbers(a: number | null | undefined, b: number | null | undefined, ascending = false) {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return ascending ? a - b : b - a;
}

const quartilePosition = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 } as const;

function compareQuartile(a: Paper['journalQuartile'], b: Paper['journalQuartile']) {
  return (a ? quartilePosition[a.quartile] : 5) - (b ? quartilePosition[b.quartile] : 5);
}

function comparePublication(a: Paper, b: Paper, ascending: boolean) {
  const yearA = a.publicationDate ? Number(a.publicationDate.slice(0, 4)) : a.year;
  const yearB = b.publicationDate ? Number(b.publicationDate.slice(0, 4)) : b.year;
  return compareNumbers(yearA, yearB, ascending) || compareNumbers(
    a.publicationDate ? Date.parse(a.publicationDate) : undefined,
    b.publicationDate ? Date.parse(b.publicationDate) : undefined,
    ascending,
  );
}

function readingUsd(paper: Paper) {
  const price = paper.readingCost;
  if (!price && paper.oa) return 0;
  return price?.currency === 'USD' || price?.amount === 0 ? price.amount : undefined;
}

function journalFeeUsd(price: Paper['journalFee']) {
  return price?.usd ?? (price?.currency === 'USD' || price?.amount === 0 ? price.amount : undefined);
}

export function orderPapers(papers: Paper[], order: PaperOrder) {
  if (order === 'original') return papers;
  if (order === 'quartile') {
    return [...papers].sort((a, b) => compareQuartile(a.journalQuartile, b.journalQuartile) || compareNumbers(a.citedByCount, b.citedByCount));
  }
  if (order === 'newest' || order === 'oldest') {
    return [...papers].sort((a, b) => comparePublication(a, b, order === 'oldest'));
  }
  if (order === 'readingCost' || order === 'readingCostHigh') {
    return [...papers].sort((a, b) => compareNumbers(readingUsd(a), readingUsd(b), order === 'readingCost'));
  }
  if (order === 'journalFee' || order === 'journalFeeHigh') {
    return [...papers].sort((a, b) => compareNumbers(journalFeeUsd(a.journalFee), journalFeeUsd(b.journalFee), order === 'journalFee'));
  }
  const key = order === 'impact' ? 'fwci' : 'citedByCount';
  return [...papers].sort((a, b) => compareNumbers(a[key], b[key]));
}

type Journal = Project['journalCandidates'][number];

export function orderJournals(journals: Journal[], order: JournalOrder) {
  if (order === 'original') return journals;
  if (order === 'quartile') {
    return [...journals].sort((a, b) => compareQuartile(a.metrics?.journalQuartile, b.metrics?.journalQuartile) || compareNumbers(a.metrics?.citedness, b.metrics?.citedness));
  }
  if (order === 'journalFee' || order === 'journalFeeHigh') {
    return [...journals].sort((a, b) => compareNumbers(journalFeeUsd(a.metrics?.journalFee), journalFeeUsd(b.metrics?.journalFee), order === 'journalFee'));
  }
  return [...journals].sort((a, b) => compareNumbers(a.metrics?.[order], b.metrics?.[order]));
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
