import type { MethodContext } from '@/lib/study-planning';
import { type InterfaceMode, TaskSteps } from '@/components/shared/TaskSteps';
import { StudyContextChoice } from './StudyContextChoice';

export function MethodContextSteps({ context, change, interfaceMode }: { context: MethodContext; change: (patch: Partial<MethodContext>) => void; interfaceMode: InterfaceMode }) {
  return <TaskSteps label="Design feasibility questions" interfaceMode={interfaceMode} steps={[
    { id: 'goal', title: 'Goal and unit', description: 'Start with what you want to understand and what you will study.', content: <div className="two-col">
      <StudyContextChoice label="Knowledge goal" value={context.goal} options={[
        ['explore', 'Explore an unfamiliar topic'], ['describe', 'Describe a pattern'], ['compare', 'Compare groups or cases'], ['understand', 'Understand an experience'], ['relationship', 'Study a relationship'], ['evaluate', 'Evaluate an intervention'], ['design', 'Build and evaluate an artifact'], ['review', 'Review existing evidence'], ['predict', 'Predict an outcome'], ['uncertain', 'Not sure yet'],
      ]} onChange={value => change({ goal: value as MethodContext['goal'] })} />
      <label className="field"><span>Unit of analysis</span><input maxLength={20000} value={context.unit} onChange={event => change({ unit: event.target.value })} placeholder="People, organizations, documents, samples…" /></label>
    </div> },
    { id: 'evidence', title: 'Evidence and measurement', description: 'Identify accessible material and whether you need measurements, interpretation or both.', content: <div className="two-col">
      <StudyContextChoice label="Evidence access" value={context.evidence} options={[
        ['existing', 'Accessible existing sources or data'], ['new', 'Feasible new data collection'], ['both', 'Both existing and new'], ['unavailable', 'No accessible evidence yet'], ['unknown', 'Not assessed'],
      ]} onChange={value => change({ evidence: value as MethodContext['evidence'] })} />
      <StudyContextChoice label="Measurement or interpretation" value={context.measurement} options={[
        ['numbers', 'Numeric measurements'], ['text', 'Experiences or meaning'], ['documents', 'Documents or a corpus'], ['mixed', 'Numeric and interpretive evidence'], ['unknown', 'Not decided'],
      ]} onChange={value => change({ measurement: value as MethodContext['measurement'] })} />
    </div> },
    { id: 'causal', title: 'Claims and comparison', description: 'Distinguish describing an association from making a cause-and-effect claim.', content: <div className="two-col">
      <StudyContextChoice label="Do you intend to claim cause and effect?" value={context.causalIntent} options={[
        ['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure'],
      ]} onChange={value => change({ causalIntent: value as MethodContext['causalIntent'] })} />
      <StudyContextChoice label="Can you assign an intervention or controlled comparison?" value={context.intervention} options={[
        ['yes', 'Potentially feasible'], ['no', 'Not feasible'], ['not-applicable', 'Not applicable to this question'], ['unknown', 'Not assessed'],
      ]} onChange={value => change({ intervention: value as MethodContext['intervention'] })} />
    </div> },
    { id: 'resources', title: 'Access and resources', description: 'Check ethics, permission, time and skills before selecting a possible design.', content: <div className="two-col">
      <StudyContextChoice label="Ethics and access assessment" value={context.ethics} options={[
        ['documented', 'Requirements or exemption documented'], ['consultation', 'Consultation or approval still needed'], ['unknown', 'Not assessed'],
      ]} onChange={value => change({ ethics: value as MethodContext['ethics'] })} />
      <label className="field"><span>Time and resource limits</span><textarea rows={3} maxLength={20000} value={context.resources} onChange={event => change({ resources: event.target.value })} placeholder="Time, skills, funding, permission, recruitment when applicable…" /></label>
    </div> },
  ]} />;
}
