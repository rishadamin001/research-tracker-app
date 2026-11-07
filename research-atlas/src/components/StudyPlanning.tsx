import { Download, ClipboardList, Route, Database, BookOpen, ShieldCheck } from 'lucide-react';
import type { Project } from '../lib/model';
import { protocolMarkdown } from '../lib/model';
import { download } from '../lib/storage';
import {
  appraisalGuidance, dmpFields, dmpMarkdown, guidanceRegistryVersion, methodContextSchema,
  reportingGuidance, routeMethods, structuredDmpSchema, studyDesignGuidance, type MethodContext,
} from '../lib/study-planning';
import { External } from './External';
import './study-planning.css';

type Props = { project: Project; update: (patch: Partial<Project>) => void };

function ContextChoice({ label, value, options, onChange }: {
  label: string; value: string; options: readonly (readonly [string, string])[]; onChange: (value: string) => void;
}) {
  return <label className="field"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)}>
    <option value="">Choose a response</option>
    {options.map(([id, text]) => <option key={id} value={id}>{text}</option>)}
  </select></label>;
}

export function MethodPlanner({ project, update }: Props) {
  const context = project.methodContext ?? methodContextSchema.parse({});
  const result = routeMethods(context);
  function change(patch: Partial<MethodContext>) { update({ methodContext: { ...context, ...patch } }); }
  return <div className="study-planning">
    <div className="study-map" aria-label="How design planning works">
      <span><ClipboardList size={18} aria-hidden="true" /> Your question</span><span aria-hidden="true">→</span>
      <span><Database size={18} aria-hidden="true" /> Evidence & feasibility</span><span aria-hidden="true">→</span>
      <span><Route size={18} aria-hidden="true" /> Conditional designs</span>
    </div>
    <h3>Find a design that fits your question</h3>
    <p>A topic alone cannot choose your method. Answer these short feasibility questions to see approaches and the conditions they depend on. Your answers stay in this project.</p>
    <details>
      <summary>Work through the design questions</summary>
      <div className="two-col">
        <ContextChoice label="Knowledge goal" value={context.goal} options={[
          ['explore', 'Explore an unfamiliar topic'], ['describe', 'Describe a pattern'], ['compare', 'Compare groups or cases'],
          ['understand', 'Understand an experience'], ['relationship', 'Study a relationship'], ['evaluate', 'Evaluate an intervention'],
          ['design', 'Build and evaluate an artifact'], ['review', 'Review existing evidence'], ['predict', 'Predict an outcome'], ['uncertain', 'Not sure yet'],
        ]} onChange={value => change({ goal: value as MethodContext['goal'] })} />
        <label className="field"><span>Unit of analysis</span><input maxLength={20000} value={context.unit} onChange={event => change({ unit: event.target.value })} placeholder="People, organizations, documents, samples…" /></label>
        <ContextChoice label="Evidence access" value={context.evidence} options={[
          ['existing', 'Accessible existing sources or data'], ['new', 'Feasible new data collection'], ['both', 'Both existing and new'], ['unavailable', 'No accessible evidence yet'], ['unknown', 'Not assessed'],
        ]} onChange={value => change({ evidence: value as MethodContext['evidence'] })} />
        <ContextChoice label="Measurement or interpretation" value={context.measurement} options={[
          ['numbers', 'Numeric measurements'], ['text', 'Experiences or meaning'], ['documents', 'Documents or a corpus'], ['mixed', 'Numeric and interpretive evidence'], ['unknown', 'Not decided'],
        ]} onChange={value => change({ measurement: value as MethodContext['measurement'] })} />
        <ContextChoice label="Do you intend to claim cause and effect?" value={context.causalIntent} options={[
          ['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure'],
        ]} onChange={value => change({ causalIntent: value as MethodContext['causalIntent'] })} />
        <ContextChoice label="Can you assign an intervention or controlled comparison?" value={context.intervention} options={[
          ['yes', 'Potentially feasible'], ['no', 'Not feasible'], ['not-applicable', 'Not applicable to this question'], ['unknown', 'Not assessed'],
        ]} onChange={value => change({ intervention: value as MethodContext['intervention'] })} />
        <ContextChoice label="Ethics and access assessment" value={context.ethics} options={[
          ['documented', 'Requirements or exemption documented'], ['consultation', 'Consultation or approval still needed'], ['unknown', 'Not assessed'],
        ]} onChange={value => change({ ethics: value as MethodContext['ethics'] })} />
        <label className="field"><span>Time and resource limits</span><textarea rows={3} maxLength={20000} value={context.resources} onChange={event => change({ resources: event.target.value })} placeholder="Time, skills, funding, permission, recruitment…" /></label>
      </div>
    </details>
    <div className="method-result" role="region" aria-label="Conditional design guidance">
      {result.status === 'insufficient-information' ? <>
        <h4>More information is needed</h4><p>Atlas has not selected a design. Work through the questions above or document your own justified approach below.</p>
        <details><summary>What is unresolved? ({result.missing.length})</summary><ul>{result.missing.map(item => <li key={item}>{item}</li>)}</ul></details>
      </> : <>
        <h4>Possible approaches to review</h4>
        {result.candidates.map(candidate => <article key={candidate.title}>
          <h4>{candidate.title}</h4><p>{candidate.rationale}</p>
          <ul>{candidate.conditions.map(condition => <li key={condition}>{condition}</li>)}</ul>
          <button type="button" className="button secondary small" disabled={Boolean(project.design.trim())} onClick={() => update({ design: `${candidate.title}\n\nConditions to resolve:\n${candidate.conditions.map(item => `- ${item}`).join('\n')}` })}>Use as a draft starting point</button>
        </article>)}
        {result.cautions.map(caution => <p key={caution}>{caution}</p>)}
      </>}
    </div>
    <details className="guidance-library"><summary>Choose the right kind of guidance</summary>
      <p>Design guidance helps plan a study. Reporting guidance helps explain it. Appraisal helps assess existing evidence. These jobs require different tools.</p>
      <small>Atlas guidance registry {guidanceRegistryVersion} · source checks dated 7 November 2026</small>
      {[
        { title: 'Study-design guidance', icon: Route, entries: studyDesignGuidance },
        { title: 'Reporting guidance', icon: BookOpen, entries: reportingGuidance },
        { title: 'Critical appraisal', icon: ShieldCheck, entries: appraisalGuidance },
      ].map(group => <section key={group.title} className="guidance-group">
        <h4><group.icon size={17} aria-hidden="true" /> {group.title}</h4>
        {group.entries.map(entry => <article key={entry.id}>
          <External href={entry.url}>{entry.name}</External><small>{entry.edition} · checked {entry.checkedAt}</small><p>{entry.scope}</p>
        </article>)}
      </section>)}
      <p>Reporting completeness is not a study-quality score. Check current applicability and versions with your supervisor and target venue.</p>
    </details>
  </div>;
}

