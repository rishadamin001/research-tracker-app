import { useState, useRef, useLayoutEffect } from 'react';
import { practiceLessons } from '@/lib/practice-lessons';
import type { PlannerTarget } from '@/lib/planner-guide';
import { External } from '@/components/shared/External';
import { readProgress, type LessonProgress, progressKey, emptyProgress } from './practiceLessonProgress';
import { PracticeLessonExercise } from './PracticeLessonExercise';
import './practice-lessons.css';

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
  const focusLesson = useRef(false);
  useLayoutEffect(() => {
    if (!focusLesson.current) return;
    focusLesson.current = false;
    headingRef.current?.focus();
  }, [activeId]);

  function chooseLesson(id: string) {
    if (id === activeId) {
      headingRef.current?.focus();
      return;
    }
    focusLesson.current = true;
    setActiveId(id);
  }

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
    <p className="planner-intro">Choose a skill and try one question. This browser remembers your practice.</p>
    <div className="practice-layout">
      <ul className="planner-step-list practice-list" aria-label="Practice lessons">
        {practiceLessons.map(lesson => {
          const saved = progress[lesson.id];
          const due = (saved?.revisitAt ?? Infinity) <= Date.now();
          return <li key={lesson.id}>
            <button type="button" aria-pressed={activeId === lesson.id} onClick={() => chooseLesson(lesson.id)}>
              <span><strong>{lesson.title}</strong>
                {due ? <small>Ready to revisit</small> : saved?.checkedOption !== undefined && <small>Practiced</small>}
              </span>
            </button>
          </li>;
        })}
      </ul>
      <PracticeLessonExercise key={activeId} lesson={active} progress={progress[activeId] ?? emptyProgress} onProgress={save} openSection={openSection} headingRef={headingRef} />
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
