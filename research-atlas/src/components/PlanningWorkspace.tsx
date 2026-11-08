import { useId, useRef, useState } from 'react';
import { ArrowRight, Download } from 'lucide-react';
import { disciplines } from '@/lib/content';
import { sourceLinks } from '@/lib/links';
import { protocolMarkdown, type Project } from '@/lib/model';
import { methodsPrompts, studyPurposes } from '@/lib/planning-content';
import { download } from '@/lib/storage';
import { External } from './External';
import { MethodPlanner } from './StudyPlanning';
import { questionVersionLimit } from '@/lib/research-trail';
import { pathwayFor, researchPathways } from '@/lib/research-pathway';
import { TaskSteps, type InterfaceMode } from './TaskSteps';

type PlanningMode = 'profile' | 'topic' | 'question' | 'methods';

type PlanningProps = {
  project: Project;
  update: (patch: Partial<Project>) => void;
  next: () => void;
  interfaceMode?: InterfaceMode;
};

type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  multiline?: boolean;
};

function TextField({ label, value, onChange, hint, multiline }: TextFieldProps) {
  const id = useId();
  const attributes = {
    id,
    value,
    maxLength: 20_000,
    'aria-describedby': hint ? `${id}-hint` : undefined,
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {multiline ? (
        <textarea {...attributes} rows={3} onChange={event => onChange(event.target.value)} />
      ) : (
        <input {...attributes} onChange={event => onChange(event.target.value)} />
      )}
    </div>
  );
}

function SelectField<T extends string>({ label, value, choices, onChange }: {
  label: string;
  value: T;
  choices: ReadonlyArray<readonly [T, string]>;
  onChange: (value: T) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={event => onChange(event.target.value as T)}>
        {value && !choices.some(([key]) => key === value) && <option value={value}>{value}</option>}
        {choices.map(([key, name]) => <option key={key} value={key}>{name}</option>)}
      </select>
    </label>
  );
}

