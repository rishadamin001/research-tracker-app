import { z } from 'zod';
import { normalizeDoi, safeUrl, type Paper } from './model';
import { findJournalQuartile } from './quartiles';
import { PaperSearchError, readSearchQuota, type SearchRun } from './search-provenance';
import { providerSearchFilterTokens, type SearchOptions } from './search-options';

export type AdditionalSearchProvider = 'Europe PMC' | 'Crossref';
const pageSize = 20;
const maxPages = 5;
const docsDate = '2026-11-09';
const backoff = new Map<AdditionalSearchProvider, string>();
const optionalText = z.string().max(20000).nullish().catch(undefined);
const optionalNumber = z.number().int().nonnegative().nullish().catch(undefined);
const epmcRecord = z.object({
  id: z.string().min(1).max(100), source: z.string().regex(/^[A-Z_]{1,20}$/),
  title: optionalText, authorString: optionalText, doi: z.string().max(500).nullish().catch(undefined),
  pmcid: z.string().max(40).nullish().catch(undefined), pubYear: z.string().max(4).nullish().catch(undefined),
  firstPublicationDate: z.string().max(30).nullish().catch(undefined), abstractText: optionalText,
  citedByCount: optionalNumber, isOpenAccess: z.string().max(10).nullish().catch(undefined),
  journalInfo: z.object({ journal: z.object({ title: optionalText, issn: z.string().max(20).nullish().catch(undefined), essn: z.string().max(20).nullish().catch(undefined) }).nullish().catch(undefined) }).nullish().catch(undefined),
  fullTextUrlList: z.object({ fullTextUrl: z.array(z.object({ availabilityCode: z.string().max(20).nullish().catch(undefined), url: z.string().max(2000).nullish().catch(undefined) })).max(100) }).nullish().catch(undefined),
  pubTypeList: z.object({ pubType: z.array(z.string().max(100)).max(50) }).nullish().catch(undefined),
});
const dateParts = z.object({ 'date-parts': z.array(z.array(z.number().int()).max(3)).max(1) }).nullish().catch(undefined);
const crossrefRecord = z.object({
  DOI: z.string().min(1).max(500), title: z.array(z.string().max(20000)).max(20).nullish().catch(undefined),
  author: z.array(z.object({ given: z.string().max(1000).nullish().catch(undefined), family: z.string().max(1000).nullish().catch(undefined), name: z.string().max(1000).nullish().catch(undefined) })).max(500).nullish().catch(undefined),
  'container-title': z.array(z.string().max(20000)).max(20).nullish().catch(undefined),
  ISSN: z.array(z.string().max(20)).max(12).nullish().catch(undefined),
  publisher: z.string().max(500).nullish().catch(undefined), type: z.string().max(100).nullish().catch(undefined),
  'is-referenced-by-count': optionalNumber, abstract: optionalText,
  published: dateParts, 'published-online': dateParts, 'published-print': dateParts, issued: dateParts,
});

function plainText(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (match, entity: string) => {
      const known: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
      if (!entity.startsWith('#')) return known[entity.toLowerCase()] ?? match;
      const number = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
      return Number.isInteger(number) && number > 0 && number <= 0x10ffff && !(number >= 0xd800 && number <= 0xdfff) ? String.fromCodePoint(number) : match;
    }).replace(/\s+/g, ' ').trim();
}
function doiValue(value: string | null | undefined): string | null {
  if (!value) return null;
  try { return normalizeDoi(value); } catch { return null; }
}
function dateValue(value: string | null | undefined): string | undefined {
  const date = z.iso.date().safeParse(value);
  return date.success ? date.data : undefined;
}
function publicationDate(parts: number[] | undefined) {
  if (!parts?.length || parts[0] < 1800 || parts[0] > 2200) return {};
  const year = parts[0];
  // A year-only record remains a year; do not invent January 1 as its publication date.
  const date = parts.length === 3 ? dateValue(`${year}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`) : undefined;
  return { year, publicationDate: date };
}
function blankPaper(): Pick<Paper, 'notes' | 'researchProblem' | 'dataset' | 'finding' | 'methods' | 'limitations' | 'locator' | 'decision' | 'reason'> {
  return { notes: '', researchProblem: '', dataset: '', finding: '', methods: '', limitations: '', locator: '', decision: 'unreviewed', reason: '' };
}
async function withQuartile(paper: Paper): Promise<Paper> {
  if (paper.venueType !== 'journal' || !paper.issns?.length) return paper;
  return { ...paper, journalQuartile: await findJournalQuartile(paper.issns) };
}

