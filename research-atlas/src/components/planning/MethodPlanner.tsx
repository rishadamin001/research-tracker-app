import { ClipboardList, Database, Route, BookOpen, ShieldCheck } from 'lucide-react';
import { methodContextSchema, routeMethods, type MethodContext, guidanceRegistryVersion, studyDesignGuidance, reportingGuidance, appraisalGuidance } from '@/lib/study-planning';
import { External } from '@/components/shared/External';
import type { Props } from './StudyPlanningProps';
import { MethodContextSteps } from './MethodContextSteps';

export function MethodPlanner({ project, update, interfaceMode = 'guided' }: Props) {
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
    {interfaceMode === 'expert' ? <details><summary>Work through the design questions</summary><MethodContextSteps context={context} change={change} interfaceMode={interfaceMode} /></details> : <MethodContextSteps context={context} change={change} interfaceMode={interfaceMode} />}
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
