import { z } from 'zod';
import { normalizeDoi, safeUrl, type JournalFee, type JournalMetrics, type Paper } from './model';
import { normalizeIssn } from './ranking';
import { findJournalQuartile } from './quartiles';
import { openAlexSearch, PaperSearchError, type SearchRun } from './search-provenance';
import { providerSearchFilterTokens, searchOptionsFromRun, type SearchOptions } from './search-options';
import { requestProviderPage } from './provider-search-request';
import { bibliographyMetadata, bibliographyText, pageRange } from './bibliography-metadata';
export { PaperSearchError } from './search-provenance';

const venue = z.object({
  display_name: z.string(),
  type: z.string().nullish(),
  issn_l: z.string().nullish(),
  issn: z.array(z.string()).nullish(),
  host_organization_name: z.string().nullish(),
  host_organization_lineage_names: z.array(z.string()).nullish(),
  is_in_doaj: z.boolean().nullish(),
});

const priceCurrency = z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).nullish().catch(null);
const priceAmount = z.number().nonnegative().nullish().catch(null);
const apcList = z.object({ value: priceAmount, currency: priceCurrency, value_usd: priceAmount }).nullish().catch(null);
const optionalBibliographyText = bibliographyText.nullish().catch(undefined);

const work = z.object({
  id: z.string(),
  display_name: z.string().nullable(),
  publication_year: z.number().nullable(),
  publication_date: z.iso.date().nullish().catch(null),
  doi: z.string().nullable(),
  authorships: z.array(z.object({ author: z.object({ display_name: z.string() }) })).default([]),
  biblio: z.object({ volume: optionalBibliographyText, issue: optionalBibliographyText, first_page: optionalBibliographyText, last_page: optionalBibliographyText }).nullish().catch(undefined),
  primary_location: z.object({ source: venue.nullish(), landing_page_url: z.string().nullish() }).nullish(),
  best_oa_location: z.object({ landing_page_url: z.string().nullish(), pdf_url: z.string().nullish() }).nullish(),
  open_access: z.object({ is_oa: z.boolean().nullish(), oa_url: z.string().nullish() }).nullish().catch(null),
  apc_list: apcList,
  referenced_works: z.array(z.string()).nullish(),
  fwci: z.number().nonnegative().nullish().catch(null),
  cited_by_count: z.number().int().nonnegative().nullish().catch(null),
  type: z.string().max(100).nullish().catch(null),
  is_retracted: z.boolean().nullish().catch(null),
  abstract_inverted_index: z.unknown().optional(),
});

function providerAbstract(raw: unknown): string | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const entries = Object.entries(raw);
  if (entries.length > 4000) return undefined;
  const words: string[] = [];
  let count = 0;
  for (const [word, positions] of entries) {
    if (!word || word.length > 500 || !Array.isArray(positions) || positions.length > 4000) return undefined;
    for (const position of positions) {
      if (!Number.isInteger(position) || position < 0 || position >= 4000 || words[position] !== undefined || ++count > 4000) return undefined;
      words[position] = word;
    }
  }
  if (!count || count !== words.length) return undefined;
  const text = words.join(' ');
  return text.length <= 20000 ? text : undefined;
}

function openAlexRecord(id: string | null | undefined, entity: 'works' | 'sources') {
  const identifier = /^https:\/\/openalex\.org\/([WS]\d+)$/.exec(id ?? '')?.[1];
  if (!identifier?.startsWith(entity === 'works' ? 'W' : 'S')) return undefined;
  return `https://api.openalex.org/${entity}/${identifier}`;
}

function journalListPrice(
  amount: number | null | undefined,
  currency: string | null | undefined,
  usd: number | null | undefined,
  url?: string,
): JournalFee | undefined {
  if (amount != null && currency) {
    return { amount, currency, source: 'OpenAlex', usd: amount === 0 || currency === 'USD' ? amount : usd ?? undefined, url, checkedAt: new Date().toISOString() };
  }
  // A zero value is currency independent, including when the provider omits its currency.
  if (amount === 0) return { amount, currency: 'USD', source: 'OpenAlex', usd: 0, url, checkedAt: new Date().toISOString() };
  if (usd != null) return { amount: usd, currency: 'USD', source: 'OpenAlex', usd, url, checkedAt: new Date().toISOString() };
  return undefined;
}

