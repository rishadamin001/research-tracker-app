import type { PlannerTarget } from './planner-guide';

type PracticeOption = { answer: string; feedback: string };
type WorkedExample = { discipline: string; scenario: string; reasoning: string };

export type PracticeLesson = {
  id: string;
  title: string;
  takeaway: string;
  examples: readonly [WorkedExample, WorkedExample];
  question: string;
  options: PracticeOption[];
  correct: number;
  reflection: string;
  application: { target: PlannerTarget; label: string; task: string; check: string };
};

export const practiceLessons: PracticeLesson[] = [
  {
    id: 'question',
    title: 'Frame a research question',
    takeaway: 'Choose a group or place, then ask something you can actually investigate.',
    examples: [{
      discipline: 'Education',
      scenario: 'What makes it difficult for first-year commuters at this campus to use the evening shuttle this term?',
      reasoning: 'The group, place, and period set the scope. Interviews can describe reported barriers within that scope.',
    }, {
      discipline: 'Environmental science',
      scenario: 'A student wants to study urban heat. They ask how midday surface temperatures differ between paired shaded and unshaded pavements on three streets during one week.',
      reasoning: 'The surfaces, time, and location define what to measure. Measuring each pair at the same time makes the comparison easier to interpret.',
    }],
    question: 'Which question could a student investigate by interviewing library users at one campus this term?',
    options: [
      { answer: 'How can we fix education?', feedback: 'This asks for a solution across all of education. Choose a specific experience and group that the available interviews can describe.' },
      { answer: 'What keeps first-year students at this campus from using the library after class?', feedback: 'This identifies a group, setting, and experience that interviews can explore.' },
      { answer: 'Does every student benefit from a library?', feedback: 'Interviews at one campus cannot speak for every student. Narrow the population and describe what counts as a benefit.' },
    ],
    correct: 1,
    reflection: 'Name one group and setting for your question. What evidence could you realistically collect?',
    application: { target: 'question', label: 'Open my working question', task: 'Draft one question around a group, setting, or set of records you can study. Commit the revision when you are happy with the wording.', check: 'Point to the words that limit the scope and name the evidence that would answer the question.' },
  },
  {
    id: 'search',
    title: 'Search the literature',
    takeaway: 'Search the main ideas in your question. Save your search words, database and filters.',
    examples: [{
      discipline: 'Education',
      scenario: 'Try “student commute attendance”, then “travel time class attendance”. Compare the papers you find.',
      reasoning: 'Authors use different words for similar concepts. Keep the query and database together so you can revisit what each search covered.',
    }, {
      discipline: 'Computing',
      scenario: 'For a question about making web forms accessible, try “screen reader web forms” and then “assistive technology form labels.”',
      reasoning: 'Both searches cover a user need and a part of the interface. Comparing their results lets you see which terms find relevant studies you missed the first time.',
    }],
    question: 'One search returned four papers. What should you do before proposing a research gap?',
    options: [
      { answer: 'Declare a gap because the result list is short.', feedback: 'A short list can reflect the query or the database’s coverage. Try other terms and sources before drawing a conclusion.' },
      { answer: 'Sort by citations and keep just the top result.', feedback: 'Citation counts say little about which terms or databases you missed. Check relevance and expand the search.' },
      { answer: 'Try related terms and another database, then record what each search covered.', feedback: 'You can assess a possible gap after comparing coverage and reading the relevant studies.' },
    ],
    correct: 2,
    reflection: 'Write two ways authors might describe the same concept in your topic.',
    application: { target: 'paper-search', label: 'Run a paper search', task: 'Search two core concepts from your question. Change one term and run a second search.', check: 'Find both queries and their providers in Search history. Compare which relevant studies each search found.' },
  },
  {
    id: 'evaluate',
    title: 'Evaluate a source',
    takeaway: 'Check who was studied and how. Can that evidence answer your question?',
    examples: [{
      discipline: 'Education',
      scenario: 'A highly cited paper surveys residential students. You want to understand why commuters miss early classes.',
      reasoning: 'The journal’s citation quartile and the paper’s citation count describe different things. Read the sample and measurements to judge whether the paper addresses your question.',
    }, {
      discipline: 'Public health',
      scenario: 'Your review covers park access for older adults. A study estimates walking times to parks using city maps alone.',
      reasoning: 'It can inform the map-based part of your review. If your inclusion rule requires reported experiences from older adults, record which part of the rule the paper fails.',
    }],
    question: 'What should determine whether a study meets your screening criteria?',
    options: [
      { answer: 'Its population, design, and outcomes match the criteria I recorded.', feedback: 'Matching the study to explicit criteria makes the decision relevant and traceable.' },
      { answer: 'The journal has a top citation quartile.', feedback: 'Quartiles describe a journal’s citation standing for a category and edition. They cannot establish the fit or quality of an individual study.' },
      { answer: 'The paper has more citations than the other results.', feedback: 'Citation counts reflect attention in a provider’s index. Check the study itself for what it measured and how it was designed.' },
    ],
    correct: 0,
    reflection: 'Write one inclusion criterion and explain how you would check it in a paper.',
    application: { target: 'screen', label: 'Open screening criteria', task: 'Write one rule in Screening criteria. Apply it to a saved source and record Include, Maybe, or Exclude with a reason.', check: 'Your reason names a study characteristic that explains the decision against your rule.' },
  },
  {
    id: 'interpret',
    title: 'Separate findings from interpretation',
    takeaway: 'Save what the authors found and its page or section. Write your own explanation separately.',
    examples: [{
      discipline: 'Education',
      scenario: 'A fictional abstract says 12 of 20 students interviewed mentioned unreliable bus schedules.',
      reasoning: 'Record the count and mark the abstract as your basis. “Unreliable schedules may deter students from attending class” is an interpretation that needs separate evidence.',
    }, {
      discipline: 'History',
      scenario: 'City council minutes record a vote to move a market. Your research question asks what traders thought about the move.',
      reasoning: 'Record the vote with the date and page of the minutes. A view about the traders’ reaction belongs in your interpretation until you find evidence of what they said.',
    }],
    question: 'What could you record as a source finding when you have read only that abstract?',
    options: [
      { answer: 'Unreliable buses cause absence across all universities.', feedback: 'The example reports what a small group said. It does not measure causation or support a conclusion about all universities.' },
      { answer: 'The abstract reports that 12 of 20 interviewees mentioned unreliable schedules.', feedback: 'This preserves the reported result and identifies the part of the paper you read.' },
      { answer: 'The full text confirms unreliable schedules were the most common cause.', feedback: 'You have only read the abstract, and the excerpt does not rank causes. Record your basis and check the full text when available.' },
    ],
    correct: 1,
    reflection: 'Write one sentence reporting the finding and another giving your interpretation. What evidence would connect the two?',
    application: { target: 'extract', label: 'Record a located finding', task: 'Record a saved source’s finding and where you read it. Put your own explanation in the interpretation field.', check: 'A reader can locate the result and tell which wording reports the finding and which wording is yours.' },
  },
  {
    id: 'methods',
    title: 'Choose feasible methods',
    takeaway: 'Choose a method you can carry out with the people, data and permissions available.',
    examples: [{
      discipline: 'Education',
      scenario: 'To learn why commuters choose certain study spaces, a student plans interviews and arranges consent.',
      reasoning: 'Interviews can show how participants explain their choices. Estimating how widespread those choices are would require a sampling and measurement plan.',
    }, {
      discipline: 'Engineering',
      scenario: 'A student compares two insulation samples using the same temperature sensors and enclosure over repeated trials.',
      reasoning: 'Keeping the setup constant helps compare the samples. Record sensor accuracy and the number of trials. Identify which full-building conditions remain untested.',
    }],
    question: 'Which plan fits a question about how students explain their choice of study space?',
    options: [
      { answer: 'Use attendance counts alone to infer why each student chose a space.', feedback: 'Counts describe use. They do not capture students’ explanations. Choose a method that can ask about reasons.' },
      { answer: 'Collect identifiable interviews before checking consent and approval.', feedback: 'Plan recruitment, consent, and data handling before collecting interview data. Follow your institution’s requirements.' },
      { answer: 'Plan interviews with feasible recruitment, consent, and a way to analyze the responses.', feedback: 'This fits a question about experiences and specifies how you can collect and interpret the evidence.' },
    ],
    correct: 2,
    reflection: 'What is one practical or ethical constraint on your study, and how would you adapt the method?',
    application: { target: 'methods', label: 'Draft my methods plan', task: 'Write how you will select, collect, and analyze evidence. Add one practical constraint and one check for permissions or ethics.', check: 'Someone else can tell what you would measure or record and how you would use it to answer the question.' },
  },
  {
    id: 'writing',
    title: 'Write with evidence',
    takeaway: 'Write only what the study supports, and give the reader a citation they can follow.',
    examples: [{
      discipline: 'Education',
      scenario: 'A paragraph says, “Study space always improves grades.” Its source reports that interviewed students valued quiet rooms.',
      reasoning: 'Write “Interviewed students reported valuing quiet rooms” and cite the located finding. A claim about grades would need evidence that measures grades.',
    }, {
      discipline: 'Ecology',
      scenario: 'A field study records more pollinator visits to planted strips than to nearby mown strips during one summer.',
      reasoning: 'Write “In the sampled strips, the study recorded more pollinator visits to planted areas that summer” and cite its results table. A claim about year-round change would need more observations.',
    }],
    question: 'Which revision accurately uses a survey that found an association between long commutes and missed classes?',
    options: [
      { answer: 'In this survey, longer commutes were associated with more missed classes. Cite the survey result.', feedback: 'This attributes the result and uses wording that fits an association observed in the survey.' },
      { answer: 'Long commutes cause students to miss class. Cite the survey result.', feedback: 'Adding a citation does not establish causality. Keep the wording at the level supported by the survey.' },
      { answer: 'Long commutes cause students to miss class. Add several citations on transport generally.', feedback: 'A group of loosely related citations does not support a causal claim. Find evidence for the specific sentence or narrow the sentence.' },
    ],
    correct: 0,
    reflection: 'Write a supported sentence for your topic. Which part of its source can a reader check?',
    application: { target: 'draft', label: 'Open Writing Studio', task: 'Add a sentence using one recorded finding. Link its citation and locator, then read the sentence beside the finding.', check: 'The sentence names the scope and any relevant caveat, and its citation leads to the recorded evidence.' },
  },
];