/** Public metadata only. Atlas neither downloads nor reconstructs full-text documents. */
export async function parseEuropePmcResults(raw: unknown): Promise<{ papers: Paper[]; count: number; nextCursor?: string }> {
  const response = z.object({ hitCount: z.number().int().nonnegative(), nextCursorMark: z.string().max(2048).nullish().catch(undefined), resultList: z.object({ result: z.array(epmcRecord).max(pageSize) }) }).parse(raw);
  const checkedAt = new Date().toISOString();
  const papers = await Promise.all(response.resultList.result.slice(0, pageSize).map(async record => {
    const url = `https://europepmc.org/article/${record.source}/${encodeURIComponent(record.id)}`;
    const doi = doiValue(record.doi);
    const journal = record.journalInfo?.journal;
    const issns = [...new Set([journal?.issn, journal?.essn].filter((issn): issn is string => Boolean(issn)))];
    const oaLocation = record.isOpenAccess === 'Y'
      ? record.fullTextUrlList?.fullTextUrl.find(item => item.availabilityCode === 'OA' && safeUrl(item.url))?.url
        ?? (/^PMC\d+$/.test(record.pmcid ?? '') ? `https://europepmc.org/articles/${record.pmcid}` : undefined)
      : undefined;
    const oa = safeUrl(oaLocation) ?? null;
    const year = record.pubYear && /^(18|19|20|21)\d{2}$/.test(record.pubYear) ? Number(record.pubYear) : null;
    const abstract = plainText(record.abstractText);
    return withQuartile({ ...blankPaper(), id: url, title: plainText(record.title) || 'Untitled work', authors: plainText(record.authorString), year,
      publicationDate: dateValue(record.firstPublicationDate), doi, journal: plainText(journal?.title) || 'Source not supplied', url, oa,
      source: 'Europe PMC', citedByCount: record.citedByCount ?? undefined, metricsRetrievedAt: checkedAt,
      abstract: abstract || undefined, issns: issns.length ? issns : undefined, venueType: journal ? 'journal' : undefined,
      workType: record.pubTypeList?.pubType.join('; ').slice(0, 100),
      readingCost: oa ? { amount: 0, currency: 'USD', source: 'Europe PMC', checkedAt, url: oa } : undefined,
    });
  }));
  return { papers, count: response.hitCount, nextCursor: response.nextCursorMark ?? undefined };
}

export async function parseCrossrefResults(raw: unknown): Promise<{ papers: Paper[]; count: number }> {
  const response = z.object({ message: z.object({ 'total-results': z.number().int().nonnegative(), items: z.array(crossrefRecord).max(pageSize) }) }).parse(raw).message;
  const checkedAt = new Date().toISOString();
  const papers = await Promise.all(response.items.slice(0, pageSize).map(async record => {
    const doi = doiValue(record.DOI);
    if (!doi) throw new Error('Crossref returned an invalid DOI identity.');
    const url = `https://doi.org/${encodeURIComponent(doi)}`;
    const dates = publicationDate((record.published ?? record['published-online'] ?? record['published-print'] ?? record.issued)?.['date-parts'][0]);
    const authors = record.author?.map(author => plainText(author.name ?? [author.given, author.family].filter(Boolean).join(' '))).filter(Boolean) ?? [];
    const abstract = plainText(record.abstract);
    return withQuartile({ ...blankPaper(), id: url, title: plainText(record.title?.[0]) || 'Untitled work', authors: authors.join(', ').slice(0, 20000),
      referenceAuthors: authors.length ? authors.map(author => author.slice(0, 500)) : undefined, year: dates.year ?? null, publicationDate: dates.publicationDate,
      doi, journal: plainText(record['container-title']?.[0]) || 'Source not supplied', url, oa: null, source: 'Crossref',
      publisher: record.publisher ?? undefined, venueType: record.type === 'journal-article' ? 'journal' : record.type ?? undefined,
      workType: record.type ?? undefined, issns: record.ISSN?.length ? record.ISSN : undefined, citedByCount: record['is-referenced-by-count'] ?? undefined,
      metricsRetrievedAt: checkedAt, abstract: abstract || undefined,
    });
  }));
  return { papers, count: response['total-results'] };
}

