import type { PlannerTarget } from './planner-guide';

type PracticeOption = { answer: string; feedback: string };

export type PracticeLesson = {
  id: string;
  title: string;
  takeaway: string;
  example: { scenario: string; reasoning: string };
  question: string;
  options: PracticeOption[];
  correct: number;
  reflection: string;
  application: { target: PlannerTarget; label: string; task: string };
};

export const practiceLessons: PracticeLesson[] = [
  {
    id: 'question',
    title: 'Frame a research question',
    takeaway: 'Name the group or setting and a question you can answer with evidence you can collect.',
    example: {
      scenario: 'A student wants to research campus transport. They ask which barriers first-year commuters at one campus report when using the evening shuttle this term.',
      reasoning: 'The group, place, and period set the scope. Interviews can describe reported barriers within that scope.',
    },
    question: 'Which question could a student investigate by interviewing library users at one campus this term?',
    options: [
      { answer: 'How can we fix education?', feedback: 'This asks for a solution across all of education. Choose a specific experience and group that the available interviews can describe.' },
      { answer: 'What keeps first-year students at this campus from using the library after class?', feedback: 'This identifies a group, setting, and experience that interviews can explore.' },
      { answer: 'Does every student benefit from a library?', feedback: 'Interviews at one campus cannot speak for every student. Narrow the population and describe what counts as a benefit.' },
    ],
    correct: 1,
    reflection: 'Name one group and setting for your question. What evidence could you realistically collect?',
    application: { target: 'question', label: 'Open my working question', task: 'Draft one question with a defined scope. Commit a revision when you have decided on the wording.' },
  },
  {
    id: 'search',
    title: 'Search the literature',
    takeaway: 'Search the concepts in your question, try related terms, and record which database and filters you used.',
    example: {
      scenario: 'For a question about commuting and attendance, start with “student commute attendance.” Try “travel time class attendance” as another search.',
      reasoning: 'Authors use different words for similar concepts. Keep the query and database together so you can revisit what each search covered.',
    },
    question: 'One search returned four papers. What should you do before proposing a research gap?',
    options: [
      { answer: 'Declare a gap because the result list is short.', feedback: 'A short list can reflect the query or the database’s coverage. Try other terms and sources before drawing a conclusion.' },
      { answer: 'Sort by citations and keep just the top result.', feedback: 'Citation counts say little about which terms or databases you missed. Check relevance and expand the search.' },
      { answer: 'Try related terms and another database, then record what each search covered.', feedback: 'You can assess a possible gap after comparing coverage and reading the relevant studies.' },
    ],
    correct: 2,
    reflection: 'Write two ways authors might describe the same concept in your topic.',
    application: { target: 'paper-search', label: 'Run a paper search', task: 'Search two core concepts from your question. Check the provider and query in your search history.' },
  },
  {
    id: 'evaluate',
    title: 'Evaluate a source',
    takeaway: 'Check whether a paper’s methods and population fit the claim you want to make.',
    example: {
      scenario: 'A highly cited paper surveys residential students. You want to understand why commuters miss early classes.',
      reasoning: 'The journal’s citation quartile and the paper’s citation count describe different things. Read the sample and measurements to judge whether the paper addresses your question.',
    },
    question: 'What should determine whether a study meets your screening criteria?',
    options: [
      { answer: 'Its population, design, and outcomes match the criteria I recorded.', feedback: 'Matching the study to explicit criteria makes the decision relevant and traceable.' },
      { answer: 'The journal has a top citation quartile.', feedback: 'Quartiles describe a journal’s citation standing for a category and edition. They cannot establish the fit or quality of an individual study.' },
      { answer: 'The paper has more citations than the other results.', feedback: 'Citation counts reflect attention in a provider’s index. Check the study itself for what it measured and how it was designed.' },
    ],
    correct: 0,
    reflection: 'Write one inclusion criterion and explain how you would check it in a paper.',
    application: { target: 'screen', label: 'Open screening criteria', task: 'Record what makes a source eligible, then apply those criteria to a saved paper.' },
  },
  {
    id: 'interpret',
    title: 'Separate findings from interpretation',
    takeaway: 'Record what the source reports and where you found it. Keep your explanation and doubts visible as your own.',
    example: {
      scenario: 'In this practice example, a paper’s abstract reports that 12 of 20 interviewees mentioned unreliable bus schedules.',
      reasoning: 'Record the count and mark the abstract as your basis. “Unreliable schedules may deter students from attending class” is an interpretation that needs separate evidence.',
    },
    question: 'What could you record as a source finding when you have read only that abstract?',
    options: [
      { answer: 'Unreliable buses cause absence across all universities.', feedback: 'The example reports what a small group said. It does not measure causation or support a conclusion about all universities.' },
      { answer: 'The abstract reports that 12 of 20 interviewees mentioned unreliable schedules.', feedback: 'This preserves the reported result and identifies the part of the paper you read.' },
      { answer: 'The full text confirms unreliable schedules were the most common cause.', feedback: 'You have only read the abstract, and the excerpt does not rank causes. Record your basis and check the full text when available.' },
    ],
    correct: 1,
    reflection: 'Write one sentence reporting the finding and another giving your interpretation. What evidence would connect the two?',
    application: { target: 'extract', label: 'Record a located finding', task: 'Choose a saved source. Record a finding with a locator, reading basis, and a separate interpretation if you have one.' },
  },
  {
    id: 'methods',
    title: 'Choose feasible methods',
    takeaway: 'Match the method to the question, access to participants or data, and the ethical requirements.',
    example: {
      scenario: 'To understand how commuters choose study spaces, a student plans a small interview study with an approved recruitment and consent process.',
      reasoning: 'Interviews can show how participants explain their choices. Estimating how widespread those choices are would require a sampling and measurement plan.',
    },
    question: 'Which plan fits a question about how students explain their choice of study space?',
    options: [
      { answer: 'Use attendance counts alone to infer why each student chose a space.', feedback: 'Counts describe use. They do not capture students’ explanations. Choose a method that can ask about reasons.' },
      { answer: 'Collect identifiable interviews before checking consent and approval.', feedback: 'Plan recruitment, consent, and data handling before collecting interview data. Follow your institution’s requirements.' },
      { answer: 'Plan interviews with feasible recruitment, consent, and a way to analyze the responses.', feedback: 'This fits a question about experiences and specifies how you can collect and interpret the evidence.' },
    ],
    correct: 2,
    reflection: 'What is one practical or ethical constraint on your study, and how would you adapt the method?',
    application: { target: 'methods', label: 'Draft my methods plan', task: 'Write how you will collect and analyze evidence, including one practical limit and one ethics check.' },
  },
  {
    id: 'writing',
    title: 'Write with evidence',
    takeaway: 'Link the sentence to the source that supports it and keep the wording within what the study can show.',
    example: {
      scenario: 'A paragraph says, “Study space always improves grades.” Its source reports that interviewed students valued quiet rooms.',
      reasoning: 'Write “Interviewed students reported valuing quiet rooms” and cite the located finding. A claim about grades would need evidence that measures grades.',
    },
    question: 'Which revision accurately uses a survey that found an association between long commutes and missed classes?',
    options: [
      { answer: 'In this survey, longer commutes were associated with more missed classes. Cite the survey result.', feedback: 'This attributes the result and uses wording that fits an association observed in the survey.' },
      { answer: 'Long commutes cause students to miss class. Cite the survey result.', feedback: 'Adding a citation does not establish causality. Keep the wording at the level supported by the survey.' },
      { answer: 'Long commutes cause students to miss class. Add several citations on transport generally.', feedback: 'A group of loosely related citations does not support a causal claim. Find evidence for the specific sentence or narrow the sentence.' },
    ],
    correct: 0,
    reflection: 'Write a supported sentence for your topic. Which part of its source can a reader check?',
    application: { target: 'draft', label: 'Open Writing Studio', task: 'Add a sentence linked to one of your recorded findings. Check that the wording fits the evidence and keep any caveat visible.' },
  },
];
