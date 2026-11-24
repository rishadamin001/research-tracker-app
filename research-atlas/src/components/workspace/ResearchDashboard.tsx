import { ArrowRight, Clock3 } from 'lucide-react';
import type { Project } from '@/lib/model';
import { projectTabs } from '@/lib/workspace-navigation';
import { taskStatus } from '@/lib/workflow';
import { BackupFileCheckStatus } from '@/components/settings/BackupFileCheckStatus';
import { BackupStatus } from '@/components/settings/BackupStatus';
import type { Navigate } from './project-navigation-types';
import { ResearchJourney } from './ResearchJourney';
import { NextAction } from './NextAction';

export function ResearchDashboard({ project, onNavigate, onOpenSource, backupDate, saveState }: { project: Project; onNavigate: Navigate; onOpenSource?: (paperId: string) => void; backupDate: string; saveState: string }) {
  const unreviewed = project.papers.filter(p => p.decision === 'unreviewed' || p.decision === 'maybe').length;
  const claims = project.papers.flatMap(p => p.evidenceClaims ?? []);
  const latest = [...project.decisions].reverse().slice(0, 3);
  const recentSources = project.papers.slice(-3).reverse();
  const recentEdits = project.projectEvents?.slice(-3).reverse() ?? [];
  const recentNotes = [...(project.notebookNotes ?? [])].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, 3);
  return <>
    <header className="dashboard-header"><span className="eyebrow">WELCOME BACK</span><h1>Your research today</h1><p>{project.title}</p></header>
    <section className="panel research-question"><span className="eyebrow">CURRENT QUESTION</span><h2>{project.question || 'Your question is taking shape'}</h2><button className="text-button" onClick={() => onNavigate('question')}>{project.question ? 'Review question and scope' : 'Draft your question'} <ArrowRight size={15} /></button></section>
    <NextAction project={project} onNavigate={onNavigate} />
    <ResearchJourney project={project} go={onNavigate}/>
    <div className="dashboard-metrics"><article className="panel"><strong>{project.papers.length}</strong><span>saved references</span></article><article className="panel"><strong>{unreviewed}</strong><span>screening decisions to resolve</span></article><article className="panel"><strong>{claims.filter(c => c.reviewStatus !== 'reviewed').length}</strong><span>evidence claims awaiting review</span></article></div>
    <div className="two-col"><section className="panel"><h2>Recent sources</h2>{recentSources.length ? <ul>{recentSources.map((paper, index) => <li key={`${paper.id}-${index}`}><button type="button" className="text-button" onClick={() => onOpenSource ? onOpenSource(paper.id) : onNavigate('screen')}>{paper.title || 'Untitled reference'}</button><small> · {paper.decision}</small></li>)}</ul> : <p>Save a promising paper to start your evidence trail.</p>}<button type="button" className="text-button" onClick={() => onNavigate(recentSources.length ? 'screen' : 'paper-search')}>{recentSources.length ? 'Open the Evidence Desk' : 'Find a source'} <ArrowRight size={15} /></button></section><section className="panel"><h2>Recent edits</h2>{recentEdits.length ? <ol className="decision-log">{recentEdits.map(event => <li key={event.id}><time dateTime={event.updatedAt}>{new Date(event.updatedAt).toLocaleString()}</time><p>{event.detail}</p></li>)}</ol> : <p>Your recorded searches, question versions and evidence edits appear here as you work.</p>}<p className="muted">Question milestone: {project.question.trim() ? 'committed wording recorded' : 'provisional — explore sources while framing it'}.</p></section></div>
    <section className="panel" aria-labelledby="recent-notebook-notes">
      <h2 id="recent-notebook-notes">Recent notebook notes</h2>
      {recentNotes.length ? <ol className="decision-log">{recentNotes.map(note => {
        const characters = Array.from(note.text.replace(/\s+/g, ' '));
        const excerpt = characters.slice(0, 160).join('').trimEnd();
        return <li key={note.id}>
          <time dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleString()}</time>
          <p>{excerpt}{characters.length > 160 ? '…' : ''}</p>
        </li>;
      })}</ol> : <p>No notebook notes yet.</p>}
      <button type="button" className="text-button" onClick={() => onNavigate('notebook')}>Open Notebook <ArrowRight size={15} aria-hidden="true" /></button>
    </section>
    <section className="panel"><h2>One connected project</h2><nav className="dashboard-stages" aria-label="Research stage status">{projectTabs.map(([id, title]) => <button className="task-link" key={id} onClick={() => onNavigate(id)}><strong>{title}</strong><small>{id === 'roadmap' ? 'Plan & history' : id === 'notebook' ? 'Findings & notes' : taskStatus(project, id).replace('Complete', 'Ready for now').replace('In progress', 'Draft')}</small></button>)}</nav><p className="muted">These statuses describe recorded work. They do not measure scientific quality or approval.</p></section>
    <div className="two-col"><section className="panel"><h2><Clock3 size={18} /> Recent decisions</h2>{latest.length ? <ol className="decision-log">{latest.map((entry, index) => <li key={`${entry.at}-${index}`}><time>{new Date(entry.at).toLocaleString()}</time><p>{entry.note}</p></li>)}</ol> : <p>Your research trail will grow as you record searches, decisions, and revisions.</p>}<button className="text-button" onClick={() => onNavigate('history')}>Open project history <ArrowRight size={15} /></button></section><section className="panel"><h2>Your work and backups</h2><p>{saveState}</p><BackupStatus date={backupDate} /><BackupFileCheckStatus /><button className="text-button" onClick={() => onNavigate('projects')}>Back up or switch project <ArrowRight size={15} /></button></section></div>
  </>;
}
