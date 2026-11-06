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

export function doiWebsiteUrl(doi: string) {
  return `https://doi.org/${encodeURIComponent(normalizeDoi(doi))}`;
}