export function StructuredDmp({ project, update }: Props) {
  const plan = project.structuredDmp ?? structuredDmpSchema.parse({});
  const count = dmpFields.filter(([key]) => Boolean(plan[key].trim())).length;
  return <section className="panel study-planning">
    <span className="eyebrow">PLAN → PROTECT → SHARE</span>
    <h2>Build your data management plan</h2>
    <p>A plan for looking after the materials behind your paper. Describe storage and safeguards here; keep raw confidential data in storage approved for your study.</p>
    <p className="muted">{count} of {dmpFields.length} prompts have notes. This records your planning, rather than certifying compliance.</p>
    <div className="study-map" aria-label="Data planning stages"><span>1 · Describe materials</span><span>2 · Protect & document</span><span>3 · Retain & share</span></div>
    <div className="two-col">{dmpFields.map(([key, label, hint]) => <label className="field" key={key}>
      <span>{label}</span><small>{hint}</small><textarea rows={3} maxLength={20000} value={plan[key]} onChange={event => update({ structuredDmp: { ...plan, [key]: event.target.value } })} />
    </label>)}</div>
    <div className="button-row"><button className="button" type="button" onClick={() => download('data-management-plan.md', dmpMarkdown(project.title, plan, project.dataPlan), 'text/markdown')}><Download size={16} aria-hidden="true" /> Export data management plan</button>
      <External href="https://dmptool.org/">DMP Tool for funder-specific requirements</External></div>
    <details><summary>Preregister a plan when appropriate</summary>
      <p>Preregistration records the plan before collecting or analyzing the relevant evidence. Discuss the right registry and timing for your study. Exporting here does not register or upload anything.</p>
      <div className="button-row"><button className="button secondary" type="button" onClick={() => download('research-protocol.md', protocolMarkdown(project), 'text/markdown')}><Download size={16} aria-hidden="true" /> Export protocol for review</button>
        <External href="https://osf.io/registries">Open OSF Registrations</External>
        <External href="https://www.cos.io/initiatives/prereg">Read preregistration guidance</External></div>
    </details>
  </section>;
}
