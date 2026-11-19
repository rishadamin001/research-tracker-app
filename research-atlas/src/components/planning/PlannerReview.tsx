import { ArrowDownToLine, Plus } from 'lucide-react';
import { csvCell } from '@/lib/model';
import { download } from '@/lib/storage';
import type { ToolProps } from './PlannerWorkbenchTypes';

export function PlannerReview({ plan, patch }: ToolProps) {
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
