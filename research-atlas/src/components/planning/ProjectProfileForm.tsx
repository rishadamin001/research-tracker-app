import { disciplines } from '@/lib/content';
import type { Project } from '@/lib/model';
import { researchPathways, pathwayFor } from '@/lib/research-pathway';
import type { PlanningProps } from './PlanningWorkspaceTypes';
import { PlanningTextField } from './PlanningTextField';
import { PlanningSelectField } from './PlanningSelectField';
import { PlanningContinue } from './PlanningContinue';

export function ProjectProfileForm({ project, update, next }: PlanningProps) {
  const domains = disciplines.find(discipline => discipline.name === project.discipline)?.domains ?? [];

  return (
    <div className="content-grid">
      <section className="panel">
        <h2>Set up your project</h2>
        <p>Choose a field and goal so the workspace can show relevant examples. You can revise these choices as your project develops.</p>
        <PlanningTextField label="Project title" value={project.title} onChange={title => update({ title })} />
        <div className="two-col">
          <PlanningSelectField label="Discipline" value={project.discipline} onChange={discipline => update({ discipline })}
            choices={[[ '', 'Choose a discipline' ], ...disciplines.map(({ name }) => [name, name] as const)]} />
          <PlanningSelectField label="Research domain" value={project.domain} onChange={domain => update({ domain })}
            choices={[[ '', 'Choose a domain (optional)' ], ...domains.map(domain => [domain, domain] as const)]} />
        </div>
        <div className="two-col">
          <PlanningSelectField label="Research experience" value={project.experience} onChange={experience => update({ experience })}
            choices={[
              ['', 'Choose your experience'],
              ['Beginner', 'I’m new to research'],
              ['Some experience', 'I’ve done some research'],
              ['Experienced', 'I’m an experienced researcher'],
            ]} />
          <PlanningSelectField label="Research goal" value={project.goal} onChange={goal => update({ goal })}
            choices={[
              ['', 'Choose a goal'],
              ['Course project', 'Course project'],
              ['Thesis or dissertation', 'Thesis or dissertation'],
              ['Literature review', 'Literature review'],
              ['Publication or independent study', 'Publication or independent study'],
              ['Exploring a topic', 'Exploring a topic'],
            ]} />
        </div>
        <label className="field"><span>Research pathway</span><select aria-label="Research pathway" value={project.studyType ?? ''} onChange={event => update({ studyType: event.target.value ? event.target.value as NonNullable<Project['studyType']> : undefined })}>
          <option value="">Not decided yet</option>{Object.values(researchPathways).map(pathway => <option key={pathway.id} value={pathway.id}>{pathway.label}</option>)}
        </select></label>
        <p className="muted">This changes examples and planning prompts. You can change it later; existing answers, sources and decisions are preserved. A pathway does not choose a design or grant ethics approval.</p>
        {pathwayFor(project) && <div className="pathway-summary"><strong>{pathwayFor(project)!.label}</strong><p>{pathwayFor(project)!.description}</p></div>}
        <details>
          <summary>Optional project details</summary>
          <PlanningTextField label="Institution or department" value={project.institution} onChange={institution => update({ institution })} />
          <PlanningTextField label="Constraints" value={project.constraints} onChange={constraints => update({ constraints })}
            hint="Note your timeline, evidence access, tools, or course requirements." multiline />
        </details>
        <div className="button-row">
          <PlanningContinue next={next}>Explore topics</PlanningContinue>
        </div>
      </section>
      <aside className="panel warm">
        <h3>Choose a practical starting point</h3>
        <p>Think about what you want to produce, what sources or data you can access, and how much time you have. A working title is enough to begin.</p>
      </aside>
    </div>
  );
}
