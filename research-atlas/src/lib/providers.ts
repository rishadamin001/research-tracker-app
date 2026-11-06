import { z } from 'zod';
import { normalizeDoi, safeUrl, type JournalMetrics, type Paper } from './model';
import { normalizeIssn } from './ranking';
import { findJournalQuartile } from './quartiles';

const venue = z.object({
  display_name: z.string(),
  type: z.string().nullish(),
  issn_l: z.string().nullish(),
  issn: z.array(z.string()).nullish(),
  host_organization_name: z.string().nullish(),
  host_organization_lineage_names: z.array(z.string()).nullish(),
  is_in_doaj: z.boolean().nullish(),
});

const work = z.object({
  id: z.string(),
  display_name: z.string().nullable(),
  publication_year: z.number().nullable(),
  doi: z.string().nullable(),
  authorships: z.array(z.object({ author: z.object({ display_name: z.string() }) })).default([]),
  primary_location: z.object({ source: venue.nullish(), landing_page_url: z.string().nullish() }).nullish(),
  best_oa_location: z.object({ landing_page_url: z.string().nullish(), pdf_url: z.string().nullish() }).nullish(),
  referenced_works: z.array(z.string()).nullish(),
  fwci: z.number().nonnegative().nullish().catch(null),
  cited_by_count: z.number().int().nonnegative().nullish().catch(null),
  type: z.string().max(100).nullish().catch(null),
  is_retracted: z.boolean().nullish().catch(null),
});

export function parseWorks(raw: unknown): Paper[] {
  return z.object({ results: z.array(work) }).parse(raw).results.map(item => {
    const source = item.primary_location?.source;
    const issns = [...new Set([source?.issn_l, ...(source?.issn ?? [])].filter((value): value is string => !!value))].slice(0, 12);
    return {
    id: item.id,
    title: item.display_name || 'Untitled work',
    authors: item.authorships.map(authorship => authorship.author.display_name).join(', '),
    year: item.publication_year,
    doi: item.doi ? normalizeDoi(item.doi) : null,
    journal: source?.display_name || 'Source not supplied',
    url: safeUrl(item.doi) || safeUrl(item.primary_location?.landing_page_url) || safeUrl(item.id) || '',
    oa: safeUrl(item.best_oa_location?.landing_page_url) || safeUrl(item.best_oa_location?.pdf_url) || null,
    source: 'OpenAlex',
    notes: '',
    finding: '',
    methods: '',
    limitations: '',
    locator: '',
    decision: 'unreviewed',
    reason: '',
    referenceIds: item.referenced_works?.filter(id => /^https:\/\/openalex\.org\/W\d+$/.test(id)).slice(0, 500),
    fwci: item.fwci ?? undefined,
    citedByCount: item.cited_by_count ?? undefined,
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
export async function searchPapers(query:string,year:string,oa:boolean,signal?:AbortSignal){if(query.trim().length<3||query.length>300)throw Error('Use a search between 3 and 300 characters.');if(/\b(AND|OR|NOT)\b|[()]/.test(query))throw Error('This first release supports keyword phrases, not advanced Boolean syntax. Use the official OpenAlex search for advanced queries.');const params=new URLSearchParams({search:query.trim(),per_page:'20'});const filters=[];if(year){if(!/^\d{4}$/.test(year)||+year<1800||+year>new Date().getFullYear())throw Error('Enter a valid starting year.');filters.push(`from_publication_date:${year}-01-01`);}if(oa)filters.push('is_oa:true');if(filters.length)params.set('filter',filters.join(','));const url=API?`${API}/openalex?${params}`:`https://api.openalex.org/works?${params}`;
  const papers = parseWorks(await request(url,signal));
  return Promise.all(papers.map(async paper => paper.venueType === 'journal' && paper.issns?.length
    ? { ...paper, journalQuartile: await findJournalQuartile(paper.issns) }
    : paper));
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
  return {
    sourceId: source.id,
    title: source.display_name,
    issn,
    citedness: source.summary_stats?.['2yr_mean_citedness'] ?? undefined,
    hIndex: source.summary_stats?.h_index ?? undefined,
    checkedAt: new Date().toISOString(),
    journalQuartile: await findJournalQuartile([source.issn_l, ...(source.issn ?? []), issn]),
  };
}
