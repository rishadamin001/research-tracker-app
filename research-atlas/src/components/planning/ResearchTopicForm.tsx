import { disciplines } from '@/lib/content';
import type { PlanningProps } from './PlanningWorkspaceTypes';
import { PlanningTextField } from './PlanningTextField';
import { PlanningContinue } from './PlanningContinue';

export function ResearchTopicForm({ project, update, next }: PlanningProps) {
  const discipline = disciplines.find(item => item.name === project.discipline);

  return (
    <div className="content-grid">
      <section className="panel">
        <h2>Compare possible topics</h2>
        <p>Shortlist ideas before committing to a question. You can start with a topic you already have in mind.</p>
        <PlanningTextField label="Topic shortlist" value={project.topicIdeas} onChange={topicIdeas => update({ topicIdeas })}
          hint="Write one possible topic per line." multiline />
        <PlanningTextField label="Working topic" value={project.topic} onChange={topic => update({ topic })} />
        <PlanningTextField label="Why is this topic feasible?" value={project.topicRationale} onChange={topicRationale => update({ topicRationale })}
          hint="Record the evidence you can realistically access, the time available, and any permission you might need." multiline />
        <PlanningContinue next={next}>Draft your question</PlanningContinue>
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
