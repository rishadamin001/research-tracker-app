import { Download } from 'lucide-react';
import { protocolMarkdown } from '@/lib/model';
import { methodsPrompts, studyPurposes } from '@/lib/planning-content';
import { download } from '@/lib/storage';
import { MethodPlanner } from './StudyPlanning';
import { pathwayFor } from '@/lib/research-pathway';
import { TaskSteps } from '@/components/shared/TaskSteps';
import type { PlanningProps } from './PlanningWorkspaceTypes';
import { PlanningSelectField } from './PlanningSelectField';
import { PlanningTextField } from './PlanningTextField';
import { PlanningContinue } from './PlanningContinue';

export function ResearchMethodsForm({ project, update, next, interfaceMode = 'guided' }: PlanningProps) {
  const purposePrompts = methodsPrompts(project.purpose);
  const pathway = pathwayFor(project);
  const prompts = {
    sampling: pathway?.samplingPrompt ?? (project.data === 'existing' && project.purpose === 'explore' ? 'Define which records, sources or cases you can access, why they fit the question, and how you will select them.' : purposePrompts.sampling),
    instruments: pathway?.proceduresPrompt ?? (project.data === 'existing' && project.purpose === 'explore' ? 'Describe source collection, preparation and interpretation. Participant recruitment is relevant only if your study actually involves it.' : purposePrompts.instruments),
    analysis: pathway?.analysisPrompt ?? purposePrompts.analysis,
  };
  return <div className={`content-grid ${interfaceMode === 'expert' ? 'focus-workspace' : ''}`}>
    <section className="panel">
      <h2>Plan the study and its ethics review</h2>
      <p>{interfaceMode === 'expert' ? 'Use the grouped context, design and review fields directly. Optional guidance remains available.' : 'First check evidence and feasibility, then document the design and the approvals it needs.'}</p>
      {pathway && <div className="pathway-summary"><strong>{pathway.label} pathway</strong><p>{pathway.description}</p><small>Prompts adapt to this choice. Earlier answers are preserved when it changes.</small></div>}
      <TaskSteps label="Study planning steps" interfaceMode={interfaceMode} steps={[
        { id: 'context', title: 'Evidence and feasibility', description: 'Explain what you want to learn and what evidence you can actually use.', content: <>
          <div className="two-col"><PlanningSelectField label="What are you trying to do?" value={project.purpose} choices={studyPurposes} onChange={purpose => update({ purpose })} />
            <PlanningSelectField label="Data source" value={project.data} choices={[[ 'existing', 'Existing data / literature' ], [ 'new', 'New data collection' ]]} onChange={data => update({ data })} /></div>
          {pathway?.id === 'literature' && project.data === 'new' && <p className="info-bar">Your literature-based pathway and new-data choice may describe different work. Review them together; Atlas has preserved both choices.</p>}
          {(project.goal === 'Literature review' || pathway?.id === 'literature') && project.purpose !== 'synthesize' && <p className="info-bar">If your aim is to synthesize studies, choose Synthesize existing studies. A different literary or documentary analysis may need another justified objective.</p>}
          <MethodPlanner project={project} update={update} interfaceMode={interfaceMode} />
        </> },
        { id: 'design', title: 'Design and procedures', description: 'Write your own design justification. A suggested approach is only a starting point.', content: <>
          <PlanningTextField label="Chosen design and justification" value={project.design} onChange={design => update({ design })} hint="Explain how the design answers your question and works within your constraints." multiline />
          <PlanningTextField label="Sampling and selection" value={project.sampling} onChange={sampling => update({ sampling })} hint={prompts.sampling} multiline />
          <PlanningTextField label="Instruments and procedures" value={project.instruments} onChange={instruments => update({ instruments })} hint={prompts.instruments} multiline />
          {interfaceMode !== 'expert' && <div className="task-example"><strong>What this step produces</strong><p>A traceable explanation of which evidence you selected, how you worked with it, and why those decisions can answer the question.</p></div>}
        </> },
        { id: 'ethics', title: 'Ethics and analysis', description: 'Record permissions and the plan for analysis before activities that require approval.', content: <>
          <PlanningSelectField label="Ethics review status" value={project.ethicsStatus} onChange={ethicsStatus => update({ ethicsStatus })} choices={[[ '', 'Not assessed' ], ['Needs consultation', 'Needs consultation'], ['Review required', 'Review required'], ['Submitted', 'Submitted'], ['Approval documented', 'Approval documented'], ['Exemption documented', 'Exemption documented']]} />
          <PlanningTextField label="Ethics, consent, and institutional review" value={project.ethics} onChange={ethics => update({ ethics })} hint={pathway?.ethicsPrompt ?? 'Record risks, consent and privacy measures, access permissions, and decisions from the relevant reviewer.'} multiline />
          <PlanningTextField label="Analysis and reproducibility plan" value={project.analysis} onChange={analysis => update({ analysis })} hint={prompts.analysis} multiline />
          <p className="muted">The status is your record of an institutional decision. Atlas cannot approve or exempt a study.</p>
        </> },
      ]} />
      <div className="button-row"><PlanningContinue next={next}>Plan data and analysis</PlanningContinue><button type="button" className="button secondary" onClick={() => download('research-protocol.md', protocolMarkdown(project), 'text/markdown')}><Download size={16} aria-hidden="true" /> Export protocol</button></div>
    </section>
    <aside className="panel warm"><details open={interfaceMode !== 'expert'}><summary>Review question and design together</summary>{project.question.trim() ? <blockquote>{project.question}</blockquote> : <p>Your question is still provisional. You can plan and explore, then commit the wording intentionally.</p>}<p>If you change the objective or pathway, reassess whether the design and analysis still fit. Earlier notes remain available.</p><p>Confirm review and access requirements with the relevant institution before activities that need approval.</p></details></aside>
  </div>;
}
