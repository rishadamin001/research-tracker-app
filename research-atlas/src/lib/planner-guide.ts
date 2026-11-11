export type PlannerTarget = 'paper-search' | 'discover' | 'question' | 'screen' | 'extract' | 'methods' | 'data' | 'analysis' | 'draft' | 'publish';

type GuideStep = {
  title: string;
  phase: string;
  summary: string;
  tasks: readonly string[];
  example: string;
  output: string;
  action: { label: string; target: PlannerTarget };
};

export const journeySteps: readonly GuideStep[] = [
  {
    title: 'Find the gap',
    phase: 'Read and compare',
    summary: 'A gap is a specific question that existing evidence leaves open. Start with one topic you can realistically study.',
    tasks: [
      'Start with a handful of recent, relevant papers and follow their strongest citations. Keep the search terms and dates.',
      'Make a synthesis grid. For each paper, record the problem, method, dataset or participants, key finding, and one limitation. Group papers by what they agree or disagree about.',
      'Check whether a newer study already answered the question. Ask a supervisor whether the remaining gap is worth addressing.',
    ],
    example: 'Several papers describe student housing satisfaction. You find little evidence on how first-year commuters at your campus choose study spaces.',
    output: 'A comparison grid and one candidate gap',
    action: { label: 'Search papers', target: 'paper-search' },
  },
  {
    title: 'Plan your study',
    phase: 'Question and ethics',
    summary: 'Turn the gap into one answerable question. Decide what evidence would answer it, then get the required approvals before collecting it.',
    tasks: [
      'Specify whom or what you will study, where, and what you need to learn. Define your sampling, measures, and analysis before collecting data.',
      'Ask the relevant institutional ethics body what review, consent, or permission applies to people, sensitive records, or animals. Wait for any required approval before starting.',
      'Agree on responsibilities, authorship expectations, and a realistic schedule with collaborators. Consider preregistering a study plan when appropriate.',
    ],
    example: 'Ask how first-year commuting students at your campus describe choosing places to study between classes. A small interview study may fit this “how” question.',
    output: 'A research question, protocol, and approvals plan',
    action: { label: 'Plan methods and ethics', target: 'methods' },
  },
  {
    title: 'Gather evidence',
    phase: 'Collect and analyze',
    summary: 'Work from the study plan and keep a record of decisions someone else could follow.',
    tasks: [
      'Pilot the survey or interview guide where appropriate. Record what changed and why, and work within your approved protocol.',
      'Keep a protected original dataset. Work from a separate copy and log your cleaning steps, code, settings, and deviations.',
      'Use the planned analysis. Report uncertainty and unexpected findings, and separate exploratory work from planned tests.',
    ],
    example: 'Keep interview transcripts in institution-approved storage. Record how you grouped recurring reasons, such as noise, access, and travel schedules.',
    output: 'A traceable dataset or evidence record and analysis notes',
    action: { label: 'Open data and analysis notes', target: 'data' },
  },
  {
    title: 'Draft the paper',
    phase: 'Explain your evidence',
    summary: 'Many empirical papers use IMRaD. Try writing Methods and Results first, while the details are fresh.',
    tasks: [
      'Introduction explains the question and why it matters. Methods gives the recipe. Results reports what you found. Discussion explains what the findings mean and where they may fall short.',
      'Use a reference manager so citations and the bibliography update together. Check each important citation against its original source.',
      'Pick the reporting checklist for your study type. Tell readers where your findings apply and what your data cannot answer.',
    ],
    example: 'Show the themes you found, then explain that students from one campus cannot represent all commuters. Write the abstract after the main argument is stable.',
    output: 'A draft with references, figures, and candid limitations',
    action: { label: 'Open manuscript draft', target: 'draft' },
  },
  {
    title: 'Prepare to submit',
    phase: 'Choose a venue',
    summary: 'Find the official author instructions, check who runs the venue, and work backward from the deadline.',
    tasks: [
      'Compare audience, scope, review process, author fees, and whether a journal article, conference paper, poster, or talk suits the work.',
      'Apply the current template and check word or page limits, figure requirements, references, and whether the submission must be anonymized.',
      'Prepare the cover letter and required declarations. Let collaborators review the final files. Verify the deadline and time zone on the official page.',
    ],
    example: 'You target a teaching and learning conference. Its call asks for an anonymized extended abstract, so you remove identifying details from the review copy and inspect the PDF metadata.',
    output: 'A verified venue, review-ready manuscript, and submission pack',
    action: { label: 'Evaluate publication options', target: 'publish' },
  },
  {
    title: 'Respond to review',
    phase: 'Revise and document',
    summary: 'An editor may decline, accept, or request revisions. If you receive feedback, answer it one point at a time.',
    tasks: [
      'Put each reviewer comment in a response table. Describe what you changed and give the page and line numbers in the revised manuscript.',
      'If you disagree or cannot do what was requested, explain your reasoning and what the evidence supports. Keep the tone professional.',
      'Recheck figures, references, declarations, and all requested upload files. Share the response with your collaborators before sending it.',
    ],
    example: 'A reviewer asks how you recruited participants. Add the recruitment dates and inclusion criteria to Methods, then point to the revised page and lines.',
    output: 'A revised manuscript and a point-by-point response',
    action: { label: 'Open manuscript draft', target: 'draft' },
  },
];

