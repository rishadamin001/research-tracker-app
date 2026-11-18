import { FolderOpen } from 'lucide-react';
import type { Project } from '@/lib/model';
import { projectTab, projectTabs, type ProjectDestination } from '@/lib/workspace-navigation';
import type { Navigate } from './project-navigation-types';

export function ProjectShell({ project, view, onNavigate }: { project: Project; view: string; onNavigate: Navigate }) {
  const active = projectTab(view);
  const subnav = active === 'question' ? [['profile', 'Project context'], ['topic', 'Topic & feasibility'], ['question', 'Research question']] : active === 'screen' ? [['discover', 'Find papers'], ['screen', 'Screen & deduplicate']] : active === 'methods' ? [['methods', 'Methods & ethics'], ['data', 'Data & analysis']] : [];
  return <section className="project-shell" aria-label="Active research project"><div className="project-shell-heading"><div><span className="eyebrow">MY RESEARCH</span><strong>{project.title}</strong></div><button className="text-button" onClick={() => onNavigate('projects')}><FolderOpen size={16} />Switch project</button></div>
    <nav className="project-tabs" aria-label="Project workspace">{projectTabs.map(([id, title]) => <button key={id} type="button" aria-current={active === id ? 'page' : undefined} onClick={() => onNavigate(id)}>{title}</button>)}</nav>
    {subnav.length > 0 && <nav className="project-subnav" aria-label="Current project tools">{subnav.map(([id, title]) => <button className="text-button" key={id} aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id as ProjectDestination)}>{title}</button>)}</nav>}
  </section>;
}