export async function runAdditionalSearch(provider: AdditionalSearchProvider, query: string, year: string, oa: boolean, signal?: AbortSignal, previous?: SearchRun, options: SearchOptions = {}): Promise<{ papers: Paper[]; run: SearchRun }> {
  const terms = query.trim();
  if (terms.length < 3 || query.length > 300) throw new PaperSearchError('Use a search between 3 and 300 characters.');
  if (/\b(AND|OR|NOT)\b|[()*]/.test(query)) throw new PaperSearchError('Atlas searches keyword phrases here. Use the provider website for advanced search syntax.');
  if (year && (!/^\d{4}$/.test(year) || Number(year) < 1800 || Number(year) > new Date().getFullYear())) throw new PaperSearchError('Enter a valid starting year.');
  if (provider === 'Crossref' && oa) throw new PaperSearchError('Crossref does not provide a dependable open-access-only search here. Turn off that filter or choose OpenAlex or Europe PMC.');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new PaperSearchError('Your project is available offline. Online literature search resumes when you reconnect.');
  if (signal?.aborted) throw new PaperSearchError('Search cancelled.');
  const waitUntil = [backoff.get(provider), previous?.quota?.retryAfterUntil]
    .filter((value): value is string => Boolean(value) && Number.isFinite(Date.parse(value!)))
    .sort((a, b) => Date.parse(a) - Date.parse(b)).at(-1);
  if (waitUntil && Date.parse(waitUntil) > Date.now()) throw new PaperSearchError(`${provider} asks you to wait until ${new Date(waitUntil).toLocaleString()} before trying again. Earlier papers are preserved.`);
  backoff.delete(provider);
  const filters = provider === 'Europe PMC'
    ? [...(year ? [`FIRST_PDATE:[${year}-01-01 TO 3000-12-31]`] : []), ...(oa ? ['OPEN_ACCESS:Y'] : [])]
    : ['type:journal-article', ...(year ? [`from-pub-date:${year}-01-01`] : [])];
  filters.push(...providerSearchFilterTokens(provider, options));
  const executedQuery = provider === 'Europe PMC' && filters.length ? `(${terms}) AND ${filters.join(' AND ')}` : terms;
  if (previous && (previous.provider !== provider || previous.userQuery.trim() !== terms || previous.executedQuery !== executedQuery || previous.filters.join(',') !== filters.join(','))) throw new PaperSearchError('The query or provider changed. Start a new search before loading more.');
  const number = previous?.nextPage ?? 1;
  if (previous && previous.pages.length >= 25) throw new PaperSearchError('This run has reached its retry limit. Start a fresh search to continue.');
  if (previous && (!previous.nextPage || number > maxPages)) throw new PaperSearchError('This search has reached its page limit. Refine the terms or use the official provider website.');
  if (provider === 'Europe PMC' && previous && !previous.nextCursor) throw new PaperSearchError('The provider did not return a continuation cursor. Start a fresh search.');
  const params = provider === 'Europe PMC'
    ? new URLSearchParams({ query: executedQuery, format: 'json', resultType: 'core', pageSize: String(pageSize), cursorMark: previous?.nextCursor ?? '*', synonym: 'false' })
    : new URLSearchParams({ 'query.bibliographic': executedQuery, filter: filters.join(','), rows: String(pageSize), offset: String((number - 1) * pageSize), sort: 'score', order: 'desc' });
  const endpoint = provider === 'Europe PMC' ? 'https://www.ebi.ac.uk/europepmc/webservices/rest/search' : 'https://api.crossref.org/works';
  const now = new Date(Date.now()).toISOString();
  const requestUrl = `${endpoint}?${params}`;
  const page: SearchRun['pages'][number] = { page: number, requestedAt: now, requestUrl, ...(typeof window !== 'undefined' && { requestOrigin: window.location.origin }), ...(provider === 'Europe PMC' ? { cursor: previous?.nextCursor ?? '*' } : {}) };
  const run: SearchRun = { id: previous?.id ?? crypto.randomUUID(), provider, mode: 'public-api', userQuery: query, executedQuery, filters,
    supportedOperators: [], unsupportedOperators: ['AND', 'OR', 'NOT', 'parentheses', 'wildcards'],
    startedAt: previous?.startedAt ?? now, completedAt: now, pageSize, cursorState: provider === 'Europe PMC' ? 'used' : 'not-requested',
    pagingMode: provider === 'Europe PMC' ? 'cursor' : 'basic', nextPage: previous?.nextPage,
    nextCursor: previous?.nextCursor, pages: [...(previous?.pages ?? []), page], resultIds: previous?.resultIds,
    resultCountReported: previous?.resultCountReported, providerDocsDate: docsDate,
    parserVersion: provider === 'Europe PMC' ? 'atlas-europepmc-parser-1' : 'atlas-crossref-parser-1', providerSort: 'provider-default-relevance' };
  const fail = (kind: NonNullable<SearchRun['error']>['kind'], message: string, status?: number): never => {
    page.failure = message; page.status = status;
    throw new PaperSearchError(message, { ...run, completedAt: new Date(Date.now()).toISOString(), error: { kind, message, status } });
  };
  const timeout = AbortSignal.timeout(15000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
  try {
    const response = await fetch(requestUrl, { signal: requestSignal, credentials: 'omit' });
    page.responseStatus = response.status;
    // These providers do not document OpenAlex-style daily credit headers.
    // Crossref advertises a request-window limit; retain only its explicit retry time.
    const retryHeaders = new Headers();
    const retryAfter = response.headers.get('Retry-After');
    if (retryAfter) retryHeaders.set('Retry-After', retryAfter);
    run.quota = readSearchQuota(retryHeaders, Date.now(), response.status === 429);
    const requestId = response.headers.get('X-Request-ID');
    if (requestId && /^[\w:-]{1,160}$/.test(requestId)) page.requestId = requestId;
    if (response.status === 429) {
      const retryAt = run.quota?.retryAfterUntil;
      if (retryAt && (!backoff.get(provider) || Date.parse(retryAt) > Date.parse(backoff.get(provider)!))) backoff.set(provider, retryAt);
      return fail('rate-limit', `${provider} is temporarily at its free request limit.${retryAt ? ` Try again after ${new Date(retryAt).toLocaleString()}.` : ' Try again later.'} Earlier papers are preserved.`, 429);
    }
    if (!response.ok) return fail('http', `${provider} is unavailable (${response.status}). Earlier papers are preserved. Try again later or use its official website.`, response.status);
    const raw: unknown = await response.json();
    const parsed: { papers: Paper[]; count: number; nextCursor?: string } = provider === 'Europe PMC' ? await parseEuropePmcResults(raw) : await parseCrossrefResults(raw);
    requestSignal.throwIfAborted();
    const nextCursor = parsed.nextCursor;
    const reachedEnd = parsed.papers.length < pageSize || number * pageSize >= parsed.count;
    if (provider === 'Europe PMC' && number < maxPages && !reachedEnd && (!nextCursor || nextCursor === (previous?.nextCursor ?? '*'))) return fail('invalid-response', 'Europe PMC did not provide a new continuation cursor. Earlier papers are preserved. Try a fresh search or its official website.');
    page.returnedCount = parsed.papers.length;
    const more = !reachedEnd && number < maxPages;
    return { papers: parsed.papers, run: { ...run, completedAt: new Date(Date.now()).toISOString(), resultCountReported: parsed.count,
      resultIds: [...new Set([...(previous?.resultIds ?? []), ...parsed.papers.map(paper => paper.id)])], nextPage: more ? number + 1 : undefined,
      nextCursor: more && provider === 'Europe PMC' ? nextCursor : undefined,
      stopReason: reachedEnd ? 'provider-end' : number >= maxPages ? 'app-limit' : undefined } };
  } catch (failure) {
    if (failure instanceof PaperSearchError) throw failure;
    if (timeout.aborted) return fail('timeout', `${provider} search timed out. Earlier papers are preserved; retry when ready.`);
    if (signal?.aborted) return fail('cancelled', 'Search cancelled. Earlier papers are preserved.');
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return fail('offline', 'Your project is available offline. Reconnect to continue this literature search.');
    if (failure instanceof TypeError) { page.networkFailure = 'network-or-cors'; return fail('network', `Could not reach ${provider} or read its response. A network interruption or browser cross-origin restriction (CORS) may be responsible; the HTTP status is not exposed to Atlas. Retry or open the official source. Earlier papers are preserved.`); }
    return fail('invalid-response', `${provider} returned records the app could not read. Earlier papers are preserved. Try again or use its official website.`);
  }
}
