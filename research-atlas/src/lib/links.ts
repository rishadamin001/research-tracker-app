import { normalizeDoi } from './model';

export const sourceLinks = {
  researchPerspectives: 'https://www.open.edu/openlearn/mod/oucontent/view.php?id=48638',
  prismaExplanation: 'https://www.prisma-statement.org/prisma-2020-explanation-elaboration',
  scopus: 'https://www.scopus.com/sources.uri',
};

export function searchWebsiteUrl(query: string) {
  const url = new URL('https://search.crossref.org/');
  if (query.trim()) url.searchParams.set('q', query.trim());
  return url.href;
}

export function scholarlySearchLinks(query: string) {
  const terms = query.trim();
  return [
    { name: 'Google Scholar', base: 'https://scholar.google.com/scholar', key: 'q' },
    { name: 'PubMed', base: 'https://pubmed.ncbi.nlm.nih.gov/', key: 'term' },
    { name: 'ResearchGate', base: 'https://www.researchgate.net/search/publication', key: 'q' },
    { name: 'Semantic Scholar', base: 'https://www.semanticscholar.org/search', key: 'q' },
  ].map(({ name, base, key }) => { const url = new URL(base); if (terms) url.searchParams.set(key, terms); return { name, url: url.href }; });
}

export function doiWebsiteUrl(doi: string) {
  return `https://doi.org/${encodeURIComponent(normalizeDoi(doi))}`;
}
