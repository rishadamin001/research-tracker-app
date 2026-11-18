import { planMilestones } from '@/lib/research-plan';
import type { ToolProps } from './PlannerWorkbenchTypes';

export function PlannerTimeline({ plan, patch }: ToolProps) {
  const milestones = planMilestones(plan);
  return <section className="panel planner-tool" aria-labelledby="plan-timeline">
    <h3 id="plan-timeline">Work backward from submission</h3>
    <p>Start with the date listed by the organizer or editor. The suggested lead times are editable and include space for feedback and final checks.</p>
    <div className="planner-fields three">
      <label className="field"><span>Submission deadline</span><input type="date" min="1900-01-01" max="2200-12-31" value={plan.deadline} onChange={event => {
        if (event.target.validity.valid) patch({ deadline: event.target.value });
      }} /></label>
      <label className="field"><span>Venue’s deadline time</span><input type="time" value={plan.deadlineTime} onChange={event => patch({ deadlineTime: event.target.value })} /></label>
      <label className="field"><span>Venue’s time zone</span><input value={plan.deadlineZone} maxLength={80} placeholder="Example: AoE (UTC−12)" onChange={event => patch({ deadlineZone: event.target.value })} /></label>
    </div>
    <p className="muted">Milestones use calendar dates in the venue’s time zone. Check the submission portal for the exact cutoff and your local equivalent.</p>
    <ol className="planner-milestones">
      {milestones.map(item => <li key={item.id}>
        <span><strong>{item.name}</strong>{item.date && <time dateTime={item.date}>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(item.date))}</time>}</span>
        <label className="field"><span>Days before deadline</span><input aria-label={`${item.name} days before deadline`} type="number" min={0} max={3650} step={1} placeholder={String(item.days)} value={plan.offsets[item.id] ?? ''} onChange={event => {
          if (!event.target.validity.valid) return;
          const offsets = { ...plan.offsets };
          if (event.target.value === '') delete offsets[item.id];
          else offsets[item.id] = event.target.valueAsNumber;
          patch({ offsets });
        }} /></label>
      </li>)}
      <li className="planner-deadline"><span><strong>Submit to the venue</strong>{plan.deadline && <time dateTime={plan.deadline}>{plan.deadline}{plan.deadlineTime && ` · ${plan.deadlineTime}`}{plan.deadlineZone && ` ${plan.deadlineZone}`}</time>}</span></li>
    </ol>
  </section>;
}
