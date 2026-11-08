import { z } from 'zod';
import type { Paper, Project } from './model';

export const writingSectionIds = ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'] as const;
export type WritingSectionId = typeof writingSectionIds[number];
export type WritingTarget = WritingSectionId | 'legacy';
const targetSchema = z.enum([...writingSectionIds, 'legacy']);
const sectionSchema = z.object({ id: z.enum(writingSectionIds), body: z.string().max(20000) });
const sourceSnapshotSchema = z.object({
  id: z.string().max(500), title: z.string().max(20000), authors: z.string().max(20000), year: z.number().nullable(),
  doi: z.string().nullable(), journal: z.string().max(20000), url: z.string(), source: z.string(),
  referenceAuthors: z.array(z.string().max(500)).max(500).optional(), publisher: z.string().max(500).optional(),
});
export const writingCitationSchema = z.object({
  id: z.uuid(), number: z.number().int().min(1).max(300), paperId: z.string().max(500),
  sourceSnapshot: sourceSnapshotSchema, createdAt: z.iso.datetime(), metadataRefreshedAt: z.iso.datetime().optional(),
});
const evidenceLinkSchema = z.object({
  id: z.uuid(), sectionId: targetSchema, citationId: z.uuid(), paperId: z.string().max(500), claimId: z.uuid(),
  claimText: z.string().max(4000), locator: z.string().max(500),
  evidenceLevel: z.enum(['metadata', 'abstract', 'full_text', 'user_observation']),
  interpretation: z.string().max(3000), uncertainty: z.string().max(1500),
  reviewStatus: z.enum(['draft', 'reviewed', 'needs_review']), claimCreatedAt: z.iso.datetime(), linkedAt: z.iso.datetime(),
});
export const writingStudioSchema = z.object({
  sections: z.array(sectionSchema).max(writingSectionIds.length),
  citations: z.array(writingCitationSchema).max(300), evidenceLinks: z.array(evidenceLinkSchema).max(400),
}).superRefine((value, context) => {
  for (const [field, keys] of [
    ['sections', value.sections.map(item => item.id)], ['citations', value.citations.map(item => item.id)],
    ['citation numbers', value.citations.map(item => String(item.number))], ['evidenceLinks', value.evidenceLinks.map(item => item.id)],
  ] as const) if (new Set(keys).size !== keys.length) context.addIssue({ code: 'custom', message: `Repeated ${field} identifiers are not supported.` });
});
export type WritingStudio = z.infer<typeof writingStudioSchema>;
export type WritingCitation = z.infer<typeof writingCitationSchema>;
export type WritingEvidenceLink = z.infer<typeof evidenceLinkSchema>;
export type WritingSelection = { paperId: string; claimId?: string };
export type WritingReviewPrompt = { id: string; sectionId: WritingTarget; detail: string };

