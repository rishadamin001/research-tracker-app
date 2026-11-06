import type { Stage } from '@/lib/model';

const lessons: Partial<Record<Stage, { concept: string; example: string; task: string; check: string }>> = {
  question: {
    concept: 'A research question identifies something you can learn from a defined population, place, document collection or system.',
    example: '“How do students study?” is broad. “How do first-year commuters at one campus choose study spaces?” gives you a group and a behavior to investigate.',
    task: 'Name the group or system, what you will investigate and the evidence you could use.',
    check: 'Could a reader tell who or what you studied and what would count as an answer?',
  },
  discover: {
    concept: 'Exploratory search teaches you the vocabulary of a topic. A reproducible review also records which databases, date limits and selection rules you used.',
    example: 'Try “commuter students study spaces” and “campus learning spaces” as separate searches. A single empty query can miss studies that use different words.',
    task: 'Run two focused queries and record the phrases or sources you still need to check.',
    check: 'Inspect the executed query and coverage in the search audit trail before making a claim about the literature.',
  },
  screen: {
    concept: 'Screening applies a study rule to a paper. A title, abstract and full text can support different decisions.',
    example: 'A title may suggest a commuter sample. The full text may show that the study included only residential students.',
    task: 'Write a reusable rule and record one decision with the source stage and reason.',
    check: 'Could another reader apply the same rule? Choose Maybe when the material you have leaves the result uncertain.',
  },
  extract: {
    concept: 'A research gap is a scoped candidate supported by evidence and limited by the search you actually performed.',
    example: 'Two studies excluded commuters. A third included them at a single campus. That third study limits how broadly you can describe the gap.',
    task: 'Record a located claim, then link evidence that supports or challenges the candidate gap.',
    check: 'Look at both groups and list populations, years, sources or search terms you have yet to cover.',
  },
  methods: {
    concept: 'Choose a method that can answer your question with the data and permissions you can obtain.',
    example: 'Interviews can explore why commuters choose a space. Repeated counts can estimate when they use it.',
    task: 'Record the study design, sampling plan, practical constraints and any institutional ethics requirements.',
    check: 'Confirm that your data support the intended conclusion and obtain required approvals before collection.',
  },
  data: {
    concept: 'Keep a record of how raw evidence becomes results, including exclusions and transformations.',
    example: 'Keep the original survey file unchanged. Record how you coded missing responses in a separate analysis copy.',
    task: 'Name your raw and working files, record who can access them, and log how you handled missing data.',
    check: 'Could another authorized researcher reproduce the figures or themes from your notes and files?',
  },
};

export function ContextGuide({ stage }: { stage: Stage }) {
  const lesson = lessons[stage];
  if (!lesson) return null;
  return <details className="panel">
    <summary>Learn and check this step</summary>
    <p><strong>Learn.</strong> {lesson.concept}</p>
    <p><strong>See.</strong> {lesson.example}</p>
    <p><strong>Do.</strong> {lesson.task}</p>
    <p><strong>Check.</strong> {lesson.check}</p>
  </details>;
}
