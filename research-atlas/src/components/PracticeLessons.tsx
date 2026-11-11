import { useId, useRef, useState, type Ref } from 'react';
import { ArrowRight } from 'lucide-react';
import { z } from 'zod';
import { practiceLessons, type PracticeLesson } from '@/lib/practice-lessons';
import type { PlannerTarget } from '@/lib/planner-guide';
import { External } from './External';
import './practice-lessons.css';

const progressKey = 'atlas-practice-progress-v1';
const progressSchema = z.record(z.string(), z.object({
  reflection: z.string().max(1000),
  checkedOption: z.number().int().min(0).max(2).optional(),
  revisitAt: z.number().finite().nonnegative().max(8.64e15).optional(),
}));
type Progress = z.infer<typeof progressSchema>;
type LessonProgress = Progress[string];
const emptyProgress: LessonProgress = { reflection: '' };
const day = 24 * 60 * 60 * 1000;

function readProgress(): Progress {
  try {
    return progressSchema.parse(JSON.parse(localStorage.getItem(progressKey) ?? '{}'));
  } catch {
    return {};
  }
}

function LessonExercise({ lesson, progress, onProgress, openSection, headingRef }: {
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
    <details className="planner-example">
      <summary>See a worked example</summary>
      <p>{lesson.example.scenario}</p>
      <p>{lesson.example.reasoning}</p>
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
    <p className="practice-task">{lesson.application.task}</p>
    {openSection && <button className="button" type="button" onClick={() => openSection(lesson.application.target)}>
      {lesson.application.label}<ArrowRight size={16} aria-hidden="true" />
    </button>}
  </article>;
}

export function PracticeLessons({ openSection }: { openSection?: (target: PlannerTarget) => void }) {
  const [progress, setProgress] = useState(readProgress);
  const [activeId, setActiveId] = useState(() => {
    const due = practiceLessons.find(lesson => (progress[lesson.id]?.revisitAt ?? Infinity) <= Date.now());
    const unfinished = practiceLessons.find(lesson => progress[lesson.id]?.checkedOption === undefined);
    return (due ?? unfinished ?? practiceLessons[0]).id;
  });
  const [saveFailed, setSaveFailed] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const active = practiceLessons.find(lesson => lesson.id === activeId)!;

  function save(value: LessonProgress) {
    const next = { ...progress, [activeId]: value };
    setProgress(next);
    try {
      localStorage.setItem(progressKey, JSON.stringify(next));
      setSaveFailed(false);
    } catch {
      setSaveFailed(true);
    }
  }

  return <section className="planner-view" aria-labelledby="practice-title">
    <h2 id="practice-title">Practice research skills</h2>
    <p className="planner-intro">Try a short question, explain your reasoning, and apply the skill to your own work. Your answers and explanations stay in this browser.</p>
    <div className="practice-layout">
      <ul className="planner-step-list practice-list" aria-label="Practice lessons">
        {practiceLessons.map(lesson => {
          const saved = progress[lesson.id];
          const due = (saved?.revisitAt ?? Infinity) <= Date.now();
          return <li key={lesson.id}>
            <button type="button" aria-pressed={activeId === lesson.id} onClick={() => {
              setActiveId(lesson.id);
              requestAnimationFrame(() => headingRef.current?.focus());
            }}>
              <span><strong>{lesson.title}</strong>
                {due ? <small>Ready to revisit</small> : saved?.checkedOption !== undefined && <small>Practiced</small>}
              </span>
            </button>
          </li>;
        })}
      </ul>
      <LessonExercise key={activeId} lesson={active} progress={progress[activeId] ?? emptyProgress} onProgress={save} openSection={openSection} headingRef={headingRef} />
    </div>
    {saveFailed && <p role="alert">Couldn’t save practice progress on this device. Your explanation is still visible while this page is open.</p>}
    <details className="practice-sources">
      <summary>About these exercises</summary>
      <p>These lessons use worked examples, practice from memory, and suggested dates for review. The practice feedback applies to the exercise. Review your own work with your instructor or supervisor.</p>
      <div className="planner-source-links">
        <External href="https://doi.org/10.1177/1529100612453266">Review of effective learning techniques</External>
        <External href="https://www.nationalacademies.org/read/24783/chapter/7">How People Learn II</External>
      </div>
    </details>
  </section>;
}
