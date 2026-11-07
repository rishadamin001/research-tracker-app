import { z } from 'zod';

const note = z.string().max(20000).default('');
export const methodContextSchema = z.object({
  goal: z.enum(['', 'explore', 'describe', 'compare', 'understand', 'relationship', 'evaluate', 'design', 'review', 'predict', 'uncertain']).default(''),
  unit: note,
  evidence: z.enum(['', 'existing', 'new', 'both', 'unavailable', 'unknown']).default(''),
  measurement: z.enum(['', 'numbers', 'text', 'mixed', 'documents', 'unknown']).default(''),
  causalIntent: z.enum(['', 'yes', 'no', 'unsure']).default(''),
  intervention: z.enum(['', 'yes', 'no', 'not-applicable', 'unknown']).default(''),
  ethics: z.enum(['', 'documented', 'consultation', 'unknown']).default(''),
  resources: note,
});
export type MethodContext = z.infer<typeof methodContextSchema>;

export const dmpFields = [
  ['types', 'Data or evidence types', 'Survey responses, interview transcripts, code, images, documents…'],
  ['source', 'Data source and provenance', 'Who creates the material, its origin, and permission to reuse it.'],
  ['formats', 'File formats', 'Editable working formats and durable sharing formats, such as CSV or TXT.'],
  ['volume', 'Estimated data volume', 'Approximate number of files, records, or storage space.'],
  ['sensitivity', 'Sensitivity and consent restrictions', 'Describe categories and restrictions; do not enter participant identifiers.'],
  ['storage', 'Storage location', 'The institution-approved storage service or device. Never enter passwords.'],
  ['backup', 'Backup and recovery', 'Who makes backups, how often, and how restoration will be checked.'],
  ['naming', 'File naming and versioning', 'A consistent naming convention and how changes will be tracked.'],
  ['documentation', 'Documentation and metadata', 'Codebooks, variable definitions, collection notes, and readme files.'],
  ['access', 'Access and responsibilities', 'Who can read, edit, approve sharing, and handle requests.'],
  ['retention', 'Retention and secure disposal', 'The required retention period and eventual deletion procedure.'],
  ['sharing', 'Sharing and restrictions', 'What can be shared, when, and what needs consent or anonymization.'],
  ['repository', 'Repository and licence', 'A suitable repository, access conditions, and permitted licence if applicable.'],
] as const;
export const structuredDmpSchema = z.object({
  types: note, source: note, formats: note, volume: note, sensitivity: note, storage: note,
  backup: note, naming: note, documentation: note, access: note, retention: note, sharing: note, repository: note,
});
export type StructuredDmp = z.infer<typeof structuredDmpSchema>;

export type DesignCandidate = { title: string; rationale: string; conditions: string[] };
export type MethodRoute = { status: 'insufficient-information' | 'conditional-candidates'; missing: string[]; candidates: DesignCandidate[]; cautions: string[] };

/** An editorial planning aid, not an automated methodology decision or validity score. */
export function routeMethods(context: MethodContext): MethodRoute {
  const missing: string[] = [];
  if (!context.goal || context.goal === 'uncertain') missing.push('Clarify what you want to learn.');
  if (!context.unit.trim()) missing.push('Define the population, cases, texts, or other unit of analysis.');
  if (!context.evidence || context.evidence === 'unknown') missing.push('Identify accessible data or evidence.');
  if (context.evidence === 'unavailable') missing.push('Find a feasible evidence source or narrow the question.');
  if (!context.measurement || context.measurement === 'unknown') missing.push('Explain how the question will be measured or interpreted.');
  if (!context.causalIntent || context.causalIntent === 'unsure') missing.push('Decide whether you are claiming cause and effect.');
  if (!context.intervention || context.intervention === 'unknown') missing.push('Assess whether an intervention or controlled comparison is feasible.');
  if (!context.ethics || context.ethics === 'unknown') missing.push('Assess ethics and access requirements with the relevant reviewer.');
  if (!context.resources.trim()) missing.push('Record time, skills, budget, and access limits.');
  if (context.causalIntent === 'yes' && context.intervention === 'not-applicable') missing.push('Resolve how a causal contrast could be identified without an intervention.');
  if (context.goal === 'review' && context.evidence === 'new') missing.push('For an evidence review, identify the existing studies or sources to review.');
  if (missing.length) return { status: 'insufficient-information', missing, candidates: [], cautions: [] };

  const cautions = ['These are conditional starting points. Review fit with a supervisor or methods specialist; completing this form does not validate a design.'];
  if (context.ethics !== 'documented') cautions.push('Ethics or access consultation remains unresolved. Obtain any required approvals before collection or restricted-data use.');
  let candidates: DesignCandidate[];
  if (context.goal === 'review') candidates = [{ title: 'Scoping or systematic evidence review', rationale: 'Your goal is to examine existing evidence rather than collect a new sample.', conditions: ['Choose mapping versus focused synthesis explicitly.', 'Plan sources, reproducible searches, eligibility, screening, and design-appropriate appraisal.'] }];
  else if (context.causalIntent === 'yes') candidates = context.intervention === 'yes'
    ? [{ title: 'Experiment with a justified comparison', rationale: 'An intervention is feasible and your question asks about cause and effect.', conditions: ['Specify assignment, comparison group, outcomes, sample-size justification, and ethical feasibility.', 'Randomization, if appropriate, must be planned; the form does not establish feasibility or approval.'] }]
    : [{ title: 'Observational causal analysis requiring methods review', rationale: 'You seek a causal answer but cannot intervene. A simple association cannot answer that question alone.', conditions: ['Justify a causal identification strategy and assumptions about confounding, timing, and selection.', 'If those assumptions cannot be supported, narrow the claim to association or description.'] }];
  else if (context.goal === 'design') candidates = [{ title: 'Artifact design with a planned evaluation', rationale: 'You aim to build or improve a system, method, or artifact.', conditions: ['Define requirements, intended users, comparison baselines, and evaluation criteria before building.', 'Distinguish usability or performance results from causal claims.'] }];
  else if (context.goal === 'predict') candidates = [{ title: 'Prediction study with held-out evaluation', rationale: 'Your goal is to predict an outcome rather than establish its cause.', conditions: ['Check outcome labels, representative samples, leakage, baseline performance, and uncertainty.', 'Separate training, model selection, and final testing; assess external validity.'] }];
  else if (context.measurement === 'text' || context.goal === 'understand') candidates = [{ title: 'Qualitative interviews, case study, or interpretive analysis', rationale: 'Your goal or evidence concerns meaning, experience, or context.', conditions: ['Select an approach consistent with the question and existing versus newly collected material.', 'Explain case selection, interpretation/coding, researcher role, and how claims are supported by the material.'] }];
  else if (context.measurement === 'documents') candidates = [{ title: 'Bounded documentary or corpus analysis', rationale: 'Your evidence consists of documents, records, or a defined corpus.', conditions: ['Specify corpus boundaries, provenance, selection logic, and analytic framework.', 'Check how context, missing records, and alternative interpretations limit conclusions.'] }];
  else if (context.measurement === 'mixed') candidates = [{ title: 'Mixed-methods study, if integration is justified', rationale: 'Your evidence includes both numeric and interpretive material.', conditions: ['Explain why both kinds of evidence are needed and where they will be integrated.', 'Plan sampling, analysis, and feasibility for each component separately.'] }];
  else candidates = [{ title: 'Descriptive or comparative observational study', rationale: 'Numeric observations can describe patterns or compare groups without assigning an intervention.', conditions: ['Define measures, sampling, inclusion rules, missing-data handling, and an appropriate comparison.', 'For relationship questions, consider confounding and uncertainty; association does not establish causation.'] }];
  return { status: 'conditional-candidates', missing: [], candidates, cautions };
}

