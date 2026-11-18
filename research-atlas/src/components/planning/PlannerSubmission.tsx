import { ArrowDownToLine } from 'lucide-react';
import { submissionDraft, submissionFields } from '@/lib/research-plan';
import { download } from '@/lib/storage';
import { External } from '@/components/shared/External';
import type { ToolProps } from './PlannerWorkbenchTypes';

export function PlannerSubmission({ title, plan, patch }: ToolProps & { title: string }) {
  return <section className="panel planner-tool" aria-labelledby="plan-submission">
    <div className="section-heading"><h3 id="plan-submission">Prepare the submission pack</h3><button type="button" className="button secondary" onClick={() => download('submission-pack.md', submissionDraft(title, plan), 'text/markdown;charset=utf-8')}><ArrowDownToLine size={16} aria-hidden="true" /> Download pack</button></div>
    <p>Use these templates as drafts. Fill in the details with your co-authors and check the target’s instructions. Blank items export with their starting templates.</p>
    <div className="planner-fields">
      {submissionFields.map(item => <label key={item.id} className="field"><span>{item.name}</span><small>{item.hint}</small><textarea maxLength={4000} rows={4} value={plan.submission[item.id] ?? ''} onChange={event => patch({ submission: { ...plan.submission, [item.id]: event.target.value } })} /></label>)}
    </div>
    <div className="button-row"><External href="https://credit.niso.org/contributor-roles-defined/">CRediT contributor roles</External><External href="https://www.icmje.org/recommendations/">ICMJE authorship and disclosure guidance</External></div>
  </section>;
}