function Continue({ children, next }: { children: string; next: () => void }) {
  return (
    <button type="button" className="button" onClick={next}>
      {children} <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}

function Profile({ project, update, next }: PlanningProps) {
  const domains = disciplines.find(discipline => discipline.name === project.discipline)?.domains ?? [];

  return (
    <div className="content-grid">
      <section className="panel">
        <h2>Set up your project</h2>
        <p>Choose a field and goal so the workspace can show relevant examples. You can revise these choices as your project develops.</p>
        <TextField label="Project title" value={project.title} onChange={title => update({ title })} />
        <div className="two-col">
          <SelectField label="Discipline" value={project.discipline} onChange={discipline => update({ discipline })}
            choices={[[ '', 'Choose a discipline' ], ...disciplines.map(({ name }) => [name, name] as const)]} />
          <SelectField label="Research domain" value={project.domain} onChange={domain => update({ domain })}
            choices={[[ '', 'Choose a domain (optional)' ], ...domains.map(domain => [domain, domain] as const)]} />
        </div>
        <div className="two-col">
          <SelectField label="Research experience" value={project.experience} onChange={experience => update({ experience })}
            choices={[
              ['', 'Choose your experience'],
              ['Beginner', 'I’m new to research'],
              ['Some experience', 'I’ve done some research'],
              ['Experienced', 'I’m an experienced researcher'],
            ]} />
          <SelectField label="Research goal" value={project.goal} onChange={goal => update({ goal })}
            choices={[
              ['', 'Choose a goal'],
              ['Course project', 'Course project'],
              ['Thesis or dissertation', 'Thesis or dissertation'],
              ['Literature review', 'Literature review'],
              ['Publication or independent study', 'Publication or independent study'],
              ['Exploring a topic', 'Exploring a topic'],
            ]} />
        </div>
        <label className="field"><span>Research pathway</span><select aria-label="Research pathway" value={project.studyType ?? ''} onChange={event => update({ studyType: event.target.value ? event.target.value as NonNullable<Project['studyType']> : undefined })}>
          <option value="">Not decided yet</option>{Object.values(researchPathways).map(pathway => <option key={pathway.id} value={pathway.id}>{pathway.label}</option>)}
        </select></label>
        <p className="muted">This changes examples and planning prompts. You can change it later; existing answers, sources and decisions are preserved. A pathway does not choose a design or grant ethics approval.</p>
        {pathwayFor(project) && <div className="pathway-summary"><strong>{pathwayFor(project)!.label}</strong><p>{pathwayFor(project)!.description}</p></div>}
        <details>
          <summary>Optional project details</summary>
          <TextField label="Institution or department" value={project.institution} onChange={institution => update({ institution })} />
          <TextField label="Constraints" value={project.constraints} onChange={constraints => update({ constraints })}
            hint="Note your timeline, evidence access, tools, or course requirements." multiline />
        </details>
        <div className="button-row">
          <Continue next={next}>Explore topics</Continue>
        </div>
      </section>
      <aside className="panel warm">
        <h3>Choose a practical starting point</h3>
        <p>Think about what you want to produce, what sources or data you can access, and how much time you have. A working title is enough to begin.</p>
      </aside>
    </div>
  );
}

function Topic({ project, update, next }: PlanningProps) {
  const discipline = disciplines.find(item => item.name === project.discipline);

  return (
    <div className="content-grid">
      <section className="panel">
        <h2>Compare possible topics</h2>
        <p>Shortlist ideas before committing to a question. You can start with a topic you already have in mind.</p>
        <TextField label="Topic shortlist" value={project.topicIdeas} onChange={topicIdeas => update({ topicIdeas })}
          hint="Write one possible topic per line." multiline />
        <TextField label="Working topic" value={project.topic} onChange={topic => update({ topic })} />
        <TextField label="Why is this topic feasible?" value={project.topicRationale} onChange={topicRationale => update({ topicRationale })}
          hint="Record the evidence you can realistically access, the time available, and any permission you might need." multiline />
        <Continue next={next}>Draft your question</Continue>
      </section>
      <aside className="panel warm">
        <h3>Start with what you can examine</h3>
        <p>{discipline ? `Possible directions in ${discipline.name.toLowerCase()} include ${discipline.domains.join(', ')}.` : 'Pick a setting, group, material, or process you can study with the resources you have.'}</p>
        {project.constraints.trim() && <><h4>Your project constraints</h4><p>{project.constraints}</p></>}
        <details open={project.experience === 'Beginner'}>
          <summary>Try a quick feasibility check</summary>
          <ul>
            <li>What evidence would let you investigate this?</li>
            <li>Can you get it within your timeline and permissions?</li>
            <li>How could you narrow the topic if access is limited?</li>
          </ul>
        </details>
      </aside>
    </div>
  );
}

function Question({ project, update, next, interfaceMode = 'guided' }: PlanningProps) {
  const discipline = disciplines.find(item => item.name === project.discipline);
  const pathway = pathwayFor(project);
  const [draft, setDraft] = useState(project.questionDraft ?? project.question);
  const [changeReason, setChangeReason] = useState(project.questionDraftReason ?? '');
  const lastCommitted = useRef(project.question);
  const questionId = useId();
  const historyFull = (project.questionVersions?.length ?? 0) >= questionVersionLimit;
  const changed = draft.trim() !== lastCommitted.current.trim();
  const hasDraft = project.questionDraft !== undefined || project.questionDraftReason !== undefined;
  const versions = [...(project.questionVersions ?? [])].reverse();
  function commitQuestion() {
    if (historyFull || !changed) return;
    lastCommitted.current = draft;
    update({ question: draft, questionChangeReason: changeReason.trim(), questionDraft: undefined, questionDraftReason: undefined });
    setChangeReason('');
  }
  function discardDraft() {
    setDraft(project.question); setChangeReason('');
    update({ questionDraft: undefined, questionDraftReason: undefined });
  }
  return <div className={`content-grid question-composer ${interfaceMode === 'expert' ? 'focus-workspace' : ''}`}>
    <section className="panel">
      <h2>What do you want to understand?</h2>
      {project.topic.trim() && <p>Working topic <strong>{project.topic}</strong></p>}
      <p>{interfaceMode === 'expert' ? 'Edit the grouped fields directly. Commit a question version when you intentionally change its wording.' : 'Work through a small part at a time. These are planning prompts, not an assessment of whether the question is scientifically valid.'}</p>
      <TaskSteps label="Question planning steps" interfaceMode={interfaceMode} initialStep={draft.trim() ? 2 : 0} steps={[
        { id: 'problem', title: 'Problem to investigate', description: 'What is happening, and why is it worth understanding?', content: <>
          <TextField label="The problem you want to explore" value={project.problem} onChange={problem => update({ problem })} hint="Explain what is happening and why it matters." multiline />
          {interfaceMode !== 'expert' && <div className="task-example"><strong>Example starting point</strong><p>Commuter students may struggle to find a useful study space between classes. That is a problem to investigate, not yet a research conclusion.</p></div>}
        </> },
        { id: 'scope', title: 'Scope and setting', description: 'Which people, records, texts or system will your question cover?', content: <>
          <TextField label="Population, setting, or corpus" value={project.setting} onChange={setting => update({ setting })} hint="Specify the people, place, time period, texts, or data you will study." />
          {interfaceMode !== 'expert' && <div className="task-example"><strong>Make the boundary visible</strong><p>{pathway?.id === 'literature' ? 'For example, eligible published studies on commuter students, with a justified date range and database coverage.' : 'For example, commuter students at one campus during one semester. State what you can access and what falls outside your study.'}</p></div>}
        </> },
        { id: 'wording', title: 'Question wording', description: 'Ask what you could answer with evidence inside those boundaries.', content: <div className="question-version-editor">
          <label className="field" htmlFor={questionId}><span>Your research question</span></label>
          <small id={`${questionId}-hint`}>Your draft saves automatically. Only Save question revision creates a committed version; changing steps or leaving this page keeps it as a draft.</small>
          <textarea id={questionId} aria-describedby={`${questionId}-hint`} value={draft} onChange={event => { setDraft(event.target.value); update({ questionDraft: event.target.value }); }} rows={4} maxLength={20000} disabled={historyFull} />
          <label className="field"><span>Reason for this question revision (optional)</span><input value={changeReason} onChange={event => { setChangeReason(event.target.value); update({ questionDraftReason: event.target.value }); }} maxLength={2000} placeholder="For example, narrow to commuters after examining evidence access" disabled={historyFull} /></label>
          {interfaceMode !== 'expert' && <div className="task-example"><strong>Example — adapt it to your study</strong><p>{pathway?.questionExample ?? discipline?.example ?? 'How do commuter students choose study spaces at one campus?'}</p></div>}
        </div> },
        { id: 'objectives', title: 'Objectives and review', description: 'Describe the work needed to answer your question and check what is still missing.', content: <>
          <TextField label="Research objectives" value={project.objectives} onChange={objectives => update({ objectives })} hint="List the steps needed to answer your question, such as describing a pattern or comparing sources." multiline />
          <details><summary>Hypothesis, if applicable {project.hypothesis.trim() && <small>(draft recorded)</small>}</summary><TextField label="Hypothesis" value={project.hypothesis} onChange={hypothesis => update({ hypothesis })} hint="Only include a prediction if it fits your design. Not every research question needs a hypothesis." multiline /></details>
          <h4>Your recorded ingredients</h4><ul className="question-checklist">
            <li>{project.problem.trim() ? 'Problem described' : 'Problem still blank'}</li><li>{project.setting.trim() ? 'Scope described' : 'Scope still blank'}</li><li>{draft.trim() ? 'Question wording drafted' : 'Question wording still blank'}</li><li>{project.objectives.trim() ? 'Objectives recorded' : 'Objectives still blank'}</li>
          </ul><p className="muted">These checks only detect recorded text. Review feasibility and methodological fit with your supervisor.</p>
        </> },
      ]} />
      <div className="question-draft-state" role="status">{hasDraft && changed ? 'Uncommitted question draft saved locally.' : project.question ? 'Showing the committed question.' : 'No question version has been committed yet.'} {versions.length > 0 && <span>Question v{versions[0].version}</span>}</div>
      <div className="button-row"><button type="button" className="button" disabled={historyFull || !changed} onClick={commitQuestion}>Save question revision</button>{hasDraft && <button type="button" className="button secondary" onClick={discardDraft}>Discard uncommitted draft</button>}</div>
      {historyFull && <p className="info-bar">This project has reached its {questionVersionLimit}-revision history limit. The draft is preserved. Export a backup before continuing in a new project.</p>}
      <p>You can explore literature while the question is provisional. Commit the wording intentionally before treating it as your agreed study question. Exploring papers does not commit this draft.</p>
      <button type="button" className="button secondary" onClick={next}>Find supporting evidence <ArrowRight size={16} aria-hidden="true" /></button>
    </section>
    <aside>
      <section className="panel"><h3>Question versions</h3><p>Drafts are working text. Saved versions record an intentional change and its reason.</p>
        {!versions.length && <p>{project.question.trim() ? 'Your saved question predates recorded versions. Its wording is preserved; the original edit time cannot be reconstructed. An intentional wording change will capture a labelled earlier baseline.' : 'No committed version yet. Your draft remains available when you return.'}</p>}
        {versions.length > 0 && <details><summary>Review saved question versions ({versions.length})</summary><ol className="question-version-list">{versions.map(version => <li key={version.id}><strong>Version {version.version}</strong><p>{version.wording || '(Question cleared)'}</p><small><time dateTime={version.recordedAt}>{new Date(version.recordedAt).toLocaleString()}</time></small><p>Reason: {version.reason}</p>{version.origin === 'legacy-baseline' && <small>Earlier wording captured when version tracking began; the original edit time is unknown.</small>}</li>)}</ol></details>}
      </section>
      <section className="panel warm"><details open={interfaceMode !== 'expert'}><summary>Question framing help</summary><p>A topic names an area. A question says what you want to find out, which evidence could answer it, and where your study ends.</p>{pathway && <p><strong>{pathway.label}:</strong> {pathway.evidenceExample}</p>}<External href={sourceLinks.researchPerspectives}>Research perspectives</External></details></section>
    </aside>
  </div>;
}

function Methods({ project, update, next, interfaceMode = 'guided' }: PlanningProps) {
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
          <div className="two-col"><SelectField label="What are you trying to do?" value={project.purpose} choices={studyPurposes} onChange={purpose => update({ purpose })} />
            <SelectField label="Data source" value={project.data} choices={[[ 'existing', 'Existing data / literature' ], [ 'new', 'New data collection' ]]} onChange={data => update({ data })} /></div>
          {pathway?.id === 'literature' && project.data === 'new' && <p className="info-bar">Your literature-based pathway and new-data choice may describe different work. Review them together; Atlas has preserved both choices.</p>}
          {(project.goal === 'Literature review' || pathway?.id === 'literature') && project.purpose !== 'synthesize' && <p className="info-bar">If your aim is to synthesize studies, choose Synthesize existing studies. A different literary or documentary analysis may need another justified objective.</p>}
          <MethodPlanner project={project} update={update} interfaceMode={interfaceMode} />
        </> },
        { id: 'design', title: 'Design and procedures', description: 'Write your own design justification. A suggested approach is only a starting point.', content: <>
          <TextField label="Chosen design and justification" value={project.design} onChange={design => update({ design })} hint="Explain how the design answers your question and works within your constraints." multiline />
          <TextField label="Sampling and selection" value={project.sampling} onChange={sampling => update({ sampling })} hint={prompts.sampling} multiline />
          <TextField label="Instruments and procedures" value={project.instruments} onChange={instruments => update({ instruments })} hint={prompts.instruments} multiline />
          {interfaceMode !== 'expert' && <div className="task-example"><strong>What this step produces</strong><p>A traceable explanation of which evidence you selected, how you worked with it, and why those decisions can answer the question.</p></div>}
        </> },
        { id: 'ethics', title: 'Ethics and analysis', description: 'Record permissions and the plan for analysis before activities that require approval.', content: <>
          <SelectField label="Ethics review status" value={project.ethicsStatus} onChange={ethicsStatus => update({ ethicsStatus })} choices={[[ '', 'Not assessed' ], ['Needs consultation', 'Needs consultation'], ['Review required', 'Review required'], ['Submitted', 'Submitted'], ['Approval documented', 'Approval documented'], ['Exemption documented', 'Exemption documented']]} />
          <TextField label="Ethics, consent, and institutional review" value={project.ethics} onChange={ethics => update({ ethics })} hint={pathway?.ethicsPrompt ?? 'Record risks, consent and privacy measures, access permissions, and decisions from the relevant reviewer.'} multiline />
          <TextField label="Analysis and reproducibility plan" value={project.analysis} onChange={analysis => update({ analysis })} hint={prompts.analysis} multiline />
          <p className="muted">The status is your record of an institutional decision. Atlas cannot approve or exempt a study.</p>
        </> },
      ]} />
      <div className="button-row"><Continue next={next}>Plan data and analysis</Continue><button type="button" className="button secondary" onClick={() => download('research-protocol.md', protocolMarkdown(project), 'text/markdown')}><Download size={16} aria-hidden="true" /> Export protocol</button></div>
    </section>
    <aside className="panel warm"><details open={interfaceMode !== 'expert'}><summary>Review question and design together</summary>{project.question.trim() ? <blockquote>{project.question}</blockquote> : <p>Your question is still provisional. You can plan and explore, then commit the wording intentionally.</p>}<p>If you change the objective or pathway, reassess whether the design and analysis still fit. Earlier notes remain available.</p><p>Confirm review and access requirements with the relevant institution before activities that need approval.</p></details></aside>
  </div>;
}

export function PlanningWorkspace({ mode, ...props }: PlanningProps & { mode: PlanningMode }) {
  switch (mode) {
    case 'profile': return <Profile {...props} />;
    case 'topic': return <Topic {...props} />;
    case 'question': return <Question {...props} />;
    case 'methods': return <Methods {...props} />;
  }
}
