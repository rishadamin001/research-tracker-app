import { useState } from 'react';
import { CalendarDays, Coins, ClipboardCheck, FileText, MessageSquare, FolderOpen } from 'lucide-react';
import type { Project } from '@/lib/model';
import type { ToolProps } from './PlannerWorkbenchTypes';
import { PlannerTimeline } from './PlannerTimeline';
import { PlannerBudget } from './PlannerBudget';
import { PlannerVenue } from './PlannerVenue';
import { PlannerSubmission } from './PlannerSubmission';
import { PlannerReview } from './PlannerReview';
import './planner-workbench.css';

const tools = [
  { id: 'timeline', label: 'Timeline', icon: CalendarDays },
  { id: 'budget', label: 'Budget', icon: Coins },
  { id: 'venue', label: 'Venue checks', icon: ClipboardCheck },
  { id: 'submission', label: 'Submission pack', icon: FileText },
  { id: 'review', label: 'Reviewer replies', icon: MessageSquare },
] as const;

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
    <div className="button-row"><button type="button" className="button" disabled={!ready} aria-haspopup="dialog" onClick={onStart}>Create a project</button><button type="button" className="button secondary" onClick={onProjects}>Open My projects</button></div>
  </section>;

  const plan = project.researchPlan;
  const props: ToolProps = { plan, patch: values => update({ researchPlan: { ...plan, ...values } }) };
  return <div className="planner-workbench">
    <div className="planner-workbench-intro"><span className="eyebrow">PROJECT PLAN</span><h2>{project.title}</h2><p>Plan details are saved with this project and travel with its backup.</p></div>
    <div className="planner-tool-nav" role="group" aria-label="Project planning tools">
      {tools.map(({ id, label, icon: Icon }) => <button key={id} className="button secondary small" type="button" aria-pressed={id === tool} onClick={() => setTool(id)}><Icon size={16} aria-hidden="true" />{label}</button>)}
    </div>
    {tool === 'timeline' && <PlannerTimeline {...props} />}
    {tool === 'budget' && <PlannerBudget {...props} />}
    {tool === 'venue' && <PlannerVenue {...props} />}
    {tool === 'submission' && <PlannerSubmission {...props} title={project.title} />}
    {tool === 'review' && <PlannerReview {...props} />}
  </div>;
}
