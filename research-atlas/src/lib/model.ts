import { z } from 'zod';
import { researchPlanSchema } from './research-plan';
import { evidenceClaimLimit, evidenceClaimSchema, findingSummary, screeningCriterionLimit, screeningCriterionSchema, screeningDecisionSchema, screeningDraftSchema, screeningEventLimit, screeningEventSchema } from './evidence-ledger';
import { searchRunSchema } from './search-provenance';
import { dmpMarkdown, methodContextSchema, structuredDmpSchema } from './study-planning';
import { projectEventLimit, projectEventSchema, questionVersionLimit, questionVersionSchema } from './research-trail';
const text = z.string().max(20000);
const journalQuartile = z.object({
  quartile: z.enum(['Q1', 'Q2', 'Q3', 'Q4']),
  source: z.string().max(200),
  year: z.number().int().min(1900).max(2200),
  category: z.string().max(200),
  url: z.string().max(1200),
  provisional: z.boolean().optional(),
});
const moneyEstimate = z.object({
  amount: z.number().nonnegative(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  source: z.string().max(100),
  checkedAt: z.iso.datetime().optional(),
  url: z.string().max(1200).optional(),
});
const journalFee = moneyEstimate.extend({ usd: z.number().nonnegative().optional() });
export type JournalFee = z.infer<typeof journalFee>;
export const paperSchema = z.object({
  id:z.string().max(500),title:text,authors:text,year:z.number().nullable(),doi:z.string().nullable(),journal:text,url:z.string(),oa:z.string().nullable(),source:z.string(),notes:text.default(''),finding:text.default(''),methods:text.default(''),limitations:text.default(''),locator:text.default(''),decision:screeningDecisionSchema.default('unreviewed'),reason:text.default(''),referenceIds:z.array(z.string().max(500)).max(500).optional(),
  referenceKey: z.string().max(500).optional(),
  readingStatus: z.enum(['unread', 'reading', 'read']).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(20).optional(),
  libraryLinkProvenance: z.object({ fromProjectId: z.string().max(500), fromProjectTitle: z.string().max(20000), linkedAt: z.iso.datetime() }).optional(),
  referenceAuthors: z.array(z.string().max(500)).max(500).optional(),
  isbn: z.string().max(40).optional(),
  screeningEvents: z.array(screeningEventSchema).max(screeningEventLimit).optional(),
  screeningDraft: screeningDraftSchema.optional(),
  evidenceClaims: z.array(evidenceClaimSchema).max(evidenceClaimLimit).optional(),
  researchProblem: text.default(''),
  dataset: text.default(''),
  fwci: z.number().nonnegative().optional(),
  citedByCount: z.number().int().nonnegative().optional(),
  metricsRetrievedAt: z.iso.datetime().optional(),
  workType: z.string().max(100).optional(),
  isRetracted: z.boolean().optional(),
  publisher: z.string().max(500).optional(),
  venueType: z.string().max(100).optional(),
  inDoaj: z.boolean().optional(),
  issns: z.array(z.string().max(20)).max(12).optional(),
  journalQuartile: journalQuartile.optional(),
  publicationDate: z.iso.date().optional(),
  readingCost: moneyEstimate.optional(),
  journalFee: journalFee.optional(),
});
export type Paper=z.infer<typeof paperSchema>;
export const workflowStage = z.enum(['profile','topic','question','discover','screen','extract','methods','data','writing','publication']);
export type Stage = z.infer<typeof workflowStage>;
const journalMetrics = z.object({
  sourceId: z.string().regex(/^https:\/\/openalex\.org\/S\d+$/),
  title: text,
  issn: z.string().regex(/^\d{4}-\d{3}[\dX]$/),
  citedness: z.number().nonnegative().optional(),
  hIndex: z.number().int().nonnegative().optional(),
  checkedAt: z.string().datetime(),
  journalQuartile: journalQuartile.optional(),
  journalFee: journalFee.optional(),
});
export type JournalMetrics = z.infer<typeof journalMetrics>;
const journalCandidate = z.object({id:z.string(),title:text,url:text,scope:text,cost:text,checks:z.array(z.string()).max(30),verification:text,metrics:journalMetrics.optional()});
const decisionRecord = z.object({at:z.string(),note:text});
const duplicateReview = z.object({ id: z.uuid(), at: z.iso.datetime(), action: z.enum(['a', 'b', 'both', 'merge']), keptId: z.string().max(500), otherId: z.string().max(500), sourceA: text, sourceB: text, archived: paperSchema.optional(), before: paperSchema.optional(), after: paperSchema.optional(), undoneAt: z.iso.datetime().optional() });
export const projectSchema=z.object({id:z.string(),title:text,discipline:text,domain:text,problem:text,question:text,setting:text,purpose:z.enum(['explore','describe','causal','predict','interpret','synthesize','design']),data:z.enum(['existing','new']),design:text,ethics:text,analysis:text,gap:text,gapStatus:z.enum(['idea','search underway','evidence-supported candidate','human-reviewed candidate','contradicted','needs-update']),papers:z.array(paperSchema).max(2000),searches:z.array(z.object({query:text,source:text,date:text,count:z.number(),filters:text,run:searchRunSchema.optional()})).max(1000),lessons:z.array(z.string()).default([]),
  experience:text.default(''),goal:text.default(''),institution:text.default(''),constraints:text.default(''),topic:text.default(''),topicIdeas:text.default(''),topicRationale:text.default(''),objectives:text.default(''),hypothesis:text.default(''),sampling:text.default(''),instruments:text.default(''),ethicsStatus:text.default(''),dataPlan:text.default(''),analysisRecord:text.default(''),manuscript:text.default(''),
  journalCandidates:z.array(journalCandidate).max(100).default([]),
  researchPlan: researchPlanSchema.prefault({}),
  methodContext: methodContextSchema.optional(),
  structuredDmp: structuredDmpSchema.optional(),
  screeningCriteria: z.array(screeningCriterionSchema).max(screeningCriterionLimit).optional(),
  duplicateReviews: z.array(duplicateReview).max(50).optional(),
  questionVersions: z.array(questionVersionSchema).max(questionVersionLimit).optional(),
  questionChangeReason: z.string().max(2000).optional(),
  questionDraft: z.string().max(20000).optional(),
  questionDraftReason: z.string().max(2000).optional(),
  projectEvents: z.array(projectEventSchema).max(projectEventLimit).optional(),
  gapSearchLimits: text.default(''),
  needsReview:z.array(workflowStage).default([]),
  decisions:z.array(decisionRecord).max(300).default([]),
  updatedAt:z.string(),createdAt:z.string()});
export type Project=z.infer<typeof projectSchema>;
export const backupSchema=z.object({schemaVersion:z.literal(1),exportedAt:z.string(),projects:z.array(projectSchema).max(100)});
export function createProject(title='Untitled research project'):Project {const now=new Date().toISOString();return projectSchema.parse({id:crypto.randomUUID(),title,discipline:'Business & management',domain:'',problem:'',question:'',setting:'',purpose:'explore',data:'existing',design:'',ethics:'',analysis:'',gap:'',gapStatus:'idea',papers:[],searches:[],lessons:[],updatedAt:now,createdAt:now});}
export function parseBackup(raw:string) {if(new TextEncoder().encode(raw).length>10_000_000)throw Error('This backup exceeds the 10 MB import limit.');const result=backupSchema.safeParse(JSON.parse(raw));if(!result.success)throw Error('This is not a valid Research Atlas version 1 backup. Your projects have not changed.');return result.data;}
export function normalizeDoi(input:string) {const value=input.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');if(!/^10\.\d{4,9}\/\S+$/i.test(value)||value.length>300)throw Error('Enter a valid DOI, such as 10.1038/nature12373.');return value.toLowerCase();}
export function safeUrl(url:string|null|undefined) {if(!url)return undefined;try {const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:undefined;}catch{return undefined;}}
export function addPaper(p:Project,paper:Paper):Project {if(p.papers.some(x=>x.id===paper.id||(x.doi&&paper.doi&&x.doi.toLowerCase()===paper.doi.toLowerCase())))return p;return {...p,papers:[...p.papers,paper]};}
export function csvCell(v:unknown) {let s=String(v??'');if(/^[\s]*[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function matrixCsv(project: Project) {
  const headings = ['Title','Authors','Year','DOI','Source','Decision','Reason','Problem','Methods','Dataset','Finding','Limitations','Evidence locator','Notes'];
  const rows = project.papers.map(paper => {
    const finding = findingSummary(paper);
    return [paper.title, paper.authors, paper.year, paper.doi, paper.source, paper.decision, paper.reason,
      paper.researchProblem, paper.methods, paper.dataset, finding.text, paper.limitations, finding.locator, paper.notes];
  });
  return [headings, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
}
export function protocolMarkdown(p:Project){return `# ${p.title}\n\nExported ${new Date().toISOString()}\n\n## Research profile\n${p.experience} · ${p.goal}\n${p.institution}\n${p.constraints}\n\n## Topic and rationale\n${p.topic}\n${p.topicRationale}\n\n## Research question\n${p.question||'Not yet specified'}\n\nObjectives: ${p.objectives}\nHypothesis: ${p.hypothesis}\n\n## Problem and setting\n${p.problem}\n\n${p.setting}\n\n## Discipline\n${p.discipline} / ${p.domain}\n\n## Study design\n${p.design||'Not selected'}\nPurpose: ${p.purpose}; data: ${p.data}\nSampling: ${p.sampling}\nInstruments: ${p.instruments}\n\n## Ethics and review\n${p.ethics||'Institutional requirements need review.'}\nStatus: ${p.ethicsStatus}\n\n## Analysis plan\n${p.analysis||'Not yet specified'}\n\n## Data management\n${p.structuredDmp ? dmpMarkdown(p.title, p.structuredDmp, p.dataPlan) : p.dataPlan}\n\n## Analysis record\n${p.analysisRecord}\n\n## Candidate contribution (${p.gapStatus})\n${p.gap}\n\nThis is a scoped candidate, not a verified absence of prior research.\n\n## Evidence\n${p.papers.map(x=>`- ${x.title} (${x.year??'date unknown'}). ${x.doi??x.url}\n  Decision: ${x.decision}; ${x.reason}\n  Methods: ${x.methods}\n  Finding: ${x.finding}\n  Limitations: ${x.limitations}\n  Locator: ${x.locator}\n  Notes: ${x.notes}`).join('\n')}\n\n## Search log\n${p.searches.map(x=>`- ${x.date}: ${x.source}; query=${x.query}; ${x.filters}; returned=${x.count}`).join('\n')}\n\nGenerated from user-authored notes; check sources and methodological suitability before use.\n`;}