export function currentWritingStudio(project: Pick<Project, 'writingStudio'>): WritingStudio {
  return project.writingStudio ?? { sections: [], citations: [], evidenceLinks: [] };
}
export function writingBody(project: Project, sectionId: WritingTarget) {
  return sectionId === 'legacy' ? project.manuscript : project.writingStudio?.sections.find(item => item.id === sectionId)?.body ?? '';
}
export function hasStructuredDraft(project: Pick<Project, 'writingStudio'>) {
  return Boolean(project.writingStudio?.sections.some(section => section.body.split('\n').some(line => line.trim() && !/^#{1,6}\s/.test(line.trim()))));
}

export function writingSections(project: Pick<Project, 'studyType' | 'purpose' | 'discipline'>) {
  const literature = project.studyType === 'literature' || (!project.studyType && project.purpose === 'synthesize');
  const qualitative = project.studyType === 'qualitative' || (!project.studyType && project.purpose === 'interpret');
  const mixed = project.studyType === 'mixed';
  return [
    { id: 'abstract', title: 'Abstract', hint: 'Summarize the question, approach, main finding and limits after drafting the report.' },
    { id: 'introduction', title: literature ? 'Background and review question' : 'Introduction and research question', hint: 'Explain the problem, what the literature establishes, the unresolved question and your purpose.' },
    { id: 'methods', title: literature ? 'Search and selection methods' : qualitative ? 'Approach, sources and analysis' : 'Methods and ethics', hint: literature ? 'Describe actual databases, queries, selection rules and synthesis approach. A literature review is not automatically a systematic review.' : qualitative ? 'Explain the setting, recruitment or source selection, analytic approach, researcher perspective and relevant ethics.' : 'Describe the design, evidence, procedures, analysis and relevant ethics so the work can be inspected.' },
    { id: 'results', title: literature ? 'Included evidence and synthesis' : qualitative ? 'Findings and themes' : mixed ? 'Quantitative and qualitative findings' : 'Results', hint: literature ? 'Group findings by the question or theme, compare disagreements and link each substantive claim to its sources.' : 'Report what your analysis found. Separate observed results from your interpretation and include uncertainty.' },
    { id: 'discussion', title: 'Discussion and limitations', hint: 'Interpret the findings alongside earlier evidence. Address alternative explanations, disagreements and limits.' },
    { id: 'conclusion', title: 'Conclusion', hint: 'Answer the scoped question without claiming more than the evidence supports.' },
  ] satisfies { id: WritingSectionId; title: string; hint: string }[];
}

export function changeWritingBody(project: Project, sectionId: WritingTarget, body: string): Partial<Project> {
  if (body.length > 20000) throw Error('This section has reached its 20,000-character limit. Export a copy before shortening it.');
  if (sectionId === 'legacy') return { manuscript: body };
  const studio = currentWritingStudio(project);
  const sections = studio.sections.some(item => item.id === sectionId)
    ? studio.sections.map(item => item.id === sectionId ? { ...item, body } : item)
    : [...studio.sections, { id: sectionId, body }];
  return { writingStudio: { ...studio, sections } };
}

function sourceSnapshot(paper: Paper): WritingCitation['sourceSnapshot'] {
  const { id, title, authors, year, doi, journal, url, source, referenceAuthors, publisher } = paper;
  return { id, title, authors, year, doi, journal, url, source,
    ...(referenceAuthors !== undefined ? { referenceAuthors } : {}), ...(publisher !== undefined ? { publisher } : {}) };
}
function publicationIdentity(source: Pick<Paper, 'id' | 'doi'>) {
  const doi = source.doi?.trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '').toLowerCase();
  return doi && /^10\.\d{4,9}\/\S+$/i.test(doi) ? `doi:${doi}` : `id:${source.id}`;
}
export function currentCitationPaper(project: Project, citation: WritingCitation) {
  const identity = publicationIdentity(citation.sourceSnapshot);
  const exact = project.papers.filter(paper => paper.id === citation.paperId);
  if (exact.length === 1 && (!exact[0].doi || !citation.sourceSnapshot.doi || publicationIdentity(exact[0]) === identity)) return exact[0];
  const matches = project.papers.filter(paper => publicationIdentity(paper) === identity);
  return matches.length === 1 ? matches[0] : undefined;
}
export function refreshWritingCitation(project: Project, citationId: string, at = new Date().toISOString()): Partial<Project> {
  const studio = currentWritingStudio(project), citation = studio.citations.find(item => item.id === citationId);
  const paper = citation ? currentCitationPaper(project, citation) : undefined;
  if (!paper) throw Error('The original source is no longer saved. Keep its retained snapshot or restore the source before refreshing metadata.');
  return { writingStudio: { ...studio, citations: studio.citations.map(item => item.id === citationId ? { ...item, sourceSnapshot: sourceSnapshot(paper), metadataRefreshedAt: at } : item) } };
}
export function linkWritingEvidence(project: Project, target: WritingTarget, paperId: string, claimId: string | undefined, start?: number, end?: number, at = new Date().toISOString()) {
  const sources = project.papers.filter(item => item.id === paperId);
  if (sources.length > 1) throw Error('More than one saved source uses that record identifier. Review the source records before inserting a traceable citation.');
  const paper = sources[0];
  if (!paper || !paperId.trim()) throw Error('Choose a saved source with a usable record identifier.');
  const claims = claimId ? paper.evidenceClaims?.filter(item => item.id === claimId) ?? [] : [];
  if (claims.length > 1) throw Error('More than one evidence note uses that identifier. Review the source notes before inserting located evidence.');
  const claim = claims[0];
  if (claimId && !claim) throw Error('That evidence note is no longer available. Review the source before inserting it.');
  const studio = currentWritingStudio(project);
  let citation = studio.citations.find(item => publicationIdentity(item.sourceSnapshot) === publicationIdentity(paper));
  if (!citation && studio.citations.length >= 300) throw Error('This draft has reached its 300-reference limit. Export it before continuing in a new project.');
  const nextNumber = Math.max(0, ...studio.citations.map(item => item.number)) + 1;
  if (!citation && nextNumber > 300) throw Error('This draft has reached its citation-number limit. Export it before continuing in a new project.');
  if (claim && studio.evidenceLinks.length >= 400) throw Error('This draft has reached its 400-evidence-link limit. Export its traceability record before continuing.');
  citation ??= { id: crypto.randomUUID(), number: nextNumber, paperId: paper.id, sourceSnapshot: sourceSnapshot(paper), createdAt: at };
  const body = writingBody(project, target);
  const from = Math.max(0, Math.min(start ?? body.length, body.length)), to = Math.max(from, Math.min(end ?? from, body.length));
  const text = claim ? `${claim.claimText} [${citation.number}] (${claim.locator})` : `[${citation.number}]`;
  const nextBody = body.slice(0, from) + text + body.slice(to);
  if (nextBody.length > 20000) throw Error('This section is too long for another insertion. Shorten it or export a copy first.');
  const changed = changeWritingBody(project, target, nextBody);
  const nextStudio = changed.writingStudio ?? studio;
  const evidenceLink: WritingEvidenceLink | undefined = claim ? {
    id: crypto.randomUUID(), sectionId: target, citationId: citation.id, paperId: paper.id, claimId: claim.id,
    claimText: claim.claimText, locator: claim.locator, evidenceLevel: claim.evidenceLevel,
    interpretation: claim.interpretation, uncertainty: claim.uncertainty, reviewStatus: claim.reviewStatus,
    claimCreatedAt: claim.createdAt, linkedAt: at,
  } : undefined;
  return { patch: { ...changed, writingStudio: { ...nextStudio,
    citations: studio.citations.some(item => item.id === citation.id) ? studio.citations : [...studio.citations, citation],
    evidenceLinks: evidenceLink ? [...studio.evidenceLinks, evidenceLink] : studio.evidenceLinks,
  } } satisfies Partial<Project>, cursor: from + text.length, citation, evidenceLink };
}

export function writingEvidenceState(project: Project, link: WritingEvidenceLink) {
  const citation = project.writingStudio?.citations.find(item => item.id === link.citationId);
  const eligible = project.papers.filter(item => citation ? publicationIdentity(item) === publicationIdentity(citation.sourceSnapshot) : item.id === link.paperId);
  const exact = eligible.filter(item => item.id === link.paperId);
  const candidates = exact.length ? exact : eligible;
  const claimMatches = candidates.filter(item => item.evidenceClaims?.some(claim => claim.id === link.claimId));
  const paper = candidates.length === 1 ? candidates[0] : claimMatches.length === 1 ? claimMatches[0] : undefined;
  const ambiguous = candidates.length > 1 && !paper;
  const claim = paper?.evidenceClaims?.find(item => item.id === link.claimId);
  const issues: string[] = [];
  if (!citation) issues.push('The citation record is missing.');
  if (ambiguous) issues.push('Multiple saved records could match this evidence link. Review their identifiers before relying on it.');
  else if (!paper) issues.push('The source is no longer saved in this project; its linked snapshot is retained.');
  if (paper?.decision === 'exclude') issues.push('This source is currently excluded from the project selection.');
  if (paper?.isRetracted) issues.push('The scholarly provider marks this source as retracted.');
  if (paper && !claim) issues.push('The evidence note is no longer available; the linked snapshot is retained.');
  if (claim && (claim.claimText !== link.claimText || claim.locator !== link.locator || claim.evidenceLevel !== link.evidenceLevel || claim.interpretation !== link.interpretation || claim.uncertainty !== link.uncertainty)) issues.push('The source note changed after insertion. Compare it with the retained snapshot.');
  if (claim && claim.reviewStatus !== 'reviewed') issues.push('The current source note has not been marked reviewed.');
  if ((claim?.evidenceLevel ?? link.evidenceLevel) === 'metadata') issues.push('Metadata alone does not support a substantive study finding.');
  if (!link.locator.trim()) issues.push('An inspectable evidence location is missing.');
  return { citation, paper, claim, issues };
}

export function writingReviewPrompts(project: Project): WritingReviewPrompt[] {
  const studio = currentWritingStudio(project), prompts: WritingReviewPrompt[] = [];
  const targets: WritingTarget[] = [...writingSectionIds, ...(project.manuscript.trim() ? ['legacy' as const] : [])];
  const allBody = targets.map(id => writingBody(project, id)).join('\n');
  for (const sectionId of targets) {
    const body = writingBody(project, sectionId);
    if (!body.trim()) continue;
    if (!['abstract', 'conclusion'].includes(sectionId) && !studio.evidenceLinks.some(link => link.sectionId === sectionId)) prompts.push({ id: `support-${sectionId}`, sectionId, detail: 'No located source evidence is linked to this section. Review which assertions need support, or document why sources are not applicable.' });
    const unknown = [...body.matchAll(/\[(\d{1,3})\]/g)].map(match => Number(match[1])).filter(number => !studio.citations.some(item => item.number === number));
    if (unknown.length) prompts.push({ id: `unknown-citation-${sectionId}`, sectionId, detail: `Numbered marker${new Set(unknown).size > 1 ? 's' : ''} ${[...new Set(unknown)].map(number => `[${number}]`).join(', ')} have no recorded source. Check citations or confirm that these brackets mean something else.` });
  }
  for (const link of studio.evidenceLinks) {
    const state = writingEvidenceState(project, link);
    for (const [index, detail] of state.issues.entries()) prompts.push({ id: `${link.id}-${index}`, sectionId: link.sectionId, detail });
    if (state.citation && !writingBody(project, link.sectionId).includes(`[${state.citation.number}]`)) prompts.push({ id: `${link.id}-marker`, sectionId: link.sectionId, detail: 'The evidence link remains recorded, but its numbered citation marker is absent from this section.' });
  }
  for (const citation of studio.citations) {
    const sectionId = studio.evidenceLinks.find(link => link.citationId === citation.id)?.sectionId
      ?? targets.find(target => writingBody(project, target).includes(`[${citation.number}]`)) ?? 'introduction';
    const paper = currentCitationPaper(project, citation);
    const hasEvidenceLink = studio.evidenceLinks.some(link => link.citationId === citation.id);
    if (!paper && !studio.evidenceLinks.some(link => link.citationId === citation.id)) prompts.push({ id: `${citation.id}-source`, sectionId, detail: `Source [${citation.number}] is no longer saved. Its bibliography snapshot remains in exports.` });
    if (paper && !hasEvidenceLink && paper.decision === 'exclude') prompts.push({ id: `${citation.id}-excluded`, sectionId, detail: `Reference [${citation.number}] is currently excluded from the project selection.` });
    if (paper && !hasEvidenceLink && paper.isRetracted) prompts.push({ id: `${citation.id}-retracted`, sectionId, detail: `The scholarly provider marks reference [${citation.number}] as retracted. Investigate before using it.` });
    if (paper && JSON.stringify(sourceSnapshot(paper)) !== JSON.stringify(citation.sourceSnapshot)) prompts.push({ id: `${citation.id}-metadata-changed`, sectionId, detail: `Bibliographic metadata for reference [${citation.number}] changed after insertion. Compare the original source, then refresh its bibliography snapshot if appropriate.` });
    if (!allBody.includes(`[${citation.number}]`)) prompts.push({ id: `${citation.id}-unused`, sectionId, detail: `Reference [${citation.number}] is recorded but its marker is absent from the draft. Review the bibliography before submission.` });
    if (!citation.sourceSnapshot.authors.trim() || citation.sourceSnapshot.year == null || !citation.sourceSnapshot.journal.trim()) prompts.push({ id: `${citation.id}-metadata`, sectionId, detail: `Reference [${citation.number}] has incomplete author, year or venue metadata. Check the original source.` });
  }
  return prompts;
}

function plain(value: string) { return value.replace(/[\r\n]+/g, ' ').trim(); }
function markdownText(value: string) { return plain(value).replace(/[\\`*_[\]<>]/g, '\\$&'); }
export function citationSourceUrl(citation: WritingCitation) {
  const doi = citation.sourceSnapshot.doi?.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '').replace(/^doi:\s*/i, '');
  const raw = doi && /^10\.\d{4,9}\/\S+$/i.test(doi) ? `https://doi.org/${doi}` : citation.sourceSnapshot.url;
  try { const url = new URL(raw); return ['http:', 'https:'].includes(url.protocol) ? url.href : undefined; } catch { return undefined; }
}
export function draftBibliography(project: Project) {
  return currentWritingStudio(project).citations.slice().sort((a, b) => a.number - b.number).map(citation => {
    const source = citation.sourceSnapshot, url = citationSourceUrl(citation);
    return `[${citation.number}] ${markdownText(source.authors || 'Author not supplied')} (${source.year ?? 'n.d.'}). ${markdownText(source.title)}. ${markdownText(source.journal || 'Venue not supplied')}.${url ? ` <${url.replace(/[<>]/g, character => encodeURIComponent(character))}>` : ''}`;
  }).join('\n\n');
}
export function manuscriptReferencePapers(project: Project): Paper[] {
  return currentWritingStudio(project).citations.slice().sort((a, b) => a.number - b.number).map(citation => ({
    ...citation.sourceSnapshot, oa: null, notes: '', finding: '', methods: '', limitations: '', locator: '',
    decision: 'unreviewed', reason: '', researchProblem: '', dataset: '', referenceKey: `atlas-${citation.number}`,
  }));
}
const evidenceLevels = { metadata: 'Metadata only', abstract: 'Abstract', full_text: 'Full text', user_observation: 'Author observation' } as const;
export function manuscriptMarkdown(project: Project) {
  const studio = currentWritingStudio(project), sections = writingSections(project);
  const body = sections.filter(section => writingBody(project, section.id).trim()).map(section => `## ${section.title}\n\n${writingBody(project, section.id)}`).join('\n\n');
  const parts = [`# ${markdownText(project.title)}`, body];
  if (project.manuscript.trim()) parts.push(body ? '## Earlier freeform draft (preserved)' : '', project.manuscript);
  const references = draftBibliography(project);
  if (references) parts.push('## Draft bibliography', references);
  if (studio.evidenceLinks.length) {
    parts.push('## Evidence traceability appendix — author review notes', 'This appendix records author-entered source links and retained snapshots. It does not independently verify the findings. Review its suitability before sharing or submitting.');
    for (const link of studio.evidenceLinks) {
      const state = writingEvidenceState(project, link), title = sections.find(section => section.id === link.sectionId)?.title ?? 'Earlier freeform draft';
      parts.push(`### ${title} · Reference ${state.citation ? `[${state.citation.number}]` : '(missing)'}`,
        `Recorded source summary: ${link.claimText}`, `Evidence location: ${evidenceLevels[link.evidenceLevel]} · ${link.locator}`,
        `Author interpretation: ${link.interpretation || 'Not recorded.'}`, `Uncertainty: ${link.uncertainty || 'Not recorded.'}`,
        `Linked ${link.linkedAt}. Source-note review state at insertion: ${link.reviewStatus}.`,
        state.issues.length ? `Review prompts: ${state.issues.join(' ')}` : 'No mismatch was detected in the recorded fields; source verification remains the author’s responsibility.');
    }
  }
  return `${parts.filter(Boolean).join('\n\n')}\n`;
}
