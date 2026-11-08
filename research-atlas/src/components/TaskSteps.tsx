import { useId, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import './task-steps.css';

export type InterfaceMode = 'guided' | 'expert';
export type TaskStep = { id: string; title: string; description?: string; content: ReactNode };

/** Presentation only: project answers remain owned by the caller. */
export function TaskSteps({ label, steps, interfaceMode = 'guided', initialStep = 0 }: {
  label: string; steps: TaskStep[]; interfaceMode?: InterfaceMode; initialStep?: number;
}) {
  const [selected, setSelected] = useState(initialStep);
  const active = Math.max(0, Math.min(selected, steps.length - 1));
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const guided = interfaceMode !== 'expert';
  function go(index: number) {
    setSelected(index);
    requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
  }
  return <div className={`task-sequence ${guided ? 'guided' : 'focus'}`}>
    {guided && <>
      <p className="task-step-count">Step {active + 1} of {steps.length} · Your answers save as you work. You can visit any step.</p>
      <nav className="task-step-nav" aria-label={label}>{steps.map((step, index) => <button type="button" key={step.id} aria-current={index === active ? 'step' : undefined} onClick={() => go(index)}><span aria-hidden="true">{index + 1}</span>{step.title}</button>)}</nav>
    </>}
    <div className="task-step-panels">{steps.map((step, index) => <section key={step.id} hidden={guided && index !== active} className="task-step-panel" aria-labelledby={`${id}-${step.id}`}>
      <h3 ref={index === active ? heading : undefined} tabIndex={-1} id={`${id}-${step.id}`}>{step.title}</h3>
      {guided && step.description && <p>{step.description}</p>}
      {step.content}
    </section>)}</div>
    {guided && steps.length > 1 && <div className="button-row task-step-actions"><button type="button" className="button secondary" disabled={active === 0} onClick={() => go(active - 1)}><ArrowLeft size={15} aria-hidden="true" /> Previous step</button><button type="button" className="button secondary" disabled={active === steps.length - 1} onClick={() => go(active + 1)}>Next step <ArrowRight size={15} aria-hidden="true" /></button></div>}
  </div>;
}