export function parseWorks(raw: unknown): Paper[] {
  return z.object({ results: z.array(work) }).parse(raw).results.map(item => {
    const source = item.primary_location?.source;
    const issns = [...new Set([source?.issn_l, ...(source?.issn ?? [])].filter((value): value is string => !!value))].slice(0, 12);
    const openCopy = safeUrl(item.best_oa_location?.landing_page_url) || safeUrl(item.best_oa_location?.pdf_url) || safeUrl(item.open_access?.oa_url);
    const readingIsFree = item.open_access?.is_oa ?? Boolean(openCopy);
    const workRecord = openAlexRecord(item.id, 'works');
    const authors = item.authorships.map(authorship => authorship.author.display_name.trim().slice(0, 500)).filter(Boolean).slice(0, 500);
    return {
      id: item.id,
      title: item.display_name || 'Untitled work',
      authors: authors.join(', ').slice(0, 20000),
      referenceAuthors: authors.length ? authors : undefined,
      bibliographyMetadata: bibliographyMetadata({
        volume: item.biblio?.volume ?? undefined, issue: item.biblio?.issue ?? undefined,
        pages: pageRange(item.biblio?.first_page, item.biblio?.last_page),
      }),
      year: item.publication_year,
      publicationDate: item.publication_date ?? undefined,
      doi: item.doi ? normalizeDoi(item.doi) : null,
      journal: source?.display_name || 'Source not supplied',
      url: safeUrl(item.doi) || safeUrl(item.primary_location?.landing_page_url) || safeUrl(item.id) || '',
      oa: readingIsFree ? openCopy ?? null : null,
      readingCost: readingIsFree ? { amount: 0, currency: 'USD', source: 'OpenAlex', url: workRecord } : undefined,
      journalFee: source?.type === 'journal' && item.apc_list
        ? journalListPrice(item.apc_list.value, item.apc_list.currency, item.apc_list.value_usd, workRecord)
        : undefined,
      source: 'OpenAlex',
      notes: '',
      researchProblem: '',
      dataset: '',
      finding: '',
      methods: '',
      limitations: '',
      locator: '',
      decision: 'unreviewed',
      reason: '',
      referenceIds: item.referenced_works?.filter(id => /^https:\/\/openalex\.org\/W\d+$/.test(id)).slice(0, 500),
      fwci: item.fwci ?? undefined,
      citedByCount: item.cited_by_count ?? undefined,
      metricsRetrievedAt: new Date().toISOString(),
      abstract: providerAbstract(item.abstract_inverted_index),
      workType: item.type ?? undefined,
      isRetracted: item.is_retracted ?? undefined,
      publisher: (source?.host_organization_name || source?.host_organization_lineage_names?.[0])?.slice(0, 500),
      venueType: source?.type?.slice(0, 100),
      inDoaj: source?.is_in_doaj ?? undefined,
      issns: issns.length ? issns : undefined,
    };
  });
}
const API=import.meta.env?.VITE_API_URL?.replace(/\/$/,'')||'';
async function request(url:string,signal?:AbortSignal){const res=await fetch(url,{signal:signal??AbortSignal.timeout(15000)});if(res.status===429)throw Error('The free research service is at its limit. Try later or use the official search link below. Your work is safe.');if(!res.ok)throw Error(`The research service is unavailable (${res.status}). Try the official source below.`);return res.json();}

const searchMeta = z.object({ meta: z.object({ count: z.number().int().nonnegative() }).optional().catch(undefined) });

