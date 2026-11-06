import { useState } from 'react';
import { ArrowDownToLine, CalendarDays, ClipboardCheck, Coins, FileText, FolderOpen, MessageSquare, Plus } from 'lucide-react';
import { csvCell, type Project } from '@/lib/model';
import { budgetCurrencies, budgetItems, planMilestones, submissionChecks, submissionDraft, submissionFields, type ResearchPlan } from '@/lib/research-plan';
import { download } from '@/lib/storage';
import { External } from './External';
import './planner-workbench.css';

const tools = [
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'budget', label: 'Budget', icon: Coins },
  { id: 'venue', label: 'Venue checks', icon: ClipboardCheck },
  { id: 'submission', label: 'Submission pack', icon: FileText },
  { id: 'review', label: 'Reviewer replies', icon: MessageSquare },
] as const;

type ToolProps = { plan: ResearchPlan; patch: (values: Partial<ResearchPlan>) => void };

function Timeline({ plan, patch }: ToolProps) {
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

function Budget({ plan, patch }: ToolProps) {
  const entered = Object.values(plan.budget).filter(amount => amount !== undefined);
  const total = entered.reduce((sum, amount) => sum + Math.round(amount * 100), 0) / 100;
  const displayTotal = new Intl.NumberFormat(undefined, { style: 'currency', currency: plan.currency, currencyDisplay: 'code' }).format(total);
  return <section className="panel planner-tool" aria-labelledby="plan-budget">
    <h3 id="plan-budget">Price the project before you commit</h3>
    <p>Reading access, publishing and conference costs are separate. Check the library, the publisher’s routes and waivers, and the organizer’s registration terms before setting your estimates.</p>
    <label className="field planner-currency"><span>Budget currency</span><select value={plan.currency} onChange={event => patch({ currency: event.target.value as ResearchPlan['currency'] })}>
      {budgetCurrencies.map(currency => <option key={currency}>{currency}</option>)}
    </select></label>
    <p className="muted">Use one currency for all entries. Convert existing figures yourself if you change currency. Enter 0 for a confirmed zero cost and leave unpriced items blank.</p>
    <div className="planner-fields">
      {budgetItems.map(item => <label className="field" key={item.id}><span>{item.name}</span><input type="number" min={0} max={1_000_000_000} step="0.01" value={plan.budget[item.id] ?? ''} onChange={event => {
        if (!event.target.validity.valid) return;
        const budget = { ...plan.budget };
        if (event.target.value === '') delete budget[item.id];
        else budget[item.id] = event.target.valueAsNumber;
        patch({ budget });
      }} placeholder="Unpriced" /></label>)}
    </div>
    <p className="planner-total" role="status"><strong>{entered.length ? displayTotal : 'No estimates yet'}</strong> <span>{entered.length ? `Estimated total for ${entered.length} of ${budgetItems.length} entries` : 'Enter a cost to see the running total'}</span></p>
  </section>;
}

function Venue({ plan, patch }: ToolProps) {
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

function Submission({ title, plan, patch }: ToolProps & { title: string }) {
  return <section className="panel planner-tool" aria-labelledby="plan-submission">
    <div className="section-heading"><h3 id="plan-submission">Prepare the submission pack</h3><button type="button" className="button secondary" onClick={() => download('submission-pack.md', submissionDraft(title, plan), 'text/markdown;charset=utf-8')}><ArrowDownToLine size={16} aria-hidden="true" /> Download pack</button></div>
    <p>Use these templates as drafts. Fill in the details with your co-authors and check the target’s instructions. Blank items export with their starting templates.</p>
    <div className="planner-fields">
      {submissionFields.map(item => <label key={item.id} className="field"><span>{item.name}</span><small>{item.hint}</small><textarea maxLength={4000} rows={4} value={plan.submission[item.id] ?? ''} onChange={event => patch({ submission: { ...plan.submission, [item.id]: event.target.value } })} /></label>)}
    </div>
    <div className="button-row"><External href="https://credit.niso.org/contributor-roles-defined/">CRediT contributor roles</External><External href="https://www.icmje.org/recommendations/">ICMJE authorship and disclosure guidance</External></div>
  </section>;
}

function Review({ plan, patch }: ToolProps) {
  const rows = plan.reviewerResponses;
  const headings = ['Reviewer comment', 'Reply or action taken', 'Page, line or section'];

  function exportReplies() {
    const csv = [headings, ...rows.map(row => [row.comment, row.response, row.location])].map(row => row.map(csvCell).join(',')).join('\r\n');
    download('reviewer-responses.csv', csv, 'text/csv;charset=utf-8');
  }

  return <section className="panel planner-tool" aria-labelledby="plan-replies">
    <div className="section-heading"><h3 id="plan-replies">Reply to reviewers point by point</h3><button type="button" className="button secondary" disabled={!rows.length} onClick={exportReplies}><ArrowDownToLine size={16} aria-hidden="true" /> Export replies</button></div>
    <p>Use one row per comment. Explain what changed and give a page, line or section. If you disagree or a request is infeasible, explain the evidence or constraint courteously.</p>
    {!rows.length && <p className="muted">Add your first comment when the decision arrives.</p>}
    {rows.map((row, index) => <fieldset className="planner-response" key={row.id}>
      <legend>Comment {index + 1}</legend>
      <div className="planner-fields">
        <label className="field"><span>{headings[0]}</span><textarea rows={3} maxLength={4000} value={row.comment} onChange={event => patch({ reviewerResponses: rows.map(item => item.id === row.id ? { ...item, comment: event.target.value } : item) })} /></label>
        <label className="field"><span>{headings[1]}</span><textarea rows={3} maxLength={4000} value={row.response} onChange={event => patch({ reviewerResponses: rows.map(item => item.id === row.id ? { ...item, response: event.target.value } : item) })} /></label>
      </div>
      <label className="field"><span>{headings[2]}</span><input maxLength={300} value={row.location} onChange={event => patch({ reviewerResponses: rows.map(item => item.id === row.id ? { ...item, location: event.target.value } : item) })} /></label>
      <button type="button" className="text-button danger" onClick={() => {
        if (!(row.comment || row.response || row.location) || window.confirm(`Remove reviewer comment ${index + 1} and your draft reply?`)) patch({ reviewerResponses: rows.filter(item => item.id !== row.id) });
      }}>Remove comment {index + 1}</button>
    </fieldset>)}
    {rows.length < 40 ? <button type="button" className="button secondary" onClick={() => patch({ reviewerResponses: [...rows, { id: crypto.randomUUID(), comment: '', response: '', location: '' }] })}><Plus size={16} aria-hidden="true" /> Add reviewer comment</button> : <p className="muted">This plan holds up to 40 comments. Export your replies to continue in a spreadsheet.</p>}
  </section>;
}

export function PlannerWorkbench({ project, update, onStart, onProjects, ready }: {
  project?: Project;
  update: (patch: Partial<Project>) => void;
  onStart: () => void;
  onProjects: () => void;
  ready: boolean;
}) {
  const [tool, setTool] = useState<typeof tools[number]['id']>('timeline');
  if (!project) return <section className="panel planner-empty">
    <FolderOpen size={26} aria-hidden="true" /><h3>Start a plan you can save</h3>
    <p>Pick an existing project or create one to save a timeline, budget, submission documents and reviewer replies.</p>
    <div className="button-row"><button type="button" className="button" disabled={!ready} onClick={onStart}>Create a project</button><button type="button" className="button secondary" onClick={onProjects}>Open My projects</button></div>
  </section>;

  const plan = project.researchPlan;
  const props: ToolProps = { plan, patch: values => update({ researchPlan: { ...plan, ...values } }) };
  return <div className="planner-workbench">
    <div className="planner-workbench-intro"><span className="eyebrow">PROJECT PLAN</span><h2>{project.title}</h2><p>Plan details are saved with this project and travel with its backup.</p></div>
    <div className="planner-tool-nav" role="group" aria-label="Project planning tools">
      {tools.map(({ id, label, icon: Icon }) => <button key={id} className="button secondary small" type="button" aria-pressed={id === tool} onClick={() => setTool(id)}><Icon size={16} aria-hidden="true" />{label}</button>)}
    </div>
    {tool === 'timeline' && <Timeline {...props} />}
    {tool === 'budget' && <Budget {...props} />}
    {tool === 'venue' && <Venue {...props} />}
    {tool === 'submission' && <Submission {...props} title={project.title} />}
    {tool === 'review' && <Review {...props} />}
  </div>;
}