export const dataRoutes = [
  { id: 'quantitative', name: 'Quantitative', cue: 'How much or how often?', example: 'Compare commute times or estimate how many students use a library.', record: 'Define the measures, how you will sample, and the main estimate or comparison.' },
  { id: 'qualitative', name: 'Qualitative', cue: 'How or why?', example: 'Interview students to understand why they choose certain study spaces.', record: 'Plan whom to talk to, how to collect and code answers, and how you will judge whether you have enough depth.' },
  { id: 'mixed', name: 'Mixed methods', cue: 'How much, and why?', example: 'Combine a survey on study spaces with interviews about the choices behind the numbers.', record: 'Describe how the two sets of findings will answer the same question together.' },
  { id: 'secondary', name: 'Existing data', cue: 'Can existing evidence answer it?', example: 'Use a public transport dataset to estimate which campuses are accessible.', record: 'Check who collected the data, its license, dates, variables, missing groups, and whether reuse needs permission.' },
] as const;

export const dataSteps: readonly GuideStep[] = [
  {
    title: 'Choose what to measure',
    phase: 'Pick your data route',
    summary: 'Start from your question, then choose numbers, interviews, both, or an existing dataset.',
    tasks: ['Define who or what the study represents. Write down your inclusion and exclusion criteria.', 'Decide what counts as evidence of your main idea. A measure is valid when it captures what you meant to study.'],
    example: 'If the question is why commuters choose the library, travel-time numbers alone cannot tell you their reasons.',
    output: 'A data route and list of what to collect',
    action: { label: 'Plan your methods', target: 'methods' },
  },
  {
    title: 'Plan your sample',
    phase: 'Justify how much data',
    summary: 'Your sample should give you enough information for the question and design.',
    tasks: ['For a planned quantitative test, estimate the smallest effect that matters, choose a test and assumptions, then calculate the sample or use a precision target. G*Power supports many common tests.', 'Allow for expected missing responses and explain how your recruitment could bias the sample. For qualitative studies, justify depth and diversity using your methodological approach.'],
    example: 'A study testing a difference in commute times should plan for a difference that would matter in practice. A study asking why students choose a space needs people with different experiences.',
    output: 'A sampling and recruitment plan with a rationale',
    action: { label: 'Record a sample plan', target: 'methods' },
  },
  {
    title: 'Pilot the questions',
    phase: 'Measure the right thing',
    summary: 'Look for an existing scale tested in a similar population. Check its permission and cite the source.',
    tasks: ['Try the instrument with a small group that resembles your participants. Ask what they thought each question meant and test the form on their devices.', 'For a multi-item scale, internal consistency measures such as Cronbach’s alpha can be informative. A cutoff alone cannot show that the scale measures the right thing. Check whether the scale works in your language and setting.'],
    example: 'A question that asks whether a space is “quiet and comfortable” bundles two ideas. Separate the questions if both ideas matter.',
    output: 'A revised instrument and a record of pilot changes',
    action: { label: 'Record your instrument plan', target: 'methods' },
  },
  {
    title: 'Collect with consent',
    phase: 'Protect your participants',
    summary: 'Follow the approved protocol and explain participation and data use in plain language.',
    tasks: ['Use the consent approach your institution approves. Describe what you will collect, who will see it, and whether it is anonymous or confidential.', 'Collect only what you need. Use institution-approved storage, separate identifiers from responses, and set any quality checks and exclusion rules before looking at the results.'],
    example: 'Use participant codes in analysis files. If contact details are necessary, keep the separate contact list protected.',
    output: 'A protected raw dataset and a log of how it was collected',
    action: { label: 'Plan data storage', target: 'data' },
  },
  {
    title: 'Clean a copy',
    phase: 'Make changes traceable',
    summary: 'Preserve the original and explain every change between the raw and analysis-ready files.',
    tasks: ['Define missing values and variable codes. Check duplicate entries, implausible values, and coding errors. Use your documented rules to decide which rows to keep.', 'Record each exclusion, recoding, and decision about missing data. If a rule changed, report why and check how that affects the result.'],
    example: 'If you code a five-point agreement scale as 1 to 5, document the labels, reversed questions, and how unanswered items are handled.',
    output: 'A cleaned dataset, codebook, and decision log',
    action: { label: 'Log data decisions', target: 'data' },
  },
  {
    title: 'Analyze and explain',
    phase: 'Answer the question',
    summary: 'Start with a clear summary, then use a method suited to the design. Report what the evidence supports and how uncertain it is.',
    tasks: ['A t-test, ANOVA, or regression may fit some quantitative designs. Check assumptions and give effect sizes and intervals where appropriate. A p-value alone cannot establish a finding’s truth or importance.', 'For interviews, explain how you coded and checked themes. For model or intervention studies, compare a fair baseline or control when the design calls for it. A component removal test can help show what contributes to a model’s performance.'],
    example: 'Show the estimated difference in travel time and its uncertainty, or explain the themes from interviews and include representative quotes where consent allows.',
    output: 'Results someone can follow, plus uncertainty and limitations',
    action: { label: 'Record your analysis', target: 'analysis' },
  },
];

