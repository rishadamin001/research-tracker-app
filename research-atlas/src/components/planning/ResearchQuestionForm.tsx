import { useId } from 'react';
import { ArrowRight } from 'lucide-react';
import { disciplines } from '@/lib/content';
import { sourceLinks } from '@/lib/links';
import { External } from '@/components/shared/External';
import { questionVersionLimit } from '@/lib/research-trail';
import { pathwayFor } from '@/lib/research-pathway';
import { TaskSteps } from '@/components/shared/TaskSteps';
import type { PlanningProps } from './PlanningWorkspaceTypes';
import { PlanningTextField } from './PlanningTextField';

export function ResearchQuestionForm({ project, update, next, saveState, interfaceMode = 'guided' }: PlanningProps) {
  const discipline = disciplines.find(item => item.name === project.discipline);
  const pathway = pathwayFor(project);
  const draft = project.questionDraft ?? project.question;
  const changeReason = project.questionDraftReason ?? '';
  const questionId = useId();
  const historyFull = (project.questionVersions?.length ?? 0) >= questionVersionLimit;
  const changed = draft.trim() !== project.question.trim();
  const hasDraft = project.questionDraft !== undefined || project.questionDraftReason !== undefined;
  const versions = [...(project.questionVersions ?? [])].reverse();
  function commitQuestion() {
    if (historyFull || !changed) return;
    update({ question: draft, questionChangeReason: changeReason.trim(), questionDraft: undefined, questionDraftReason: undefined });
  }
  function discardDraft() {
    update({ questionDraft: undefined, questionDraftReason: undefined });
  }
  return <div className={`content-grid question-composer ${interfaceMode === 'expert' ? 'focus-workspace' : ''}`}>
    <section className="panel">
      <h2>What do you want to understand?</h2>
      {project.topic.trim() && <p>Working topic <strong>{project.topic}</strong></p>}
      <p>{interfaceMode === 'expert' ? 'Edit the grouped fields directly. Commit a question version when you intentionally change its wording.' : 'Work through a small part at a time. These are planning prompts, not an assessment of whether the question is scientifically valid.'}</p>
      <TaskSteps label="Question planning steps" interfaceMode={interfaceMode} initialStep={draft.trim() ? 2 : 0} steps={[
        { id: 'problem', canSkip: !project.problem.trim(), title: 'Problem to investigate', description: 'What is happening, and why is it worth understanding?', content: <>
          <PlanningTextField label="The problem you want to explore" value={project.problem} onChange={problem => update({ problem })} hint="Explain what is happening and why it matters." multiline />
          {interfaceMode !== 'expert' && <div className="task-example"><strong>Example starting point</strong><p>Commuter students may struggle to find a useful study space between classes. That is a problem to investigate, not yet a research conclusion.</p></div>}
        </> },
        { id: 'scope', canSkip: !project.setting.trim(), title: 'Scope and setting', description: 'Which people, records, texts or system will your question cover?', content: <>
          <PlanningTextField label="Population, setting, or corpus" value={project.setting} onChange={setting => update({ setting })} hint="Specify the people, place, time period, texts, or data you will study." />
          {interfaceMode !== 'expert' && <div className="task-example"><strong>Make the boundary visible</strong><p>{pathway?.id === 'literature' ? 'For example, eligible published studies on commuter students, with a justified date range and database coverage.' : 'For example, commuter students at one campus during one semester. State what you can access and what falls outside your study.'}</p></div>}
        </> },
        { id: 'wording', canSkip: !draft.trim(), title: 'Question wording', description: 'Ask what you could answer with evidence inside those boundaries.', content: <div className="question-version-editor">
          <label className="field" htmlFor={questionId}><span>Your research question</span></label>
          <small id={`${questionId}-hint`}>Write your own question here. Wait for the draft saved message before reloading. Save question revision creates a committed version.</small>
          {interfaceMode !== 'expert' && <details><summary>Why this matters</summary><p>A bounded question tells you which sources or observations can answer it and which fall outside the study.</p></details>}
          <textarea id={questionId} aria-describedby={`${questionId}-hint`} value={draft} onChange={event => update({ questionDraft: event.target.value })} rows={4} maxLength={20000} disabled={historyFull} />
          <label className="field"><span>Reason for this question revision (optional)</span><input value={changeReason} onChange={event => update({ questionDraftReason: event.target.value })} maxLength={2000} placeholder="For example, narrow to commuters after examining evidence access" disabled={historyFull} /></label>
          {interfaceMode !== 'expert' && <details className="task-example"><summary>See an example</summary><p>{pathway?.questionExample ?? discipline?.example ?? 'How do commuter students choose study spaces at one campus?'}</p></details>}
        </div> },
        { id: 'objectives', title: 'Objectives and review', description: 'Describe the work needed to answer your question and check what is still missing.', content: <>
          <PlanningTextField label="Research objectives" value={project.objectives} onChange={objectives => update({ objectives })} hint="List the steps needed to answer your question, such as describing a pattern or comparing sources." multiline />
          <details><summary>Hypothesis, if applicable {project.hypothesis.trim() && <small>(draft recorded)</small>}</summary><PlanningTextField label="Hypothesis" value={project.hypothesis} onChange={hypothesis => update({ hypothesis })} hint="Only include a prediction if it fits your design. Not every research question needs a hypothesis." multiline /></details>
          <h4>Your recorded ingredients</h4><ul className="question-checklist">
            <li>{project.problem.trim() ? 'Problem described' : 'Problem still blank'}</li><li>{project.setting.trim() ? 'Scope described' : 'Scope still blank'}</li><li>{draft.trim() ? 'Question wording drafted' : 'Question wording still blank'}</li><li>{project.objectives.trim() ? 'Objectives recorded' : 'Objectives still blank'}</li>
          </ul><p className="muted">These checks only detect recorded text. Review feasibility and methodological fit with your supervisor.</p>
        </> },
      ]} />
      <div className="question-draft-state" role="status"><span>{hasDraft ? (saveState === 'Saved on this device' ? 'Uncommitted question draft saved locally.' : saveState === 'Saving…' ? 'Saving your question draft…' : 'Question draft is in this tab. Download a backup to keep a copy.') : project.question ? 'Showing the committed question.' : 'No question version has been committed yet.'}</span> {versions.length > 0 && <span>Question v{versions[0].version}</span>}</div>
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