export async function runPaperSearch(query: string, year: string, oa: boolean, signal?: AbortSignal, previous?: SearchRun, options: SearchOptions = {}): Promise<{ papers: Paper[]; run: SearchRun }> {
  const executedQuery = query.trim();
  if (executedQuery.length < 3 || query.length > 300) throw new PaperSearchError('Use a search between 3 and 300 characters.');
  if (/\b(AND|OR|NOT)\b|[()*]/.test(query)) throw new PaperSearchError('Atlas searches keyword phrases. OpenAlex’s website supports advanced Boolean syntax.');
  const params = new URLSearchParams({ search: executedQuery, per_page: String(openAlexSearch.pageSize) });
  const filters: string[] = [];
  if (year) {
    if (!/^\d{4}$/.test(year) || Number(year) < 1800 || Number(year) > new Date().getFullYear()) throw new PaperSearchError('Enter a valid starting year.');
    filters.push(`from_publication_date:${year}-01-01`);
  }
  if (oa) filters.push('is_oa:true');
  filters.push(...providerSearchFilterTokens('OpenAlex', options));
  if (filters.length) params.set('filter', filters.join(','));
  if (previous && (previous.executedQuery !== executedQuery || previous.filters.join(',') !== filters.join(','))) throw new PaperSearchError('The query changed. Start a new search before loading more.');
  const pageNumber = previous?.nextPage ?? 1;
  if (previous && previous.pages.length >= 25) throw new PaperSearchError('This run has reached its retry limit. Start a fresh search to continue.');
  if (previous && (!previous.nextPage || pageNumber > openAlexSearch.maxPages)) throw new PaperSearchError('This search has reached its page limit. Refine the terms or use the official provider website.');
  if (pageNumber > 1) params.set('page', String(pageNumber));
  const endpoint = API ? `${API}/openalex` : 'https://api.openalex.org/works';
  const startedAt = new Date(Date.now()).toISOString();
  const requestUrl = `${endpoint}?${params}`;
  const page: SearchRun['pages'][number] = { page: pageNumber, requestedAt: startedAt, requestUrl, ...(typeof window !== 'undefined' && { requestOrigin: window.location.origin }) };
  const run: SearchRun = {
    id: crypto.randomUUID(), provider: 'OpenAlex', mode: API ? 'gateway-first-page' : 'anonymous-first-page',
    userQuery: query, executedQuery, filters, supportedOperators: [], unsupportedOperators: openAlexSearch.unsupportedOperators,
    startedAt, completedAt: startedAt, pageSize: openAlexSearch.pageSize, cursorState: 'not-requested',
    pages: [...(previous?.pages ?? []), page], providerDocsDate: openAlexSearch.docsDate,
    pagingMode: 'basic', parserVersion: 'atlas-openalex-parser-1', providerSort: 'provider-default-relevance',
    ...(previous && { id: previous.id, startedAt: previous.startedAt, resultCountReported: previous.resultCountReported, resultIds: previous.resultIds, nextPage: pageNumber }),
  };
  const { papers, count } = await requestProviderPage('OpenAlex', requestUrl, async raw => ({
    count: searchMeta.parse(raw).meta?.count,
    papers: await parseRankedWorks(raw),
  }), { signal, run, page, previousQuota: previous?.quota });
  page.returnedCount = papers.length;
  const reachedEnd = papers.length < openAlexSearch.pageSize || (count !== undefined && pageNumber * openAlexSearch.pageSize >= count);
  return { papers, run: { ...run, completedAt: new Date(Date.now()).toISOString(), resultCountReported: count,
    nextPage: !reachedEnd && pageNumber < openAlexSearch.maxPages ? pageNumber + 1 : undefined,
    stopReason: reachedEnd ? 'provider-end' : pageNumber >= openAlexSearch.maxPages ? 'app-limit' : undefined,
    resultIds: [...new Set([...(previous?.resultIds ?? []), ...papers.map(paper => paper.id)])],
  } };
}

export async function continuePaperSearch(run: SearchRun, signal?: AbortSignal) {
  const year = run.filters.find(filter => filter.startsWith('from_publication_date:'))?.split(':')[1]?.slice(0, 4) ?? '';
  return runPaperSearch(run.userQuery, year, run.filters.includes('is_oa:true'), signal, run, searchOptionsFromRun(run));
}

export async function relatedPapers(paper: Paper, relation: 'references' | 'citations', signal?: AbortSignal): Promise<Paper[]> {
  const id = /^https:\/\/openalex\.org\/(W\d+)$/.exec(paper.id)?.[1];
  if (!id) throw new Error('This source needs an OpenAlex work identifier to explore citation links.');
  const references = paper.referenceIds?.map(item => /^https:\/\/openalex\.org\/(W\d+)$/.exec(item)?.[1]).filter((item): item is string => !!item).slice(0, 20) ?? [];
  if (relation === 'references' && !references.length) return [];
  const params = new URLSearchParams({ filter: relation === 'references' ? `openalex:${references.join('|')}` : `cites:${id}`, per_page: '20', sort: 'cited_by_count:desc' });
  const { papers } = await requestProviderPage('OpenAlex', `https://api.openalex.org/works?${params}`, async raw => ({ papers: await parseRankedWorks(raw) }), { signal });
  return papers;
}