type Guidance = { id: string; name: string; edition: string; scope: string; url: string; checkedAt: string };
const checkedAt = '2026-11-07';
export const guidanceRegistryVersion = '1.0';
export const studyDesignGuidance: Guidance[] = [
  { id: 'cdc-design', name: 'CDC study-design guidance', edition: '2024 chapter', scope: 'Analytic field epidemiology; comparison groups, observational and experimental approaches. This scope is not universal across disciplines.', url: 'https://www.cdc.gov/field-epi-manual/php/chapters/design-conduct-analyze-field-studies.html', checkedAt },
  { id: 'jbi-manual', name: 'JBI Manual for Evidence Synthesis', edition: 'Living manual; check current chapter', scope: 'Methods for design-specific evidence synthesis. Choose guidance for the type of review you plan.', url: 'https://jbi-global.atlassian.net/wiki/spaces/MANUAL/overview', checkedAt },
];
export const reportingGuidance: Guidance[] = [
  { id: 'prisma', name: 'PRISMA', edition: '2020', scope: 'Reporting systematic reviews; select appropriate extensions for other review types.', url: 'https://www.prisma-statement.org/prisma-2020', checkedAt },
  { id: 'strobe', name: 'STROBE', edition: '2007 statement', scope: 'Reporting cohort, case-control, and cross-sectional observational epidemiology; not a universal survey checklist.', url: 'https://www.strobe-statement.org/', checkedAt },
  { id: 'consort-spirit', name: 'CONSORT / SPIRIT', edition: '2025', scope: 'Reporting randomized trial results / protocols.', url: 'https://www.consort-spirit.org/', checkedAt },
  { id: 'equator', name: 'EQUATOR reporting library', edition: 'Living directory; select the relevant version', scope: 'Find design-specific reporting guidance, including qualitative, diagnostic, prediction, and case reports.', url: 'https://www.equator-network.org/reporting-guidelines/', checkedAt },
];
export const appraisalGuidance: Guidance[] = [
  { id: 'rob2', name: 'RoB 2', edition: '2019; variants updated separately', scope: 'Risk of bias in randomized trials; choose the correct parallel, cluster, or crossover variant.', url: 'https://www.riskofbias.info/welcome/rob-2-0-tool', checkedAt },
  { id: 'jbi-appraisal', name: 'JBI critical appraisal tools', edition: 'Design-specific versions; check current tool', scope: 'Appraise published evidence using a tool suited to its design. Do not convert reporting completeness into a quality score.', url: 'https://jbi.global/critical-appraisal-tools', checkedAt },
];

export function dmpMarkdown(title: string, plan: StructuredDmp, legacyNotes = '') {
  return [`# Data management plan: ${title}`, `Exported ${new Date().toISOString()}`, 'A user-authored planning draft. Check institutional, funder, consent, and legal requirements.',
    ...dmpFields.map(([key, label]) => `## ${label}\n\n${plan[key].trim() || 'Not yet specified'}`),
    ...(legacyNotes.trim() ? [`## Additional / earlier planning notes\n\n${legacyNotes}`] : []),
    '## Funder-specific guidance\n\nhttps://dmptool.org/\n\nNo content is uploaded by this export.'].join('\n\n');
}
