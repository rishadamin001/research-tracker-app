import { z } from 'zod';

export const milestones = [
  { id: 'scope', name: 'Set the question and study plan', days: 84 },
  { id: 'study', name: 'Finish evidence collection and analysis', days: 35 },
  { id: 'draft', name: 'Share a complete draft with co-authors', days: 21 },
  { id: 'review', name: 'Get supervisor or co-author sign-off', days: 7 },
  { id: 'files', name: 'Check submission files and leave a buffer', days: 2 },
] as const;

export const budgetItems = [
  { id: 'reading', name: 'Reading and library access' },
  { id: 'study', name: 'Data collection and materials' },
  { id: 'apc', name: 'Publication fee (APC) and other journal charges' },
  { id: 'registration', name: 'Conference registration' },
  { id: 'travel', name: 'Travel, visa and accommodation' },
  { id: 'poster', name: 'Poster printing and other costs' },
] as const;

export const budgetCurrencies = ['BDT', 'USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CHF'] as const;

export const submissionFields = [
  { id: 'authors', name: 'Author order and contributions', hint: '[Author order agreed on date]. [Name]: [CRediT roles]. [Corresponding author and contact].' },
  { id: 'ethics', name: 'Ethics and consent', hint: '[Review body and reference or approved exemption]. [Consent and privacy arrangements where applicable].' },
  { id: 'funding', name: 'Funding and competing interests', hint: '[Funder and grant, or no funding]. [Funder’s role]. [Relevant competing interests, or none after checking with all authors].' },
  { id: 'availability', name: 'Data and code availability', hint: '[Repository and DOI or URL]. [Access restrictions or request process, if needed].' },
  { id: 'ai', name: 'AI use disclosure', hint: '[Tool and version] was used for [task]. The authors [review and verification]. Use the venue’s policy to decide what to disclose and where.' },
  { id: 'cover', name: 'Cover letter to the editor', hint: 'Dear [Editor], please consider “[Title]” as a [type of article]. We found [main result], which matters to your readers because [fit]. [Confirm declarations the venue requires]. Sincerely, [Corresponding author].' },
] as const;

export const submissionChecks = [
  { id: 'fit', name: 'The venue’s scope and article type fit the study.' },
  { id: 'identity', name: 'The official venue site, ISSN or organizer, review process and indexing claims were checked.' },
  { id: 'fees', name: 'Fees, taxes, waiver eligibility and deadlines were checked with the venue.' },
  { id: 'format', name: 'The current template, limits, references and figure requirements were checked.' },
  { id: 'anonymous', name: 'The review PDF, filenames, links and metadata follow the venue’s anonymity policy.' },
  { id: 'originality', name: 'Sources, quotation and paraphrasing were checked, including each significant overlap.' },
  { id: 'reporting', name: 'The applicable reporting checklist and required files are ready.' },
  { id: 'approval', name: 'All authors approved the manuscript, declarations and target venue.' },
] as const;

const note = z.string().max(4000);
const offset = z.number().int().min(0).max(3650);
const amount = z.number().nonnegative().max(1_000_000_000).multipleOf(0.01);

export const researchPlanSchema = z.object({
  deadline: z.union([z.literal(''), z.iso.date()]).default(''),
  deadlineTime: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$|^$/).default(''),
  deadlineZone: z.string().max(80).default(''),
  offsets: z.partialRecord(z.enum(milestones.map(item => item.id)), offset).default({}),
  currency: z.enum(budgetCurrencies).default('BDT'),
  budget: z.partialRecord(z.enum(budgetItems.map(item => item.id)), amount).default({}),
  venue: z.string().max(300).default(''),
  venueType: z.enum(['undecided', 'journal', 'conference']).default('undecided'),
  requirements: z.object({ manuscript: z.string().max(120).default(''), abstract: z.string().max(120).default(''), figures: note.default('') }).prefault({}),
  checks: z.array(z.enum(submissionChecks.map(item => item.id))).max(submissionChecks.length).default([]),
  submission: z.partialRecord(z.enum(submissionFields.map(item => item.id)), note).default({}),
  reviewerResponses: z.array(z.object({ id: z.string().uuid(), comment: note, response: note, location: z.string().max(300) })).max(40).default([]),
});

export type ResearchPlan = z.infer<typeof researchPlanSchema>;

export function planMilestones(plan: Pick<ResearchPlan, 'deadline' | 'offsets'>) {
  const end = plan.deadline ? Date.parse(`${plan.deadline}T12:00:00Z`) : NaN;
  return milestones.map(milestone => {
    const daysBefore = plan.offsets[milestone.id] ?? milestone.days;
    const date = Number.isFinite(end) ? new Date(end - daysBefore * 86_400_000).toISOString().split('T')[0] : '';
    return { ...milestone, daysBefore, date };
  }).sort((a, b) => b.daysBefore - a.daysBefore);
}

export function submissionDraft(title: string, plan: ResearchPlan) {
  const heading = `# Submission pack — ${title}\n\nTarget venue — ${plan.venue || '[Venue name]'}\n\n`;
  const requirements = `## Venue requirements\n\n- Manuscript — ${plan.requirements.manuscript || '[Check the word or page limit]'}\n- Abstract — ${plan.requirements.abstract || '[Check the structure and word limit]'}\n- Figures and tables — ${plan.requirements.figures || '[Check the venue’s figure and table rules]'}\n\n`;
  const documents = submissionFields.map(item => `## ${item.name}\n\n${plan.submission[item.id]?.trim() || item.hint}`).join('\n\n');
  const checks = submissionChecks.map(item => `- [${plan.checks.includes(item.id) ? 'x' : ' '}] ${item.name}`).join('\n');
  return `${heading}${requirements}${documents}\n\n## Preflight checklist\n\n${checks}\n`;
}
