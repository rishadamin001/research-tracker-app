import { type ResearchPlan, submissionChecks } from '@/lib/research-plan';
import { External } from '@/components/shared/External';
import type { ToolProps } from './PlannerWorkbenchTypes';

export function PlannerVenue({ plan, patch }: ToolProps) {
  return <section className="panel planner-tool" aria-labelledby="plan-venue">
    <h3 id="plan-venue">Check the venue and its rules</h3>
    <p>Copy the requirements from the venue’s current author instructions. If a journal or conference changes, recheck the rules before submitting.</p>
    <div className="planner-fields">
      <label className="field"><span>Target venue</span><input value={plan.venue} maxLength={300} onChange={event => patch({ venue: event.target.value })} /></label>
      <label className="field"><span>Venue type</span><select value={plan.venueType} onChange={event => patch({ venueType: event.target.value as ResearchPlan['venueType'] })}>
        <option value="undecided">Still deciding</option><option value="journal">Journal</option><option value="conference">Conference</option>
      </select></label>
      <label className="field"><span>Manuscript word or page limit</span><input value={plan.requirements.manuscript} maxLength={120} placeholder="Example: 8 pages including figures" onChange={event => patch({ requirements: { ...plan.requirements, manuscript: event.target.value } })} /></label>
      <label className="field"><span>Abstract word limit and structure</span><input value={plan.requirements.abstract} maxLength={120} placeholder="Example: 250 words, structured" onChange={event => patch({ requirements: { ...plan.requirements, abstract: event.target.value } })} /></label>
    </div>
    <label className="field"><span>Figure and table specifications</span><textarea value={plan.requirements.figures} maxLength={4000} rows={2} placeholder="Record required file types, resolution, captions and table format. Check that color is backed up by symbols or labels." onChange={event => patch({ requirements: { ...plan.requirements, figures: event.target.value } })} /></label>
    <fieldset className="planner-checks">
      <legend>Preflight checklist</legend>
      <p role="status">{plan.checks.length} of {submissionChecks.length} checks recorded</p>
      {submissionChecks.map(item => <label key={item.id} className="checkbox">
        <input type="checkbox" checked={plan.checks.includes(item.id)} onChange={event => patch({ checks: event.target.checked ? [...plan.checks, item.id] : plan.checks.filter(id => id !== item.id) })} />
        <span>{item.name}</span>
      </label>)}
    </fieldset>
    <div className="button-row">
      <External href="https://thinkchecksubmit.org/journals/">Think. Check. Submit.</External>
      <External href="https://thinkcheckattend.org/check/">Think. Check. Attend.</External>
      <External href="https://www.equator-network.org/">Reporting checklists</External>
    </div>
  </section>;
}
