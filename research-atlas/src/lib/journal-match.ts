import { z } from 'zod';
import { normalizeDoi, safeUrl, type Paper, type Project, type JournalFee } from './model';
import { normalizeIssn } from './ranking';
import type { SearchRun } from './search-provenance';

export type JournalSuggestion = {
  key: string; title: string; publisher?: string; issns: string[]; identityBasis: 'ISSN' | 'title and publisher';
  papers: { paper: Paper; position: number }[]; orderWeight: number; run: SearchRun;
};
export type JournalIdentity = { sourceId: string; title: string; issns: string[]; publisher?: string; homepage?: string; isOa?: boolean; inDoaj?: boolean; checkedAt: string; fee?: JournalFee };
const stop = new Set('about above after again against also among analysis approach based before being between both could data different during each effect effects from further have here into investigation many methods more most other paper present research results show study studies such than that their them there these they this those through under using very what when where which while with within without would used using'.split(' '));

/** Local keyword preparation only; no abstract or manuscript is uploaded. */
export function prepareJournalQuery(title: string, abstract: string, keywords: string) {
  if (keywords.trim()) return keywords.trim().replace(/[,;]+/g, ' ').replace(/\s+/g, ' ').slice(0, 300);
  const text = title.trim() || abstract.trim();
  const words = text.toLocaleLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]{3,}/gu) ?? [];
  const count = new Map<string, { n: number; index: number }>();
  words.forEach((word, index) => { if (!stop.has(word)) { const previous = count.get(word); count.set(word, { n: (previous?.n ?? 0) + 1, index: previous?.index ?? index }); } });
  return [...count].sort((a, b) => b[1].n - a[1].n || a[1].index - b[1].index).slice(0, 5).map(([word]) => word).join(' ').slice(0, 300);
}
const normalized = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, ' ');
function checkedIssns(values: string[] | undefined) {
  return [...new Set((values ?? []).flatMap(value => { try { return [normalizeIssn(value)]; } catch { return []; } }))];
}
function paperIdentity(paper: Paper) {
  try { if (paper.doi) return `doi:${normalizeDoi(paper.doi)}`; } catch { /* Use the supplied record identifier. */ }
  return `record:${paper.id}`;
}

export function journalSuggestions(papers: Paper[], run: SearchRun): JournalSuggestion[] {
  const groups: JournalSuggestion[] = [], seen = new Set<string>();
  papers.slice(0, 100).forEach((paper, index) => {
    if (paper.venueType !== 'journal' || !paper.journal.trim() || paper.journal === 'Source not supplied') return;
    const id = paperIdentity(paper); if (seen.has(id)) return; seen.add(id);
    const issns = checkedIssns(paper.issns);
    const titleKey = `${normalized(paper.journal)}|${normalized(paper.publisher ?? '')}`;
    const matches = groups.filter(group => issns.length ? group.issns.some(issn => issns.includes(issn)) : !group.issns.length && group.key === titleKey);
    let group = matches[0];
    if (!group) {
      group = { key: issns[0] ?? titleKey, title: paper.journal, publisher: paper.publisher, issns: [], identityBasis: issns.length ? 'ISSN' : 'title and publisher', papers: [], orderWeight: 0, run };
      groups.push(group);
    }
    // Join reported print/electronic ISSN variants only through an actual overlap.
    for (const other of matches.slice(1)) {
      group.papers.push(...other.papers); group.issns.push(...other.issns); group.orderWeight += other.orderWeight;
      groups.splice(groups.indexOf(other), 1);
    }
    group.issns = [...new Set([...group.issns, ...issns])];
    group.papers.push({ paper, position: index + 1 }); group.orderWeight += 1 / (index + 1);
  });
  return groups.sort((a, b) => b.orderWeight - a.orderWeight || a.papers[0].position - b.papers[0].position);
}

