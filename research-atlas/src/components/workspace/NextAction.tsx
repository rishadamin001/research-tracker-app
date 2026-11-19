import { ArrowRight } from 'lucide-react';
import type { Project } from '@/lib/model';
import { nextUsefulAction } from '@/lib/workspace-navigation';
import type { Navigate } from './project-navigation-types';

export function NextAction({ project, onNavigate }: { project: Project; onNavigate: Navigate }) {
  const action = nextUsefulAction(project);
  return <section className="next-task contextual-next" aria-label="Your next action"><div><span className="eyebrow">NEXT USEFUL ACTION</span><h2>{action.title}</h2><p>{action.detail}</p></div><button className="button" onClick={() => onNavigate(action.target)}>Continue <ArrowRight size={16} /></button></section>;
}
