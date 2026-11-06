'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, Compass, FolderOpen, LibraryBig, Map, Menu, Plus, Search, Settings, X } from 'lucide-react';
import { createProject, matrixCsv, parseBackup, protocolMarkdown, type Project, type Stage } from '@/lib/model';
import { download, loadProjects, saveProjects } from '@/lib/storage';
import { disciplines } from '@/lib/content';
import { nextTask, roadmap, taskStatus, updateProject, type TaskStatus } from '@/lib/workflow';
import { readPreferences, writePreferences, type Preferences } from '@/lib/preferences';
import { PlanningWorkspace } from './PlanningWorkspace';
import { EvidenceWorkspace } from './EvidenceWorkspace';
import { ExecutionWorkspace } from './ExecutionWorkspace';
import { ResearchGuide } from './ResearchGuide';
import { ConferencePlanner } from './ConferencePlanner';
import { WorkspacePreferences } from './WorkspacePreferences';
import { InstallApp } from './InstallApp';
import './discipline-explorer.css';

type View = 'overview' | 'primer' | 'explore' | 'guide' | 'conferences' | 'roadmap' | 'projects' | 'preferences' | Stage;
const mainNav = [
  { id: 'overview', title: 'Home', icon: Compass },
  { id: 'guide', title: 'Research guide', icon: BookOpen },
  { id: 'conferences', title: 'Conference planner', icon: CalendarDays },
  { id: 'explore', title: 'Explore disciplines', icon: Compass },
  { id: 'roadmap', title: 'Project roadmap', icon: Map },
  { id: 'projects', title: 'My projects', icon: FolderOpen },
  { id: 'preferences', title: 'Preferences', icon: Settings },
] as const;

function currentView(): View {
  const page = window.location.hash.slice(1).split('?')[0];
  if (roadmap.some(task => task.id === page) || mainNav.some(tab => tab.id === page) || page === 'primer') return page as View;
  return 'overview';
}

function currentTopic() {
  const [view, parameters] = window.location.hash.slice(1).split('?');
  if (view !== 'discover' || !parameters) return undefined;
  const topic = new URLSearchParams(parameters).get('topic');
  if (topic && disciplines.some(item => item.name === topic || item.domains.includes(topic))) return topic;
  return undefined;
}

function Status({ status }: { status: TaskStatus }) {
  return <span className={`task-status ${status.toLowerCase().replaceAll(' ', '-')}`}>{status}</span>;
}