const sourceSchema = z.object({
  id: z.string().regex(/^https:\/\/openalex\.org\/S\d+$/), display_name: z.string().min(1).max(20000), type: z.literal('journal'),
  issn: z.array(z.string().max(20)).max(12).nullish(), issn_l: z.string().max(20).nullish(),
  host_organization_name: z.string().max(500).nullish(), homepage_url: z.string().max(2000).nullish(),
  is_oa: z.boolean().optional(), is_in_doaj: z.boolean().optional(),
  apc_prices: z.array(z.object({ price: z.number().finite().nonnegative(), currency: z.string().regex(/^[A-Z]{3}$/) })).max(20).nullish().catch(undefined),
  apc_usd: z.number().finite().nonnegative().nullish().catch(undefined),
});
export function parseJournalIdentity(raw: unknown, requestedIssn: string, checkedAt = new Date().toISOString()): JournalIdentity {
  const source = sourceSchema.parse(raw), issn = normalizeIssn(requestedIssn);
  const issns = checkedIssns([...(source.issn ?? []), ...(source.issn_l ? [source.issn_l] : [])]);
  if (!issns.includes(issn)) throw Error('The returned journal does not match the requested ISSN. Inspect the publisher record.');
  const price = source.apc_prices?.[0], recordUrl = source.id;
  const fee: JournalFee | undefined = price ? { amount: price.price, currency: price.currency, usd: source.apc_usd ?? undefined, source: 'OpenAlex listed APC', checkedAt, url: recordUrl } : source.apc_usd != null ? { amount: source.apc_usd, currency: 'USD', usd: source.apc_usd, source: 'OpenAlex listed APC', checkedAt, url: recordUrl } : undefined;
  return { sourceId: source.id, title: source.display_name, issns, publisher: source.host_organization_name ?? undefined, homepage: safeUrl(source.homepage_url), isOa: source.is_oa, inDoaj: source.is_in_doaj, checkedAt, fee };
}
export async function fetchJournalIdentity(issn: string, signal?: AbortSignal) {
  const normalizedIssn = normalizeIssn(issn);
  const response = await fetch(`https://api.openalex.org/sources/issn:${normalizedIssn}`, { credentials: 'omit', signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(12000)]) : AbortSignal.timeout(12000) });
  if (!response.ok) throw Error(`Journal identity lookup is unavailable (${response.status}). The supporting articles remain available.`);
  return parseJournalIdentity(await response.json(), normalizedIssn);
}
export function suggestionCandidate(suggestion: JournalSuggestion, identity?: JournalIdentity): Project['journalCandidates'][number] {
  const articles = suggestion.papers.slice(0, 20).map(({ paper, position }) => ({ id: paper.id, title: paper.title, doi: paper.doi, url: paper.url, year: paper.year, position }));
  return {
    id: crypto.randomUUID(), title: identity?.title ?? suggestion.title, url: identity?.homepage ?? '',
    scope: `Suggested for query: ${suggestion.run.userQuery}\nInspect these related publications and the journal's current aims, accepted article types and author instructions.`,
    cost: identity?.fee ? `${identity.fee.amount} ${identity.fee.currency} listed open-access APC (OpenAlex); verify current fees, waivers and other routes.` : 'Fee unknown — check current author instructions and waivers.',
    checks: [], verification: 'Article-backed suggestion only. Editorial suitability, indexing claims and legitimacy have not been independently verified.',
    ...(identity ? { metrics: { sourceId: identity.sourceId, title: identity.title, issn: identity.issns[0], checkedAt: identity.checkedAt, journalQuartile: suggestion.papers[0].paper.journalQuartile, journalFee: identity.fee } } : {}),
    matchEvidence: { provider: 'OpenAlex', query: suggestion.run.userQuery, retrievedAt: suggestion.run.completedAt, retrievedRecords: suggestion.run.resultIds?.length ?? suggestion.papers.length, identityBasis: suggestion.identityBasis, articles },
  };
}
