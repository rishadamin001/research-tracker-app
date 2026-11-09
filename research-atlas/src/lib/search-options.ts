import { PaperSearchError, type SearchProvider, type SearchRun } from './search-provenance';

export type SearchOptions = {
  documentType?: 'article' | 'review';
  sourceType?: 'journal' | 'repository' | 'medline' | 'pmc';
};

export const searchFilterChoices = {
  OpenAlex: {
    documents: [['', 'All document types'], ['article', 'Articles'], ['review', 'Reviews']],
    sources: [['', 'All indexed sources'], ['journal', 'Primary journal source'], ['repository', 'Primary repository source']],
    note: 'OpenAlex assigns document types and a primary source. A repository copy can exist even when the primary source is a journal.',
  },
  'Europe PMC': {
    documents: [['', 'All publication types'], ['article', 'Journal Article publication type'], ['review', 'Review publication type']],
    sources: [['', 'All Europe PMC sources'], ['medline', 'PubMed records (MED)'], ['pmc', 'PubMed Central records (PMC)']],
    note: 'Europe PMC publication types may overlap: a review can also be labeled Journal Article. MED and PMC identify record collections, not journal-quality levels.',
  },
  Crossref: {
    documents: [['', 'Journal article DOI records']],
    sources: [['', 'Publisher-deposited Crossref records']],
    note: 'Crossref does not reliably distinguish research articles, reviews and drug-reaction notices within journal-article metadata. These subtype and repository filters are unavailable here. Use OpenAlex or Europe PMC for those choices.',
  },
} as const;

export function providerSearchFilterTokens(provider: SearchProvider, options: SearchOptions = {}): string[] {
  const choices = searchFilterChoices[provider];
  if (options.documentType && !choices.documents.some(([value]) => value === options.documentType)) throw new PaperSearchError(`${provider} does not support that document-type filter here. Choose an available filter or another provider.`);
  if (options.sourceType && !choices.sources.some(([value]) => value === options.sourceType)) throw new PaperSearchError(`${provider} does not support that source filter here. Choose an available filter or another provider.`);
  if (provider === 'OpenAlex') return [
    ...(options.documentType ? [`type:${options.documentType}`] : []),
    ...(options.sourceType ? [`primary_location.source.type:${options.sourceType}`] : []),
  ];
  if (provider === 'Europe PMC') return [
    ...(options.documentType ? [`PUB_TYPE:"${options.documentType === 'review' ? 'Review' : 'Journal Article'}"`] : []),
    ...(options.sourceType ? [`SRC:${options.sourceType === 'medline' ? 'MED' : 'PMC'}`] : []),
  ];
  return [];
}

export function searchOptionsFromRun(run?: SearchRun): SearchOptions {
  const filters = run?.filters ?? [];
  const documentType = filters.includes('type:review') || filters.includes('PUB_TYPE:"Review"') ? 'review'
    : filters.includes('type:article') || filters.includes('PUB_TYPE:"Journal Article"') ? 'article' : undefined;
  const sourceType = filters.includes('primary_location.source.type:journal') ? 'journal'
    : filters.includes('primary_location.source.type:repository') ? 'repository'
      : filters.includes('SRC:MED') ? 'medline' : filters.includes('SRC:PMC') ? 'pmc' : undefined;
  return { documentType, sourceType };
}

export function officialPublicationSearchUrl(provider: SearchProvider, query: string): string {
  const url = new URL(provider === 'OpenAlex' ? 'https://openalex.org/works' : provider === 'Europe PMC' ? 'https://europepmc.org/search' : 'https://search.crossref.org/');
  const terms = query.trim();
  if (terms) url.searchParams.set(provider === 'Europe PMC' ? 'query' : provider === 'OpenAlex' ? 'search' : 'q', terms);
  return url.href;
}