function parseRankedWorks(raw: unknown) {
  const papers = parseWorks(raw).slice(0, openAlexSearch.pageSize);
  return Promise.all(papers.map(async paper => paper.venueType === 'journal' && paper.issns?.length ? { ...paper, journalQuartile: await findJournalQuartile(paper.issns) } : paper));
}

export async function searchPapers(query: string, year: string, oa: boolean, signal?: AbortSignal) {
  return (await runPaperSearch(query, year, oa, signal)).papers;
}
const crossref=z.object({message:z.object({title:z.array(z.string()).default([]),publisher:z.string().default('Unknown'),ISSN:z.array(z.string()).default([]),'container-title':z.array(z.string()).default([]),DOI:z.string(),type:z.string().optional(),'update-to':z.array(z.unknown()).optional()})});
export async function checkDoi(input:string){const doi=normalizeDoi(input);const raw=await request(API?`${API}/crossref?doi=${encodeURIComponent(doi)}`:`https://api.crossref.org/works/${encodeURIComponent(doi)}`);return crossref.parse(raw).message;}
export async function resolveOa(input:string){
 const doi=normalizeDoi(input);
 if(API){const raw=await request(`${API}/unpaywall?doi=${encodeURIComponent(doi)}`);const result=z.object({is_oa:z.boolean(),best_oa_location:z.object({url:z.string().nullable()}).nullable()}).parse(raw);return {...result,source:'Unpaywall'};}
 const params=new URLSearchParams({filter:`doi:https://doi.org/${doi}`,per_page:'1'});
 const raw=await request(`https://api.openalex.org/works?${params}`);
 const record=z.object({results:z.array(z.object({open_access:z.object({is_oa:z.boolean()}).optional(),best_oa_location:z.object({landing_page_url:z.string().nullable().optional(),pdf_url:z.string().nullable().optional()}).nullable().optional()}))}).parse(raw).results[0];
 if(!record)throw Error('This DOI has no OpenAlex record. Try the publisher record or search for the title.');
 const url=safeUrl(record.best_oa_location?.landing_page_url)||safeUrl(record.best_oa_location?.pdf_url)||null;
 return {is_oa:record.open_access?.is_oa??Boolean(url),best_oa_location:url?{url}:null,source:'OpenAlex'};
}

const openAlexSource = z.object({
  id: z.string().regex(/^https:\/\/openalex\.org\/S\d+$/),
  display_name: z.string().max(20000),
  type: z.string(),
  issn: z.array(z.string()).nullish(),
  issn_l: z.string().nullish(),
  apc_prices: z.array(z.object({ price: priceAmount, currency: priceCurrency }).catch({})).nullish().catch(null),
  apc_usd: priceAmount,
  summary_stats: z.object({
    '2yr_mean_citedness': z.number().nonnegative().nullish().catch(null),
    h_index: z.number().int().nonnegative().nullish().catch(null),
  }).nullish(),
});

export async function checkJournalMetrics(input: string, signal?: AbortSignal): Promise<JournalMetrics> {
  const issn = normalizeIssn(input);
  const raw = await request(`https://api.openalex.org/sources/issn:${issn}`, signal);
  const source = openAlexSource.parse(raw);
  if (source.type !== 'journal' || ![source.issn_l, ...(source.issn ?? [])].some(id => id?.toUpperCase() === issn)) {
    throw Error('OpenAlex did not return a journal matching this ISSN.');
  }
  const price = source.apc_prices?.find(entry => entry.price === 0 || (entry.price != null && entry.currency));
  return {
    sourceId: source.id,
    title: source.display_name,
    issn,
    citedness: source.summary_stats?.['2yr_mean_citedness'] ?? undefined,
    hIndex: source.summary_stats?.h_index ?? undefined,
    checkedAt: new Date().toISOString(),
    journalQuartile: await findJournalQuartile([source.issn_l, ...(source.issn ?? []), issn]),
    journalFee: journalListPrice(price?.price, price?.currency, source.apc_usd, openAlexRecord(source.id, 'sources')),
  };
}