export const toolGroups = [
  { id: 'find', label: 'Find papers' },
  { id: 'cite', label: 'Cite and write' },
  { id: 'collect', label: 'Plan and collect data' },
  { id: 'analyze', label: 'Analyze evidence' },
  { id: 'share', label: 'Check and share' },
] as const;

type GuideTool = {
  id: string;
  name: string;
  group: typeof toolGroups[number]['id'];
  access: string;
  color: string;
  mark: string;
  note: string;
  href: string;
};

export const guideTools: readonly GuideTool[] = [
  { id: 'semantic-scholar', name: 'Semantic Scholar', group: 'find', access: 'Free search', color: '#236d75', mark: 'S²', note: 'Find papers by topic and follow references and citations from a relevant result.', href: 'https://www.semanticscholar.org/' },
  { id: 'connected-papers', name: 'Connected Papers', group: 'find', access: 'Limited free use', color: '#4875aa', mark: 'CP', note: 'Start with one relevant paper and map related work. Run separate database searches for wider coverage.', href: 'https://www.connectedpapers.com/' },
  { id: 'researchrabbit', name: 'ResearchRabbit', group: 'find', access: 'Free option', color: '#7358af', mark: 'RR', note: 'Add seed papers to a collection and explore related papers and authors.', href: 'https://www.researchrabbit.ai/' },
  { id: 'zotero', name: 'Zotero', group: 'cite', access: 'Free and open source', color: '#ac3545', mark: 'Z', note: 'Clip papers with the browser connector. Use the word processor plugin to insert citations and switch reference styles.', href: 'https://www.zotero.org/support/word_processor_integration' },
  { id: 'mendeley', name: 'Mendeley', group: 'cite', access: 'Free option', color: '#ac3545', mark: 'M', note: 'Organize and annotate PDFs, then insert references with Mendeley Cite in Word.', href: 'https://www.mendeley.com/' },
  { id: 'endnote', name: 'EndNote', group: 'cite', access: 'Check university access', color: '#a86122', mark: 'EN', note: 'Maintain a reference library and format citations in a manuscript. Ask your library about a license.', href: 'https://endnote.com/' },
  { id: 'overleaf', name: 'Overleaf', group: 'cite', access: 'Free option', color: '#388253', mark: 'O', note: 'Write collaboratively in LaTeX and start from the official venue template when available.', href: 'https://www.overleaf.com/latex/templates' },
  { id: 'gpower', name: 'G*Power', group: 'collect', access: 'Free download', color: '#725ca1', mark: 'G*', note: 'Estimate sample size for a supported statistical test after you choose assumptions that fit your study.', href: 'https://www.psychologie.hhu.de/arbeitsgruppen/allgemeine-psychologie-und-arbeitspsychologie/gpower' },
  { id: 'kobo', name: 'KoboToolbox', group: 'collect', access: 'Check free-plan eligibility', color: '#3875a8', mark: 'K', note: 'Build survey forms and collect field responses on phones even without a connection.', href: 'https://support.kobotoolbox.org/data-collection-tools.html' },
  { id: 'redcap', name: 'REDCap', group: 'collect', access: 'Institution-managed', color: '#b43f52', mark: 'RC', note: 'Build research surveys and databases using your institution’s approved deployment.', href: 'https://projectredcap.org/' },
  { id: 'qualtrics', name: 'Qualtrics', group: 'collect', access: 'Check university access', color: '#4167aa', mark: 'Q', note: 'Build and pilot a questionnaire with branching logic. Ask your institution what storage and consent options are approved.', href: 'https://www.qualtrics.com/' },
  { id: 'jasp', name: 'JASP', group: 'analyze', access: 'Free and open source', color: '#398858', mark: 'J', note: 'Run many common statistical analyses through a menu and inspect the tables and plots.', href: 'https://jasp-stats.org/' },
  { id: 'jamovi', name: 'jamovi', group: 'analyze', access: 'Free desktop app', color: '#447ba6', mark: 'j', note: 'Open a spreadsheet and run common analyses through a graphical interface.', href: 'https://www.jamovi.org/' },
  { id: 'spss', name: 'IBM SPSS', group: 'analyze', access: 'Check university access', color: '#385a9c', mark: 'SP', note: 'Use a menu or syntax to run statistical analyses and keep a record of the commands.', href: 'https://www.ibm.com/products/spss-statistics' },
  { id: 'maxqda', name: 'MAXQDA', group: 'analyze', access: 'Check university access', color: '#ab5b4e', mark: 'MQ', note: 'Label passages from interviews and compare recurring ideas across participants.', href: 'https://www.maxqda.com/' },
  { id: 'nvivo', name: 'NVivo', group: 'analyze', access: 'Check university access', color: '#5b6e82', mark: 'NV', note: 'Code transcripts or documents and organize the evidence for each theme.', href: 'https://lumivero.com/products/nvivo/' },
  { id: 'ithenticate', name: 'iThenticate', group: 'share', access: 'Check university access', color: '#536eaa', mark: 'iT', note: 'Inspect matching text in a manuscript using an approved service. Review the context of the matches.', href: 'https://www.ithenticate.com/' },
  { id: 'turnitin', name: 'Turnitin', group: 'share', access: 'Check university access', color: '#488081', mark: 'T', note: 'Review text overlap and sources. Ask your institution which manuscript submission options and settings to use.', href: 'https://helpcenter.turnitin.com/hc/en-us/articles/27811925295501-Does-Turnitin-check-for-plagiarism-and-what-is-a-good-Similarity-score' },
  { id: 'orcid', name: 'ORCID', group: 'share', access: 'Free iD', color: '#668e34', mark: 'iD', note: 'Get a persistent researcher identifier that helps distinguish you from authors with similar names.', href: 'https://orcid.org/' },
  { id: 'osf', name: 'OSF', group: 'share', access: 'Free option', color: '#506d8b', mark: 'OSF', note: 'Record a time-stamped research plan and organize materials. Choose visibility carefully.', href: 'https://help.osf.io/' },
  { id: 'zenodo', name: 'Zenodo', group: 'share', access: 'Free repository', color: '#4d709d', mark: 'Z', note: 'Deposit shareable data, code, and materials and give them a stable DOI.', href: 'https://zenodo.org/' },
  { id: 'figshare', name: 'Figshare', group: 'share', access: 'Free option', color: '#606680', mark: 'F', note: 'Find or share research outputs with a persistent record. Confirm consent, licensing, and privacy before sharing.', href: 'https://figshare.com/' },
];