export default function Atlas() {
  const [view, setView] = useState<View>(currentView);
  const [searchTopic, setSearchTopic] = useState(currentTopic);
  const [preferences, setPreferences] = useState(readPreferences);
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState('');
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('Opening local workspace…');
  const [notice, setNotice] = useState('');
  const [mobile, setMobile] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [draftQuestion, setDraftQuestion] = useState('');
  const [decision, setDecision] = useState('');
  const [imported, setImported] = useState<Project[] | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const projectTitle = useRef<HTMLInputElement>(null);
  const closeDialog = useRef<HTMLButtonElement>(null);
  const submitProject = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const saveQueue = useRef(Promise.resolve());
  const loadFailed = useRef(false);
  const saveRevision = useRef(0);

  useEffect(() => {
    const onHash = () => { setView(currentView()); setSearchTopic(currentTopic()); setMobile(false); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let live = true;
    loadProjects().then(records => {
      if (!live) return;
      setProjects(records);
      let remembered: string | null = null;
      try { remembered = sessionStorage.getItem('atlas-active'); } catch { /* Session selection is optional. */ }
      setActive(records.find(record => record.id === remembered)?.id ?? records[0]?.id ?? '');
      setReady(true);
    }).catch(() => {
      if (!live) return;
      loadFailed.current = true;
      setSaveState('Local storage unavailable');
      setNotice('Your workspace could not be opened. Changes in this session can be downloaded as a backup.');
      setReady(true);
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (!ready || loadFailed.current) return;
    const revision = ++saveRevision.current;
    saveQueue.current = saveQueue.current.catch(() => {}).then(() => saveProjects(projects)).then(() => {
      if (revision === saveRevision.current) setSaveState('Saved on this device');
    }).catch(() => {
      if (revision === saveRevision.current) setSaveState('Could not save. Download a backup.');
    });
  }, [projects, ready]);

  useEffect(() => {
    if (!ready || saveState === 'Saved on this device') return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [ready, saveState]);

  const project = projects.find(item => item.id === active);
  const current = roadmap.find(task => task.id === view);
  const next = project && nextTask(project);
  const status = project && current && taskStatus(project, current.id);
  const visibleTasks = project && preferences.openTasksOnly
    ? roadmap.filter(task => taskStatus(project, task.id) !== 'Complete') : roadmap;

  function changePreferences(patch: Partial<Preferences>) {
    const updated = { ...preferences, ...patch };
    setPreferences(updated);
    if (!writePreferences(updated)) setNotice('Your display changes apply until you close this page. Browser storage is unavailable.');
  }

  function go(destination: View, topic?: string) {
    const hash = topic ? `#${destination}?${new URLSearchParams({ topic })}` : `#${destination}`;
    if (view !== destination || searchTopic !== topic) window.history.pushState(null, '', hash);
    setView(destination);
    setSearchTopic(topic);
    setMobile(false);
    window.scrollTo({ top: 0 });
    main.current?.focus({ preventScroll: true });
  }

  function selectProject(id: string) {
    setActive(id);
    try { sessionStorage.setItem('atlas-active', id); } catch { /* Session selection is optional. */ }
  }

  function markDirty() {
    ++saveRevision.current;
    setSaveState(loadFailed.current ? 'Local storage unavailable' : 'Saving…');
  }

  function update(patch: Partial<Project>) {
    markDirty();
    setProjects(items => items.map(item => item.id === active ? updateProject(item, patch) : item));
  }

  function openNewProject() {
    if (!ready) return;
    if (projects.length >= 100) { setNotice('Back up and remove an old project before adding another.'); return; }
    setNewTitle('');
    dialog.current?.showModal();
    projectTitle.current?.focus();
  }

  function create() {
    const item = createProject(newTitle.trim() || 'Untitled research project');
    if (view === 'primer') item.question = draftQuestion.trim();
    markDirty();
    setProjects(items => [item, ...items]);
    selectProject(item.id);
    dialog.current?.close();
    go('profile');
  }

  function searchDiscipline(topic: string) {
    if (!ready) return;
    const discipline = disciplines.find(item => item.name === topic || item.domains.includes(topic));
    if (!discipline) return;

    if (!project) {
      if (projects.length >= 100) {
        setNotice('Open an existing project from My projects to start this search.');
        return;
      }
      const newProject = createProject(`${topic} literature`);
      newProject.discipline = discipline.name;
      if (discipline.name !== topic) newProject.domain = topic;
      markDirty();
      setProjects(items => [newProject, ...items]);
      selectProject(newProject.id);
      setNotice(`Created a local project for ${topic} so you can save papers as you search.`);
    }

    go('discover', topic);
  }

  function backup() {
    const data = { schemaVersion: 1, exportedAt: new Date().toISOString(), projects };
    download('research-atlas-backup.json', JSON.stringify(data, null, 2), 'application/json');
  }

  function importBackup() {
    if (!imported) return;
    if (imported.length + projects.length > 100) { setNotice('This import would exceed the 100-project limit.'); return; }
    const copies = imported.map(item => ({ ...item, id: crypto.randomUUID(), title: `${item.title.slice(0, 19989)} (imported)` }));
    markDirty();
    setProjects(items => [...copies, ...items]);
    if (copies[0]) selectProject(copies[0].id);
    setImported(null);
    setNotice(`${copies.length} project${copies.length === 1 ? '' : 's'} imported as new copies.`);
  }

  function removeProject(item: Project) {
    if (!window.confirm(`Delete ${item.title}? Download a backup first if you want to retain a copy.`)) return;
    markDirty();
    const remaining = projects.filter(record => record.id !== item.id);
    setProjects(remaining);
    if (active === item.id) selectProject(remaining[0]?.id ?? '');
  }

  function advance() {
    if (!current) return;
    go(roadmap[roadmap.findIndex(task => task.id === current.id) + 1]?.id ?? 'roadmap');
  }

  return <div className="app-shell journey-shell" data-theme={preferences.theme} data-density={preferences.density} data-motion={preferences.motion}>
    <a className="skip" href="#main" onClick={event => { event.preventDefault(); main.current?.focus(); }}>Skip to workspace</a>
    <aside className={`sidebar journey-sidebar ${mobile ? 'open' : ''}`}>
      <a href="#overview" className="brand" onClick={event => { event.preventDefault(); go('overview'); }}>
        <span className="brand-mark"><LibraryBig size={22} /></span><span>Research Atlas<small>RESEARCH WORKSPACE</small></span>
      </a>
      <button type="button" className="mobile-close icon-button" onClick={() => setMobile(false)} aria-label="Close navigation"><X /></button>
      <nav aria-label="Main navigation">
        {mainNav.map(item => <button type="button" key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} aria-current={view === item.id ? 'page' : undefined} onClick={() => go(item.id)}><item.icon size={18} />{item.title}</button>)}
      </nav>
      {project && <div className="journey-active">
        <span className="eyebrow">ACTIVE PROJECT</span><strong>{project.title}</strong>
        {next && <button className="text-button" onClick={() => go(next.id)}>Continue project <ArrowRight size={15} /></button>}
        <button className="text-button" onClick={() => go('screen')}><LibraryBig size={15} />Saved literature <span className="nav-count">{project.papers.length}</span></button>
      </div>}
      <p className="journey-sidebar-note">Project data is stored in this browser. Download a backup from My projects.</p>
    </aside>
    <div className="main-shell">
      <header className="topbar journey-topbar">
        <button type="button" className="mobile-toggle icon-button" onClick={() => setMobile(true)} aria-label="Open navigation" aria-expanded={mobile}><Menu /></button>
        <div className="journey-breadcrumb">{current ? <><button className="text-button" onClick={() => go('roadmap')}>Project roadmap</button><ChevronRight size={15} /><span>{current.title}</span></> : <span>{mainNav.find(item => item.id === view)?.title ?? 'Get started'}</span>}</div>
        <span className="saved" role="status">{saveState}</span>
        <button className="button small" onClick={openNewProject} disabled={!ready}><Plus size={16} />New project</button>
      </header>
      <main id="main" ref={main} tabIndex={-1}>
        {notice && <div className="notice" role="status">{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={16} /></button></div>}
        <div className="stage-frame" key={view}>

        {view === 'overview' && <>
          <section className="journey-hero">
            <span className="eyebrow">RESEARCH ATLAS</span>
            <h1>Turn curiosity into<br />a research project.</h1>
            <p>Research answers a focused question using evidence and a method you can explain. Start with an idea, then save your sources and decisions as the project takes shape.</p>
            <button className="button light" onClick={project ? () => go('roadmap') : openNewProject} disabled={!ready}>{project ? 'Resume your project' : 'Start a research project'}<ArrowRight size={18} /></button>
          </section>
          <section className="entry-grid" aria-label="Choose a starting point">
            <button className="entry-card" onClick={() => go('primer')}><BookOpen /><strong>I’m new to research</strong><span>Try turning a topic into a question.</span><ArrowRight size={17} /></button>
            <button className="entry-card" onClick={openNewProject} disabled={!ready}><Plus /><strong>I want to start a project</strong><span>Choose a direction and get a roadmap.</span><ArrowRight size={17} /></button>
            <button className="entry-card" onClick={() => go('explore')}><Compass /><strong>I want to explore research</strong><span>Browse examples from different disciplines.</span><ArrowRight size={17} /></button>
            <button className="entry-card" onClick={() => go('guide')}><LibraryBig /><strong>Understand scholarly publishing</strong><span>See how papers, journals, and conferences fit together.</span><ArrowRight size={17} /></button>
            <button className="entry-card" onClick={() => go('conferences')}><CalendarDays /><strong>Find a conference</strong><span>Browse Bangladesh and international events and save a date.</span><ArrowRight size={17} /></button>
          </section>
        </>}

        {view === 'guide' && <ResearchGuide onStart={() => go('primer')} onConferences={() => go('conferences')} />}
        {view === 'conferences' && <ConferencePlanner />}
        {view === 'preferences' && <><WorkspacePreferences value={preferences} onChange={changePreferences} /><InstallApp /></>}

        {view === 'primer' && <section className="panel start-exercise">
          <span className="eyebrow">GET STARTED</span><h1>From a topic to a question</h1>
          <p>A topic names an area. A research question tells you what evidence to look for and what you want to understand.</p>
          <dl><dt>Topic</dt><dd>Social media and university students</dd><dt>Question</dt><dd>How do university students describe the influence of social media on their study habits?</dd></dl>
          <p>This question asks about experiences. Interviews could help, depending on the study’s objectives and access to participants.</p>
          <label className="field"><span>Try your own research question</span><textarea value={draftQuestion} onChange={event => setDraftQuestion(event.target.value)} maxLength={20000} rows={4} placeholder="What will you investigate, and in which setting?" /></label>
          <button className="button" onClick={openNewProject} disabled={!ready}>{draftQuestion.trim() ? 'Start a project with this question' : 'Start a project'}<ArrowRight size={17} /></button>
        </section>}

        {view === 'explore' && <>
          <div className="page-heading"><div><span className="eyebrow">TOPIC EXPLORATION</span><h1>Explore disciplines</h1><p>Choose a field or a topic to search for papers right away.</p></div></div>
          <p className="discipline-search-note"><Search size={16} aria-hidden="true" />{project ? `Searches open in ${project.title}.` : 'Your first search starts a local project where you can save papers.'}</p>
          <div className="discipline-grid">{disciplines.map(item => <article className="panel" key={item.name}>
            <h2><button type="button" className="discipline-title" disabled={!ready} onClick={() => searchDiscipline(item.name)}>{item.name}<ArrowRight size={17} aria-hidden="true" /></button></h2>
            <p>{item.example}</p>
            <div className="chips">{item.domains.map(domain => <button type="button" key={domain} className="discipline-topic" disabled={!ready} onClick={() => searchDiscipline(domain)}>{domain}</button>)}</div>
          </article>)}</div>
          <button className="button" onClick={openNewProject} disabled={!ready}><Plus size={16} />Start a project</button>
        </>}

        {(view === 'roadmap' || current) && !project && <section className="panel empty-state">
          <FolderOpen size={28} /><h1>Create your research project</h1><p>Set a direction and keep your questions, evidence, and plans together.</p>
          {view === 'discover' && searchTopic
            ? <button className="button" onClick={() => searchDiscipline(searchTopic)} disabled={!ready}><Search size={17} />Search {searchTopic}</button>
            : <button className="button" onClick={openNewProject} disabled={!ready}><Plus size={17} />Start a project</button>}
        </section>}

        {view === 'roadmap' && project && <>
          <div className="page-heading"><div><span className="eyebrow">PROJECT ROADMAP</span><h1>{project.title}</h1><p>{project.discipline}{project.goal ? ` · ${project.goal}` : ''}</p></div><button className="button secondary" onClick={() => go('projects')}><ArrowDownToLine size={16} />Export project</button></div>
          {next && <section className="next-task"><div><span className="eyebrow">CONTINUE WHERE YOU LEFT OFF</span><h2>{next.title}</h2><p>{next.detail}</p></div><button className="button" onClick={() => go(next.id)}>Open next task <ArrowRight size={17} /></button></section>}
          <div className="roadmap-toolbar"><h2>Project tasks</h2><label className="preference-check"><input type="checkbox" checked={preferences.openTasksOnly} onChange={event => changePreferences({ openTasksOnly: event.target.checked })} /> Show unfinished tasks only</label></div>
          {!visibleTasks.length && <p className="notice">All tasks have recorded progress. Turn off the filter to see them.</p>}
          <div className="roadmap-grid">{[...new Set(visibleTasks.map(task => task.group))].map(group => <section className="panel roadmap-group" key={group}>
            <h2>{group}</h2><ul>{visibleTasks.filter(task => task.group === group).map(task => <li key={task.id}><button className="task-link" onClick={() => go(task.id)}><span><strong>{task.title}</strong><small>{task.detail}</small></span><Status status={taskStatus(project, task.id)} /></button></li>)}</ul>
          </section>)}</div>
          <section className="panel"><h2>Decision log</h2><p>Keep a record of changes and why you made them.</p>
            <form className="decision-form" onSubmit={event => { event.preventDefault(); if (!decision.trim()) return; update({ decisions: [...project.decisions.slice(-299), { at: new Date().toISOString(), note: decision.trim() }] }); setDecision(''); }}>
              <label className="field"><span>Decision and rationale</span><input value={decision} onChange={event => setDecision(event.target.value)} maxLength={20000} /></label><button className="button secondary" disabled={!decision.trim()}>Record decision</button>
            </form>
            <ol className="decision-log">{[...project.decisions].reverse().map((entry, index) => <li key={`${entry.at}-${index}`}><time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time><p>{entry.note}</p></li>)}</ol>
          </section>
        </>}

        {project && current && <>
          <div className="page-heading"><div><span className="eyebrow">{current.group.toUpperCase()} · {project.title}</span><h1>{current.title}</h1><p>{current.detail}</p></div>{status && <Status status={status} />}</div>
          {status === 'Needs review' && <div className="review-banner" role="status"><p>Your question changed. Check this work against the revised question before proceeding.</p><button className="button secondary" onClick={() => update({ needsReview: project.needsReview.filter(id => id !== current.id) })}><Check size={16} />Mark reviewed</button></div>}
          {view === 'profile' || view === 'topic' || view === 'question' || view === 'methods' ? <PlanningWorkspace key={`${project.id}-${view}`} project={project} mode={view} update={update} next={advance} /> : null}
          {view === 'discover' || view === 'screen' || view === 'extract' ? <EvidenceWorkspace key={`${project.id}-${view}-${searchTopic ?? ''}`} project={project} mode={view} update={update} notify={setNotice} initialQuery={view === 'discover' ? searchTopic : undefined} /> : null}
          {view === 'data' || view === 'writing' || view === 'publication' ? <ExecutionWorkspace key={`${project.id}-${view}`} project={project} mode={view} update={update} /> : null}
          <div className="journey-actions"><button className="button secondary" onClick={() => go('roadmap')}>Back to roadmap</button>{view !== 'profile' && view !== 'topic' && view !== 'question' && view !== 'methods' && <button className="button" onClick={advance}>{view === 'publication' ? 'Return to roadmap' : 'Continue to next task'}<ArrowRight size={17} /></button>}</div>
        </>}

        {view === 'projects' && <>
          <div className="page-heading"><div><span className="eyebrow">TRACK YOUR WORK</span><h1>My projects</h1><p>Open a project, review progress, and download a backup.</p></div></div>
          <section className="panel"><h2>Back up and restore</h2><p>Projects are saved in this browser. A backup can restore them on another device. Only search terms and public identifiers are sent to scholarly services when you request results.</p>
            <div className="button-row"><button className="button" onClick={backup}><ArrowDownToLine size={17} />Download backup</button><label className="button secondary upload">Import backup<input type="file" accept=".json,application/json" onChange={async event => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              input.value = '';
              setImported(null);
              if (!file) return;
              try {
                if (file.size > 10000000) throw Error('This backup exceeds the 10 MB import limit.');
                setImported(parseBackup(await file.text()).projects);
              } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not read this backup.'); }
            }} /></label></div>
            {imported && <div className="recommendation"><h3>Import preview: {imported.length} projects</h3><p>{imported.map(item => item.title).join(', ') || 'This backup contains no projects.'}</p><div className="button-row"><button className="button" onClick={importBackup} disabled={!imported.length}>Import as new copies</button><button className="button secondary" onClick={() => setImported(null)}>Cancel</button></div></div>}
          </section>
          <div className="project-grid">{projects.map(item => <article key={item.id} className="panel journey-project"><h2>{item.title}</h2><p>{item.discipline} · {item.papers.length} saved references</p>
            <div className="button-row"><button className="button" onClick={() => { selectProject(item.id); go('roadmap'); }}>Open roadmap</button><button className="button secondary" onClick={() => download('research-protocol.md', protocolMarkdown(item), 'text/markdown')}>Export protocol</button><button className="button secondary" onClick={() => download('evidence-matrix.csv', matrixCsv(item), 'text/csv')}>Export evidence</button><button className="text-button danger" onClick={() => removeProject(item)}>Delete project</button></div>
          </article>)}</div>
        </>}
        </div>
      </main>
    </div>
    <dialog ref={dialog} className="journey-dialog" aria-labelledby="project-dialog-title" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const boundary = event.shiftKey ? closeDialog.current : submitProject.current;
      if (event.target !== boundary) return;
      event.preventDefault();
      (event.shiftKey ? submitProject.current : closeDialog.current)?.focus();
    }}>
      <form onSubmit={event => { event.preventDefault(); create(); }}>
        <button ref={closeDialog} type="button" className="icon-button modal-close" onClick={() => dialog.current?.close()} aria-label="Close new project"><X size={20} /></button>
        <h2 id="project-dialog-title">Start a research project</h2><p>You can rename the project as your question develops.</p>
        <label className="field"><span>Working title</span><input ref={projectTitle} value={newTitle} maxLength={200} onChange={event => setNewTitle(event.target.value)} placeholder="For example, student well-being and digital habits" /></label>
        <button ref={submitProject} type="submit" className="button">Create project <ArrowRight size={17} /></button>
      </form>
    </dialog>
  </div>;
}
