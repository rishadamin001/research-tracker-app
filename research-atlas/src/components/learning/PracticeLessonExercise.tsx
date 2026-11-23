import { type Ref, useId, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { PracticeLesson } from '@/lib/practice-lessons';
import type { PlannerTarget } from '@/lib/planner-guide';
import type { LessonProgress } from './practiceLessonProgress';

const day = 24 * 60 * 60 * 1000;

export function PracticeLessonExercise({ lesson, progress, onProgress, openSection, headingRef }: {
  lesson: PracticeLesson;
  progress: LessonProgress;
  onProgress: (value: LessonProgress) => void;
  openSection?: (target: PlannerTarget) => void;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const id = useId();
  const questionHeading = useRef<HTMLLegendElement>(null);
  const [checked, setChecked] = useState(() => (progress.revisitAt ?? Infinity) <= Date.now() ? undefined : progress.checkedOption);
  const [selected, setSelected] = useState(checked);
  const feedback = checked === undefined ? undefined : lesson.options[checked]?.feedback;

  function checkAnswer() {
    if (selected === undefined) return;
    setChecked(selected);
    const delay = selected === lesson.correct ? 2 * day : day;
    onProgress({ ...progress, checkedOption: selected, revisitAt: Date.now() + delay });
  }

  return <article className="planner-step-detail practice-exercise" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`} ref={headingRef} tabIndex={-1}>{lesson.title}</h3>
    <p>{lesson.takeaway}</p>
    <p className="practice-scenario"><strong>Example</strong> {lesson.examples[0].scenario}</p>
    <details className="planner-example">
      <summary>See a worked example</summary>
      <div className="practice-examples">
        {lesson.examples.map((example, index) => <div key={example.discipline}>
          <h4>{example.discipline}</h4>
          {index > 0 && <p>{example.scenario}</p>}
          <p>{example.reasoning}</p>
        </div>)}
      </div>
    </details>
    <fieldset className="practice-choices">
      <legend ref={questionHeading} tabIndex={-1}>{lesson.question}</legend>
      {lesson.options.map(({ answer }, index) => <label key={answer} className="practice-choice">
        <input type="radio" name={id} checked={selected === index} onChange={() => {
          setSelected(index);
          setChecked(undefined);
        }} />
        <span>{answer}</span>
      </label>)}
    </fieldset>
    <div className="button-row">
      <button className="button secondary" type="button" onClick={checkAnswer} disabled={selected === undefined || selected === checked}>Check answer</button>
      {checked !== undefined && <button className="text-button practice-repeat" type="button" onClick={() => {
        setSelected(undefined);
        setChecked(undefined);
        questionHeading.current?.focus();
      }}>Practice again</button>}
    </div>
    <div role="status">
      {feedback && <p className="practice-feedback"><strong>{checked === lesson.correct ? 'That fits the question.' : 'Reconsider this choice.'}</strong> {feedback}</p>}
    </div>
    {progress.revisitAt !== undefined && <p className="practice-revisit">
      {progress.revisitAt <= Date.now()
        ? 'Ready to revisit. Try the question from memory.'
        : `Revisit after ${new Date(progress.revisitAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}.`}
    </p>}
    <label className="field practice-reflection">
      <span>Your explanation (optional)</span>
      <small id={`${id}-reflection`}>{lesson.reflection}</small>
      <textarea value={progress.reflection} onChange={event => onProgress({ ...progress, reflection: event.target.value })} maxLength={1000} rows={3} aria-label="Your explanation (optional)" aria-describedby={`${id}-reflection`} />
    </label>
    <section className="practice-task" aria-labelledby={`${id}-application`}>
      <h4 id={`${id}-application`}>Practice in your project</h4>
      <p>{lesson.application.task}</p>
      <details className="practice-self-check"><summary>Check your work</summary><p>{lesson.application.check}</p></details>
      {openSection && <button className="button" type="button" onClick={() => openSection(lesson.application.target)}>
        {lesson.application.label}<ArrowRight size={16} aria-hidden="true" />
      </button>}
    </section>
  </article>;
}
