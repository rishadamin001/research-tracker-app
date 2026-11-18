import { useState } from 'react';
import { toolGroups, guideTools } from '@/lib/planner-guide';
import { External } from '@/components/shared/External';

const localToolMarks = new Set([
  'connected-papers', 'endnote', 'jasp', 'maxqda', 'orcid', 'osf', 'overleaf',
  'qualtrics', 'redcap', 'researchrabbit', 'semantic-scholar', 'zotero',
]);

export function ResearchPlannerToolkit() {
  const [group, setGroup] = useState<typeof toolGroups[number]['id']>('find');
  return <section className="planner-view" aria-labelledby="planner-toolkit">
    <h2 id="planner-toolkit">Pick a tool for your next task</h2>
    <p className="planner-intro">Start with the task you need to finish. Some tools are free, while others may be available through your institution. Check its data rules before uploading a manuscript or participant information.</p>
    <div className="planner-tool-filter" role="group" aria-label="Tool categories">
      {toolGroups.map(({ id, label }) => <button key={id} type="button" aria-pressed={group === id} onClick={() => setGroup(id)}>{label}</button>)}
    </div>
    <div className="planner-tool-grid">
      {guideTools.filter(tool => tool.group === group).map(tool => {
        return <article className="planner-tool" key={tool.id}>
          <div className="planner-tool-heading">
            <span className="planner-tool-mark" aria-hidden="true" style={{ color: tool.color }}>
              {localToolMarks.has(tool.id) ? <img src={`${import.meta.env.BASE_URL}research-tools/${tool.id}.png`} alt="" width="36" height="36" /> : tool.mark}
            </span>
            <div><h3>{tool.name}</h3><small>{tool.access}</small></div>
          </div>
          <p>{tool.note}</p>
          <External href={tool.href}>Open {tool.name}</External>
        </article>;
      })}
    </div>
  </section>;
}
