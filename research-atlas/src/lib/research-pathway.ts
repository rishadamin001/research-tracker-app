import type { StructuredDmp } from './study-planning';

export const studyTypes = ['quantitative', 'qualitative', 'mixed', 'literature'] as const;
export type StudyType = typeof studyTypes[number];
export type ResearchPathway = {
  id: StudyType;
  label: string;
  description: string;
  questionExample: string;
  evidenceExample: string;
  samplingPrompt: string;
  proceduresPrompt: string;
  ethicsPrompt: string;
  analysisPrompt: string;
};

export const researchPathways: Record<StudyType, ResearchPathway> = {
  quantitative: {
    id: 'quantitative', label: 'Quantitative empirical', description: 'Use numerical observations to describe, compare, predict or examine relationships. A causal claim needs its own justified design.',
    questionExample: 'What association is observed between commute time and study-space use among students at one campus?',
    evidenceExample: 'A documented dataset, measurements, or a structured instrument with a justified sampling plan.',
    samplingPrompt: 'Define the population or records, inclusion rules, selection method and sample-size rationale suited to the planned analysis.',
    proceduresPrompt: 'Describe measurement, instrument provenance or validation, collection procedures and any comparison or baseline.',
    ethicsPrompt: 'Assess participant contact, personal data, consent, access permissions and institutional review requirements. Secondary numerical data can also have restrictions.',
    analysisPrompt: 'Connect each question to an analysis, assumptions, missing-data decisions and uncertainty. Distinguish association from a justified causal inference.',
  },
  qualitative: {
    id: 'qualitative', label: 'Qualitative empirical', description: 'Study experiences, meaning, practice or context using an explicit interpretive approach.',
    questionExample: 'How do commuter students describe choosing a place to study between classes?',
    evidenceExample: 'Interviews, observations, documents or other material selected to answer an interpretive question.',
    samplingPrompt: 'Explain case or participant selection, context and the rationale for the amount and depth of material. Recruitment is relevant only if you collect participant data.',
    proceduresPrompt: 'Describe interviews, observation or documentary procedures; the analytic approach; researcher role; and how interpretations stay connected to source material.',
    ethicsPrompt: 'Assess consent, identification through quotations or context, recording permissions, researcher relationships and the relevant institution’s review requirements.',
    analysisPrompt: 'Describe the interpretive or coding process, reflexive notes, divergent accounts and how excerpts support each interpretation.',
  },
  mixed: {
    id: 'mixed', label: 'Mixed methods', description: 'Combine numerical and interpretive evidence when the question needs both, with a clear plan for integration.',
    questionExample: 'Which study spaces do commuter students use, and how do their accounts explain those choices?',
    evidenceExample: 'Linked or complementary numerical and qualitative material, with explicit permissions and an integration plan.',
    samplingPrompt: 'Justify selection and sample requirements for each component and explain how the components relate.',
    proceduresPrompt: 'Describe each collection and analysis component, its sequence, and where the two forms of evidence will be integrated.',
    ethicsPrompt: 'Assess consent and access for each component, including whether linking datasets or quotations could reveal identities.',
    analysisPrompt: 'Record the analysis for each component and how agreement, disagreement and integration will be interpreted.',
  },
  literature: {
    id: 'literature', label: 'Literature-based', description: 'Analyze existing studies, texts or records. Decide whether your work is a systematic review, scoping review or another justified form of synthesis.',
    questionExample: 'What barriers to campus study-space access are reported in research on commuter students?',
    evidenceExample: 'Search records, eligible publications or a bounded document corpus, with a reproducible selection process.',
    samplingPrompt: 'Define eligible studies or documents, source databases or archives, dates and other boundaries. Record screening reasons; do not substitute participant recruitment.',
    proceduresPrompt: 'Describe the search or corpus-building process, duplicate review, selection, extraction fields and design-appropriate appraisal when required.',
    ethicsPrompt: 'Check copyright, reuse permissions, sensitive source material and institutional requirements. Literature-based work is not automatically exempt from review.',
    analysisPrompt: 'Explain synthesis or interpretation, differences between sources, contradictory evidence and limits of coverage. Use reporting guidance only when it fits the review type.',
  },
};

export function pathwayFor(project: { studyType?: StudyType }): ResearchPathway | undefined {
  return project.studyType ? researchPathways[project.studyType] : undefined;
}

const commonExamples: Record<keyof StructuredDmp, string> = {
  types: 'Describe the material and its role in answering your question.',
  source: 'Record the creator, original source, collection date and permission or licence.',
  formats: 'Working spreadsheet plus a documented CSV export; plain-text README.',
  volume: 'Estimate the number of files or records and expected storage space; state that this is an estimate.',
  sensitivity: 'List sensitive categories and reuse restrictions without entering names or identifiers.',
  storage: 'Name the institution-approved storage location and access controls; do not paste credentials.',
  backup: 'Name a responsible role, backup schedule and a restoration check on an independent copy.',
  naming: 'For example, project_material_2026-11-08_v01.csv, with a change log.',
  documentation: 'A README, codebook or extraction guide explaining variables, decisions and file relationships.',
  access: 'State which roles can read, edit, approve release and respond to access requests.',
  retention: 'Record the institution or funder’s retention requirement and who will check secure disposal.',
  sharing: 'Describe the shareable material, timing, anonymization and restrictions; assess rather than assume permission.',
  repository: 'Record a suitable repository, licence and access conditions after checking the material’s permissions.',
};

export function dmpExampleFor(project: { studyType?: StudyType }, field: keyof StructuredDmp) {
  if (project.studyType === 'literature') {
    const examples: Partial<Record<keyof StructuredDmp, string>> = {
      types: 'Search exports, screening decisions, extraction tables and analysis scripts for the selected sources.',
      source: 'Database name, actual query and date; source DOI or archive reference; reuse conditions.',
      sensitivity: 'Check whether source texts contain identifying or sensitive information and whether full texts can be redistributed.',
      documentation: 'Eligibility rules, exclusion reasons, extraction definitions and links from findings to source locations.',
      sharing: 'Share permitted metadata, search strategies and author-created extraction records; assess full-text copyright separately.',
    };
    return examples[field] ?? commonExamples[field];
  }
  if (project.studyType === 'qualitative') {
    const examples: Partial<Record<keyof StructuredDmp, string>> = {
      types: 'Interview transcripts or observation notes, interpretive memos and the documented analysis process.',
      sensitivity: 'Assess whether quotes, occupations or contextual details could identify a participant, even after removing names.',
      documentation: 'Collection context, transcription conventions, coding or interpretive notes and reflexive decisions.',
      sharing: 'Describe the consent basis and identification risk before sharing excerpts or transcripts.',
    };
    return examples[field] ?? commonExamples[field];
  }
  if (project.studyType === 'mixed' && field === 'documentation') return 'Document each component, any linking key held separately, and where and how integration takes place.';
  if (project.studyType === 'quantitative' && field === 'documentation') return 'A data dictionary, units, missing-value codes, preparation scripts and analysis environment versions.';
  return commonExamples[field];
}
