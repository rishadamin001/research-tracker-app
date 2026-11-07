import { ArrowRight, BookOpen, Clock3, FolderOpen, Search } from 'lucide-react';
import type { Project } from '@/lib/model';
import { nextUsefulAction, projectTab, projectTabs, type ProjectDestination } from '@/lib/workspace-navigation';
import { taskStatus } from '@/lib/workflow';
import { BackupStatus } from './PrivacyData';
import './coherent-workspace.css';

type Navigate = (view: ProjectDestination) => void;
export function ProjectShell({ project, view, onNavigate }: { project: Project; view: string; onNavigate: Navigate }) {
  const active = projectTab(view);
  const subnav = active === 'question' ? [['profile', 'Project context'], ['topic', 'Topic & feasibility'], ['question', 'Research question']] : active === 'screen' ? [['discover', 'Find papers'], ['screen', 'Screen & deduplicate']] : active === 'methods' ? [['methods', 'Methods & ethics'], ['data', 'Data & analysis']] : [];
  return <section className="project-shell" aria-label="Active research project"><div className="project-shell-heading"><div><span className="eyebrow">MY RESEARCH</span><strong>{project.title}</strong></div><button className="text-button" onClick={() => onNavigate('projects')}><FolderOpen size={16} />Switch project</button></div>
    <nav className="project-tabs" aria-label="Project workspace">{projectTabs.map(([id, title]) => <button key={id} type="button" aria-current={active === id ? 'page' : undefined} onClick={() => onNavigate(id)}>{title}</button>)}</nav>
    {subnav.length > 0 && <nav className="project-subnav" aria-label="Current project tools">{subnav.map(([id, title]) => <button className="text-button" key={id} aria-current={view === id ? 'page' : undefined} onClick={() => onNavigate(id as ProjectDestination)}>{title}</button>)}</nav>}
  </section>;
}

export function NextAction({ project, onNavigate }: { project: Project; onNavigate: Navigate }) {
  const action = nextUsefulAction(project);
  return <section className="next-task contextual-next" aria-label="Your next action"><div><span className="eyebrow">NEXT USEFUL ACTION</span><h2>{action.title}</h2><p>{action.detail}</p></div><button className="button" onClick={() => onNavigate(action.target)}>Continue <ArrowRight size={16} /></button></section>;
}

export function ResearchDashboard({ project, onNavigate, backupDate, saveState }: { project: Project; onNavigate: Navigate; backupDate: string; saveState: string }) {
  const unreviewed = project.papers.filter(p => p.decision === 'unreviewed' || p.decision === 'maybe').length;
  const claims = project.papers.flatMap(p => p.evidenceClaims ?? []);
  const latest = [...project.decisions].reverse().slice(0, 3);
  return <>
    <header className="dashboard-header"><span className="eyebrow">WELCOME BACK</span><h1>Your research today</h1><p>{project.title}</p></header>
    <section className="panel research-question"><span className="eyebrow">CURRENT QUESTION</span><h2>{project.question || 'Your question is taking shape'}</h2><button className="text-button" onClick={() => onNavigate('question')}>{project.question ? 'Review question and scope' : 'Draft your question'} <ArrowRight size={15} /></button></section>
    <NextAction project={project} onNavigate={onNavigate} />
    <div className="dashboard-metrics"><article className="panel"><strong>{project.papers.length}</strong><span>saved references</span></article><article className="panel"><strong>{unreviewed}</strong><span>screening decisions to resolve</span></article><article className="panel"><strong>{claims.filter(c => c.reviewStatus !== 'reviewed').length}</strong><span>evidence claims awaiting review</span></article></div>
    <section className="panel"><h2>One connected project</h2><nav className="dashboard-stages" aria-label="Research stage status">{projectTabs.map(([id, title]) => <button className="task-link" key={id} onClick={() => onNavigate(id)}><strong>{title}</strong><small>{id === 'roadmap' ? 'Plan & history' : taskStatus(project, id).replace('Complete', 'Ready for now').replace('In progress', 'Draft')}</small></button>)}</nav><p className="muted">These statuses describe recorded work. They do not measure scientific quality or approval.</p></section>
    <div className="two-col"><section className="panel"><h2><Clock3 size={18} /> Recent decisions</h2>{latest.length ? <ol className="decision-log">{latest.map((entry, index) => <li key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleString()}</time><p>{entry.note}</p></li>)}</ol> : <p>Your research trail will grow as you record searches, decisions, and revisions.</p>}<button className="text-button" onClick={() => onNavigate('history')}>Open project history <ArrowRight size={15} /></button></section><section className="panel"><h2>Your work and backups</h2><p>{saveState}</p><BackupStatus date={backupDate} /><button className="text-button" onClick={() => onNavigate('projects')}>Back up or switch project <ArrowRight size={15} /></button></section></div>
  </>;
}

export function MiniLessons({ onNavigate }: { onNavigate: Navigate }) {
  return <section className="mini-lessons" aria-label="Learn through a task"><article className="panel"><BookOpen size={20} /><h2>What is a research paper?</h2><p>A focused question, a method someone can inspect, evidence, and an honest explanation of what it means.</p><div className="lesson-flow">Question → Method → Evidence → Interpretation</div><button className="text-button" onClick={() => onNavigate('question')}>Frame your question <ArrowRight size={15} /></button></article><article className="panel"><Search size={20} /><h2>Article or review?</h2><p>An original article reports analysis or data. A review brings existing studies together to answer a question or map a field.</p><button className="text-button" onClick={() => onNavigate('paper-search')}>Find an example about your topic <ArrowRight size={15} /></button></article><article className="panel"><FolderOpen size={20} /><h2>Journal or conference?</h2><p>Journals publish continuing issues. Conferences bring researchers together around event and submission dates. Their importance and formats vary by field.</p><button className="text-button" onClick={() => onNavigate('publication')}>Check publication fit <ArrowRight size={15} /></button></article></section>;
}
