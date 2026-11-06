import { useId } from 'react';
import { ArrowRight, Check, Download } from 'lucide-react';
import { disciplines, routeDesign } from '@/lib/content';
import { sourceLinks } from '@/lib/links';
import { protocolMarkdown, type Project } from '@/lib/model';
import { exampleTopics, methodsPrompts, studyPurposes } from '@/lib/planning-content';
import { download } from '@/lib/storage';
import { External } from './External';

type PlanningMode = 'profile' | 'topic' | 'question' | 'methods';

type PlanningProps = {
  project: Project;
  update: (patch: Partial<Project>) => void;
  next: () => void;
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

function Question({ project, update, next }: PlanningProps) {
  const discipline = disciplines.find(item => item.name === project.discipline);

  return (
    <div className="content-grid">
      <section className="panel">
        <h2>What do you want to understand?</h2>
        {project.topic.trim() && <p>Working topic <strong>{project.topic}</strong></p>}
        <TextField label="The problem you want to explore" value={project.problem} onChange={problem => update({ problem })}
          hint="Explain what is happening and why it matters." multiline />
        <TextField label="Population, setting, or corpus" value={project.setting} onChange={setting => update({ setting })}
          hint="Specify the people, place, time period, texts, or data you will study." />
        <TextField label="Your research question" value={project.question} onChange={question => update({ question })}
          hint="Ask something you can answer with evidence within those boundaries." multiline />
        <TextField label="Research objectives" value={project.objectives} onChange={objectives => update({ objectives })}
          hint="List the steps needed to answer your question, such as describing a pattern or comparing two sources." multiline />
        <details>
          <summary>Hypothesis, if applicable {project.hypothesis.trim() && <small>(draft recorded)</small>}</summary>
          <TextField label="Hypothesis" value={project.hypothesis} onChange={hypothesis => update({ hypothesis })}
            hint="If your design tests a prediction, describe what outcome you expect and under what conditions." multiline />
        </details>
        <div className="button-row">
          <Continue next={next}>Find supporting evidence</Continue>
        </div>
      </section>
      <aside className="panel warm">
        <h3>Turn a broad topic into a question</h3>
        <p>A topic names the area you want to study. A research question says exactly what you want to find out and gives you a way to judge which evidence matters.</p>
        {discipline && (
          <dl>
            <dt>Example topic</dt>
            <dd>{exampleTopics[discipline.name] ?? discipline.domains[0]}</dd>
            <dt>Example question</dt>
            <dd>{discipline.example}</dd>
          </dl>
        )}
        <details open={project.experience === 'Beginner'}>
          <summary>Review your draft</summary>
          <p>Can a reader tell what you will study, what you want to find out, and which evidence could answer it?</p>
        </details>
        <External href={sourceLinks.researchPerspectives}>Research perspectives</External>
      </aside>
    </div>
  );
}

function Methods({ project, update, next }: PlanningProps) {
  const suggestion = routeDesign(project.purpose, project.discipline);
  const prompts = methodsPrompts(project.purpose);

  return (
    <div className="content-grid">
      <section className="panel">
        <h2>Plan the study and its ethics review</h2>
        <p>Start with your research objective, then document your design, procedures, and approvals.</p>
        <div className="two-col">
          <SelectField label="What are you trying to do?" value={project.purpose} choices={studyPurposes}
            onChange={purpose => update({ purpose })} />
          <SelectField label="Data source" value={project.data} choices={[
            ['existing', 'Existing data / literature'], ['new', 'New data collection'],
          ]} onChange={data => update({ data })} />
        </div>
        {project.goal === 'Literature review' && project.purpose !== 'synthesize' && (
          <p className="info-bar">For your literature review goal, select <strong>Synthesize existing studies</strong> to see review-specific prompts.</p>
        )}
        {suggestion && (
          <div className="recommendation">
            <span className="tag">POSSIBLE APPROACH</span>
            <h3>{suggestion.design}</h3>
            <p>{suggestion.why}</p>
            <p>{suggestion.standard}</p>
            <External href={suggestion.url}>Check guidance and applicability</External>
            {!project.design.trim() && (
              <button type="button" className="button secondary" onClick={() => update({ design: suggestion.design })}>
                Use as a starting point <Check size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <TextField label="Chosen design and justification" value={project.design} onChange={design => update({ design })}
          hint="Explain how the design answers your question and works within your constraints." multiline />
        <TextField label="Sampling and selection" value={project.sampling} onChange={sampling => update({ sampling })}
          hint={prompts.sampling} multiline />
        <TextField label="Instruments and procedures" value={project.instruments} onChange={instruments => update({ instruments })}
          hint={prompts.instruments} multiline />
        <SelectField label="Ethics review status" value={project.ethicsStatus} onChange={ethicsStatus => update({ ethicsStatus })}
          choices={[
            ['', 'Not assessed'],
            ['Needs consultation', 'Needs consultation'],
            ['Review required', 'Review required'],
            ['Submitted', 'Submitted'],
            ['Approval documented', 'Approval documented'],
            ['Exemption documented', 'Exemption documented'],
          ]} />
        <TextField label="Ethics, consent, and institutional review" value={project.ethics} onChange={ethics => update({ ethics })}
          hint="Record risks, consent and privacy measures, access permissions, and decisions from the relevant reviewer." multiline />
        <TextField label="Analysis and reproducibility plan" value={project.analysis} onChange={analysis => update({ analysis })}
          hint={prompts.analysis} multiline />
        <div className="button-row">
          <Continue next={next}>Plan data and analysis</Continue>
          <button type="button" className="button secondary"
            onClick={() => download('research-protocol.md', protocolMarkdown(project), 'text/markdown')}>
            <Download size={16} aria-hidden="true" /> Export protocol
          </button>
        </div>
      </section>
      <aside className="panel warm">
        <h3>Check your plan before collecting data</h3>
        {project.question.trim() && <blockquote>{project.question}</blockquote>}
        <p>Review the question and design together. If you changed the objective, check whether your existing design and analysis plan still apply.</p>
        <p>Confirm ethics requirements with the relevant institution and record its decision here before beginning activities that require review.</p>
      </aside>
    </div>
  );
}

export function PlanningWorkspace({ mode, ...props }: PlanningProps & { mode: PlanningMode }) {
  switch (mode) {
    case 'profile': return <Profile {...props} />;
    case 'topic': return <Topic {...props} />;
    case 'question': return <Question {...props} />;
    case 'methods': return <Methods {...props} />;
  }
}
