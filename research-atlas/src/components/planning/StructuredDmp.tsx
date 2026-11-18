import { useId } from 'react';
import { Download } from 'lucide-react';
import { protocolMarkdown } from '@/lib/model';
import { download } from '@/lib/storage';
import { structuredDmpSchema, dmpFields, dmpMarkdown } from '@/lib/study-planning';
import { External } from '@/components/shared/External';
import { TaskSteps } from '@/components/shared/TaskSteps';
import { pathwayFor, dmpExampleFor } from '@/lib/research-pathway';
import type { Props } from './StudyPlanningProps';

export function StructuredDmp({ project, update, interfaceMode = 'guided' }: Props) {
  const fieldId = useId();
  const plan = project.structuredDmp ?? structuredDmpSchema.parse({});
  const pathway = pathwayFor(project);
  const count = dmpFields.filter(([key]) => Boolean(plan[key].trim())).length;
  const groups = [
    { id: 'materials', title: 'Describe materials', description: 'What will you collect or reuse, where does it come from, and what files will you keep?', keys: ['types', 'source', 'formats', 'volume'] },
    { id: 'protect', title: 'Protect and document', description: 'Explain access, storage, backups and the documentation needed to understand your material.', keys: ['sensitivity', 'storage', 'backup', 'naming', 'documentation', 'access'] },
    { id: 'share', title: 'Retain and share', description: 'Record retention, reuse permissions, sharing limits and an appropriate repository.', keys: ['retention', 'sharing', 'repository'] },
  ];
  const preview = dmpFields.map(([key, label]) => `## ${label}\n${plan[key].trim() || 'Not yet specified'}`).join('\n\n');
  return <section className="panel study-planning">
    <span className="eyebrow">PLAN → PROTECT → SHARE</span><h2>Build your data management plan</h2>
    <p>Describe the materials behind your paper and how they will be kept and shared. Keep raw confidential data in storage approved for your study.</p>
    {pathway && <p><strong>{pathway.label}:</strong> {pathway.evidenceExample}</p>}
    <p className="muted">{count} of {dmpFields.length} prompts have notes. This records your planning, rather than certifying compliance.</p>
    <TaskSteps label="Data management planning steps" interfaceMode={interfaceMode} steps={groups.map(group => ({
      id: group.id, title: group.title, description: group.description,
      content: <div className="two-col">{dmpFields.filter(([key]) => group.keys.includes(key)).map(([key, label, hint]) => <label className="field" key={key}><span id={`${fieldId}-${key}-label`}>{label}</span><small id={`${fieldId}-${key}-hint`}>{hint}</small><textarea aria-labelledby={`${fieldId}-${key}-label`} aria-describedby={`${fieldId}-${key}-hint${interfaceMode !== 'expert' ? ` ${fieldId}-${key}-example` : ''}`} rows={3} maxLength={20000} value={plan[key]} onChange={event => update({ structuredDmp: { ...plan, [key]: event.target.value } })} />{interfaceMode !== 'expert' && <small id={`${fieldId}-${key}-example`} className="task-example">Example to adapt: {dmpExampleFor(project, key)}</small>}</label>)}</div>,
    }))} />
    <section aria-label="Live data management plan preview"><h3>Live plan preview</h3><p className="muted">Your text appears here as you work. Unanswered prompts stay visible in the export.</p><pre className="plan-preview">{preview}{project.dataPlan.trim() ? `\n\n## Additional / earlier planning notes\n${project.dataPlan}` : ''}</pre></section>
    <div className="button-row"><button className="button" type="button" onClick={() => download('data-management-plan.md', dmpMarkdown(project.title, plan, project.dataPlan), 'text/markdown')}><Download size={16} aria-hidden="true" /> Export data management plan</button><External href="https://dmptool.org/">DMP Tool for funder-specific requirements</External></div>
    <details><summary>Preregister a plan when appropriate</summary><p>Preregistration records a plan before the relevant collection or analysis. Discuss the right registry and timing for your study. Exporting here does not register or upload anything.</p><div className="button-row"><button className="button secondary" type="button" onClick={() => download('research-protocol.md', protocolMarkdown(project), 'text/markdown')}><Download size={16} aria-hidden="true" /> Export protocol for review</button><External href="https://osf.io/registries">Open OSF Registrations</External><External href="https://www.cos.io/initiatives/prereg">Read preregistration guidance</External></div></details>
  </section>;
}
