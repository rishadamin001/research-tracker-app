import type { Project } from './model';

export const studyPurposes = [
  ['explore', 'Explore experiences'],
  ['describe', 'Describe a pattern'],
  ['causal', 'Estimate a causal effect'],
  ['predict', 'Predict an outcome'],
  ['interpret', 'Interpret texts or law'],
  ['synthesize', 'Synthesize existing studies'],
  ['design', 'Build and evaluate an artifact'],
] as const satisfies ReadonlyArray<readonly [Project['purpose'], string]>;

export const exampleTopics: Record<string, string> = {
  'Business & management': 'Digital inventory tools',
  'Computing & engineering': 'Mobile banking accessibility',
  'Environment & life sciences': 'Rainfall and water quality',
  'Social sciences & humanities': 'Climate migration in the news',
  'Law & governance': 'Consent and personal data',
  'Health & pharmacy': 'Access to health information',
};

const defaultPrompts = {
  sampling: 'Define the units, setting, selection process, and a rationale for how many observations you need.',
  instruments: 'Identify your measures or collection tools, how you will pilot them, and how they address the question.',
  analysis: 'Connect each objective to an analysis. Record assumptions, limitations, and materials you can share.',
};

const promptsByPurpose: Partial<Record<Project['purpose'], typeof defaultPrompts>> = {
  explore: {
    sampling: 'Define who can take part, how you will recruit them, and why their experiences fit the question.',
    instruments: 'Draft open-ended interview prompts and a plan for consent, recording, and transcription.',
    analysis: 'Describe how you will code observations or transcripts, reflect on your role, and record divergent accounts.',
  },
  synthesize: {
    sampling: 'Define eligible populations, settings, designs, outcomes, dates, and languages before screening.',
    instruments: 'Record your protocol, planned databases and search strings, screening procedure, and extraction fields.',
    analysis: 'Explain how you will appraise evidence, summarize differences between studies, and handle conflicting findings.',
  },
  predict: {
    sampling: 'Document dataset provenance, licensing, inclusion rules, and how you will create independent data splits.',
    instruments: 'List data preparation steps, candidate models, baselines, and code or environment versions.',
    analysis: 'Define the evaluation metrics, leakage checks, baseline comparisons, and limitations before testing.',
  },
  interpret: {
    sampling: 'Define the boundaries of the corpus or archive and explain why you selected each type of source.',
    instruments: 'Record source selection rules, catalog or citation identifiers, and your interpretive framework.',
    analysis: 'Describe how you will contextualize sources, support interpretations, and consider alternative readings.',
  },
};

export function methodsPrompts(purpose: Project['purpose']) {
  return promptsByPurpose[purpose] ?? defaultPrompts;
}
