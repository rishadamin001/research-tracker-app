import { useState } from 'react';
import { ArrowRight, Check, type LucideIcon } from 'lucide-react';
import type { journeySteps } from '@/lib/planner-guide';
import type { OpenSection } from './ResearchPlannerTypes';

export function ResearchPlannerStepExplorer({ steps, icons, label, openSection }: {
  steps: typeof journeySteps;
  icons: readonly LucideIcon[];
  label: string;
  openSection?: OpenSection;
}) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const Icon = icons[current];

  return <div className="planner-step-explorer">
    <ol className="planner-step-list" aria-label={label}>
      {steps.map(({ title, phase }, index) => {
        const StepIcon = icons[index];
        return <li key={title}>
          <button type="button" aria-pressed={index === current} onClick={() => setCurrent(index)}>
            <span className="planner-step-icon"><StepIcon size={17} aria-hidden="true" /></span>
            <span><small>Step {index + 1} · {phase}</small><strong>{title}</strong></span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </li>;
      })}
    </ol>
    <article className="planner-step-detail" aria-live="polite">
      <div className="planner-step-heading">
        <span className="planner-step-icon"><Icon size={23} aria-hidden="true" /></span>
        <div><small>STEP {current + 1} OF {steps.length}</small><h3>{step.title}</h3></div>
      </div>
      <p>{step.summary}</p>
      <ul className="planner-task-list">{step.tasks.map(task => <li key={task}>{task}</li>)}</ul>
      <div className="planner-example"><strong>What it looks like</strong><p>{step.example}</p></div>
      <p className="planner-deliverable"><Check size={16} aria-hidden="true" /><span><strong>What you’ll have</strong><br />{step.output}</span></p>
      {openSection && <button type="button" className="button secondary small" onClick={() => openSection(step.action.target)}>
        {step.action.label}<ArrowRight size={15} aria-hidden="true" />
      </button>}
    </article>
  </div>;
}
