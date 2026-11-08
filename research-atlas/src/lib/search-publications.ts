import { runPaperSearch, continuePaperSearch } from './providers';
import { runAdditionalSearch } from './additional-search';
import type { SearchProvider, SearchRun } from './search-provenance';

export const searchProviders = {
  OpenAlex: { label: 'All disciplines · OpenAlex', description: 'Broad scholarly discovery across disciplines. Citation relationships and available journal fees are supplied by OpenAlex.' },
  'Europe PMC': { label: 'Medicine & life sciences · Europe PMC', description: 'Biomedical and life-science literature, including PubMed records. Abstracts, open copies and citation counts are shown when supplied.' },
  Crossref: { label: 'Journal articles across disciplines · Crossref', description: 'Journal article DOI records deposited by publishers. Useful for checking titles and finding additional references; metadata completeness varies.' },
} as const;

export function searchYear(run?: SearchRun): string {
  return run?.filters.join(',').match(/(?:from_publication_date:|from-pub-date:|FIRST_PDATE:\[)(\d{4})/)?.[1] ?? '';
}
export function searchOpenAccess(run?: SearchRun) {
  return Boolean(run?.filters.some(filter => filter === 'is_oa:true' || filter === 'OPEN_ACCESS:Y'));
}
export function runPublicationSearch(provider: SearchProvider, query: string, year: string, openAccess: boolean, signal?: AbortSignal) {
  return provider === 'OpenAlex' ? runPaperSearch(query, year, openAccess, signal) : runAdditionalSearch(provider, query, year, openAccess, signal);
}
export function continuePublicationSearch(run: SearchRun, signal?: AbortSignal) {
  return run.provider === 'OpenAlex' ? continuePaperSearch(run, signal) : runAdditionalSearch(run.provider, run.userQuery, searchYear(run), searchOpenAccess(run), signal, run);
}
