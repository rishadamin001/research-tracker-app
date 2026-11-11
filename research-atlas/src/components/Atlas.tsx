'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, BookOpen, CalendarDays, Check, ChevronRight, ClipboardCheck, Compass, FolderOpen, LibraryBig, Map, Menu, Plus, Search, Settings, X } from 'lucide-react';
import { createProject, matrixCsv, protocolMarkdown, type Project, type Stage } from '@/lib/model';
import { appVersion, createBackup, parseBackupFile, type BackupManifest } from '@/lib/backup';
import { download, loadWorkspace, saveWorkspace, subscribeWorkspace, WorkspaceConflictError } from '@/lib/storage';
import { disciplines } from '@/lib/content';
import { nextTask, roadmap, taskStatus, updateProject, type TaskStatus } from '@/lib/workflow';
import { readPreferences, writePreferences, type Preferences } from '@/lib/preferences';
import { PlanningWorkspace } from './PlanningWorkspace';
import { EvidenceWorkspace, PaperSearch, SearchNotebook } from './EvidenceWorkspace';
import { ExecutionWorkspace } from './ExecutionWorkspace';
import { ResearchPlanner } from './ResearchPlanner';
import { PlannerWorkbench } from './PlannerWorkbench';
import { BackupStatus, PrivacyData, backupDateKey, lastBackupDate } from './PrivacyData';
import { ConferencePlanner } from './ConferencePlanner';
import { ContextGuide } from './ContextGuide';
import { ReferenceExchange } from './ReferenceExchange';
import { WorkspacePreferences } from './WorkspacePreferences';
import { InstallApp } from './InstallApp';
import './discipline-explorer.css';
import { DuplicateReview } from './DuplicateReview';
import { PublicInformation } from './PublicInformation';
import { NextAction, ProjectShell, ResearchDashboard } from './CoherentWorkspace';
import { primaryDestination } from '@/lib/workspace-navigation';
import { AtlasLibrary } from './AtlasLibrary';
import { ProjectHistory } from './ProjectHistory';
import { StorageRecovery } from './StorageRecovery';
import { EvidenceDesk } from './EvidenceDesk';
import { BeginnerExplorer } from './BeginnerExplorer';
import type { BeginnerProjectSeed } from '@/lib/beginner-exploration';
import { JournalMatch } from './JournalMatch';
import { ResearchReadiness } from './ResearchReadiness';
import { ResearchNotebook } from './ResearchNotebook';

type View = 'overview' | 'primer' | 'explore' | 'guide' | 'conferences' | 'paper-search' | 'roadmap' | 'projects' | 'preferences' | 'privacy' | 'terms' | 'support' | 'library' | 'publish-hub' | 'history' | 'notebook' | Stage;
const mainNav = [
  { id: 'overview', title: 'Home', icon: Compass },
  { id: 'roadmap', title: 'My Research', icon: Map },
  { id: 'paper-search', title: 'Discover', icon: Search },
  { id: 'library', title: 'Library', icon: LibraryBig },
  { id: 'guide', title: 'Learn', icon: BookOpen },
  { id: 'publish-hub', title: 'Publish', icon: CalendarDays },
] as const;

function currentView(): View {
  const page = window.location.hash.slice(1).split('?')[0];
  if (roadmap.some(task => task.id === page) || mainNav.some(tab => tab.id === page) || ['primer', 'terms', 'support', 'projects', 'preferences', 'privacy', 'explore', 'conferences', 'history', 'notebook'].includes(page)) return page as View;
  return 'overview';
}

function currentTopic() {
  const [view, parameters] = window.location.hash.slice(1).split('?');
  if (!['discover', 'paper-search'].includes(view) || !parameters) return undefined;
  const topic = new URLSearchParams(parameters).get('topic');
  if (topic && topic.trim().length >= 3 && topic.length <= 300) return topic;
  return undefined;
}

function currentSourceSelection() {
  const [view, parameters] = window.location.hash.slice(1).split('?');
  if (!['writing', 'screen', 'extract', 'notebook'].includes(view) || !parameters) return undefined;
  const params = new URLSearchParams(parameters), paperId = params.get('paper'), claimId = params.get('claim');
  return paperId && paperId.length <= 500 ? { paperId, ...(claimId && claimId.length <= 500 ? { claimId } : {}) } : undefined;
}

function Status({ status }: { status: TaskStatus }) {
  return <span className={`task-status ${status.toLowerCase().replaceAll(' ', '-')}`}>{status === 'Complete' ? 'Ready for now' : status === 'In progress' ? 'Draft' : status}</span>;
}

export default function Atlas() {
  const [view, setView] = useState<View>(currentView);
  const [searchTopic, setSearchTopic] = useState(currentTopic);
  const [reusedSearch, setReusedSearch] = useState<Project['searches'][number]['run']>();
  const [sourceSelection, setSourceSelection] = useState(currentSourceSelection);
  const [literatureLayout, setLiteratureLayout] = useState<'desk' | 'cards'>('desk');
  const [evidenceEditing, setEvidenceEditing] = useState(false);
  const evidenceEditingRef = useRef(false);
  const currentRoute = useRef(window.location.hash);
  const [preferences, setPreferences] = useState(readPreferences);
  const [projects, setProjects] = useState<Project[]>([]);
  const [active, setActive] = useState('');
  const [ready, setReady] = useState(false);
  const [saveState, setSaveState] = useState('Opening local workspace…');
  const [storageConflict, setStorageConflict] = useState(false);
  const [storageOperation, setStorageOperation] = useState(false);
  const [recoveryRaw, setRecoveryRaw] = useState('');
  const [backupDate, setBackupDate] = useState(lastBackupDate);
  const [notice, setNotice] = useState('');
  const [publishSection, setPublishSection] = useState<'match' | 'venues' | 'conferences' | 'submission'>('match');
  const [discoverySection, setDiscoverySection] = useState<'search' | 'notebook'>('search');
  const [mobile, setMobile] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDiscipline, setNewDiscipline] = useState('');
  const [newGoal, setNewGoal] = useState('');
  const [newExperience, setNewExperience] = useState('');
  const [decision, setDecision] = useState('');
  const [imported, setImported] = useState<Project[] | null>(null);
  const [importManifest, setImportManifest] = useState<BackupManifest | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const projectTitle = useRef<HTMLInputElement>(null);
  const closeDialog = useRef<HTMLButtonElement>(null);
  const submitProject = useRef<HTMLButtonElement>(null);
  const main = useRef<HTMLElement>(null);
  const saveQueue = useRef(Promise.resolve());
  const loadFailed = useRef(false);
  const saveRevision = useRef(0);
  const importRevision = useRef(0);
  const diskRevision = useRef(0);
  const savedLocalRevision = useRef(0);
  const writeBlocked = useRef(false);

  useEffect(() => {
    const onHash = () => {
      if (evidenceEditingRef.current) { window.history.replaceState(null, '', currentRoute.current || '#overview'); setNotice('Save or cancel your open edits before leaving this view.'); return; }
      const destination = currentView();
      currentRoute.current = window.location.hash;
      setView(destination); setSearchTopic(currentTopic()); setReusedSearch(undefined); setSourceSelection(currentSourceSelection()); setMobile(false); window.scrollTo({ top: 0 }); main.current?.focus({ preventScroll: true });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let live = true;
    loadWorkspace().then(workspace => {
      if (!live) return;
      const records = workspace.projects;
      diskRevision.current = workspace.revision;
      if (workspace.recovery) { writeBlocked.current = true; setRecoveryRaw(workspace.recovery.rawJson); setNotice(workspace.recovery.message); }
      setProjects(records);
      let remembered: string | null = null;
      try { remembered = sessionStorage.getItem('atlas-active'); } catch { /* Session selection is optional. */ }
      setActive(records.find(record => record.id === remembered)?.id ?? records[0]?.id ?? '');
      setSaveState(workspace.recovery ? 'Recovery mode — saving paused' : 'Saved on this device');
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
    if (!ready || loadFailed.current || writeBlocked.current || saveRevision.current === savedLocalRevision.current) return;
    const revision = saveRevision.current;
    saveQueue.current = saveQueue.current.catch(() => {}).then(async () => {
      if (writeBlocked.current) return;
      diskRevision.current = await saveWorkspace(projects, diskRevision.current);
      savedLocalRevision.current = revision;
    }).then(() => {
      if (writeBlocked.current) return;
      if (revision === saveRevision.current) setSaveState('Saved on this device');
    }).catch(error => {
      if (error instanceof WorkspaceConflictError) { writeBlocked.current = true; setStorageConflict(true); setSaveState('Another tab saved changes — saving paused'); return; }
      if (revision === saveRevision.current) setSaveState('Could not save. Download a backup.');
    });
  }, [projects, ready]);

  useEffect(() => {
    if (!ready) return;
    return subscribeWorkspace(event => {
    if (event.revision <= diskRevision.current || loadFailed.current) return;
    writeBlocked.current = true;
    setStorageConflict(true);
    setSaveState('Another tab saved changes — saving paused');
    });
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (saveRevision.current === savedLocalRevision.current && !evidenceEditingRef.current) return;
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [ready]);

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

  function go(destination: View, topic?: string, reuse?: Project['searches'][number]['run']) {
    if (evidenceEditingRef.current) { setNotice('Save or cancel your open edits before leaving this view.'); return; }
    const carriedSource = ['screen', 'extract'].includes(destination) && ['screen', 'extract'].includes(view) ? sourceSelection : undefined;
    const hash = topic ? `#${destination}?${new URLSearchParams({ topic })}` : carriedSource ? `#${destination}?${new URLSearchParams({ paper: carriedSource.paperId })}` : `#${destination}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setView(destination);
    setSearchTopic(topic);
    setReusedSearch(reuse);
    setSourceSelection(carriedSource);
    currentRoute.current = hash;
    setMobile(false);
    window.scrollTo({ top: 0 });
    main.current?.focus({ preventScroll: true });
  }

  function openSource(destination: 'screen' | 'extract' | 'writing' | 'notebook', paperId: string, claimId?: string) {
    if (evidenceEditingRef.current) { setNotice('Save or cancel your open edits before leaving this view.'); return; }
    go(destination);
    const selection = { paperId, ...(claimId ? { claimId } : {}) };
    window.history.replaceState(null, '', `#${destination}?${new URLSearchParams({ paper: paperId, ...(claimId ? { claim: claimId } : {}) })}`);
    currentRoute.current = window.location.hash;
    setSourceSelection(selection);
    setLiteratureLayout('desk');
  }

  function selectProject(id: string) {
    if (evidenceEditingRef.current) { setNotice('Save or cancel your open edits before switching projects.'); return; }
    setActive(id);
    try { sessionStorage.setItem('atlas-active', id); } catch { /* Session selection is optional. */ }
  }

  function setOpenEdits(editing: boolean) {
    evidenceEditingRef.current = editing;
    setEvidenceEditing(editing);
  }

  function openNote(paperId?: string) {
    if (paperId) openSource('notebook', paperId);
    else go('notebook');
  }

  function markDirty() {
    ++saveRevision.current;
    setSaveState(writeBlocked.current ? 'Saving paused — keep a recovery backup' : loadFailed.current ? 'Local storage unavailable' : 'Saving…');
  }

  function update(patch: Partial<Project>) {
    markDirty();
    setProjects(items => items.map(item => item.id === active ? updateProject(item, patch) : item));
  }

  function openNewProject() {
    if (evidenceEditingRef.current) { setNotice('Save or cancel your evidence claim before starting another project.'); return; }
    if (!ready) return;
    if (projects.length >= 100) { setNotice('Back up and remove an old project before adding another.'); return; }
    setNewTitle('');
    setNewDiscipline('');
    setNewGoal('');
    setNewExperience(view === 'primer' ? 'Beginner' : '');
    dialog.current?.showModal();
    projectTitle.current?.focus();
  }

  function createFromExploration(seed: BeginnerProjectSeed) {
    if (!ready || evidenceEditingRef.current) return;
    if (projects.length >= 100) { setNotice('Back up and remove an old project before adding another.'); return; }
    const item = { ...createProject(seed.title), ...seed };
    markDirty(); setProjects(items => [item, ...items]); selectProject(item.id); go('roadmap');
  }

  function create() {
    const item = createProject(newTitle.trim() || 'Untitled research project');
    item.discipline = newDiscipline;
    item.goal = newGoal;
    item.experience = newExperience;
    markDirty();
    setProjects(items => [item, ...items]);
    selectProject(item.id);
    dialog.current?.close();
    if (view !== 'guide') go('profile');
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

  async function backup() {
    if (!ready) return;
    try {
      const data = await createBackup(projects, { sourceOrigin: window.location.origin, preferences });
      download('research-atlas-backup.json', JSON.stringify(data, null, 2), 'application/json');
      setBackupDate(data.createdAt);
      try { localStorage.setItem(backupDateKey, data.createdAt); } catch { /* Backup still downloads. */ }
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not prepare this backup. Your projects remain in this tab.'); }
  }

  function importBackup() {
    if (!ready || !imported) return;
    if (imported.length + projects.length > 100) { setNotice('This import would exceed the 100-project limit.'); return; }
    const copies = imported.map(item => ({ ...item, id: crypto.randomUUID(), title: `${item.title.slice(0, 19989)} (imported)` }));
    markDirty();
    setProjects(items => [...copies, ...items]);
    if (copies[0]) selectProject(copies[0].id);
    setImported(null);
    setImportManifest(null);
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
    <aside inert={storageOperation} className={`sidebar journey-sidebar ${mobile ? 'open' : ''}`}>
      <a href="#overview" className="brand" onClick={event => { event.preventDefault(); go('overview'); }}>
        <span className="brand-mark"><LibraryBig size={22} /></span><span>Research Atlas<small>RESEARCH WORKSPACE</small></span>
      </a>
      <button type="button" className="mobile-close icon-button" onClick={() => setMobile(false)} aria-label="Close navigation"><X /></button>
      <nav aria-label="Main navigation">
        {mainNav.map(item => <button type="button" key={item.id} className={`nav-item ${primaryDestination(view) === item.id ? 'active' : ''}`} aria-current={primaryDestination(view) === item.id ? 'page' : undefined} onClick={() => go(item.id)}><item.icon size={18} />{item.title}</button>)}
      </nav>
      <nav className="workspace-utility" aria-label="Workspace utilities"><button className="nav-item" onClick={() => go('projects')}><FolderOpen size={17} />My projects</button><button className="nav-item" onClick={() => go('preferences')}><Settings size={17} />Preferences</button><button className="nav-item" onClick={() => go('privacy')}><ClipboardCheck size={17} />Privacy & data</button></nav>
      {project && <div className="journey-active">
        <span className="eyebrow">ACTIVE PROJECT</span><strong>{project.title}</strong>
        {next && <button className="text-button" onClick={() => go(next.id)}>Continue project <ArrowRight size={15} /></button>}
        <button className="text-button" onClick={() => go('screen')}><LibraryBig size={15} />Saved literature <span className="nav-count">{project.papers.length}</span></button>
      </div>}
      <p className="journey-sidebar-note">Project data is stored in this browser. Download a backup from My projects.</p>
    </aside>
    <div className="main-shell">
      <header inert={storageOperation} className="topbar journey-topbar">
        <button type="button" className="mobile-toggle icon-button" onClick={() => setMobile(true)} aria-label="Open navigation" aria-expanded={mobile}><Menu /></button>
        <div className="journey-breadcrumb">{current ? <><button className="text-button" onClick={() => go('roadmap')}>Project roadmap</button><ChevronRight size={15} /><span>{current.title}</span></> : <span>{mainNav.find(item => item.id === view)?.title ?? 'Get started'}</span>}</div>
        <span className="saved" role="status">{saveState}</span>
        <label className="mode-select"><span>Workspace</span><select aria-label="Guidance mode" value={preferences.interfaceMode ?? 'guided'} onChange={event => changePreferences({ interfaceMode: event.target.value as 'guided' | 'expert' })}><option value="guided">Step-by-step guidance</option><option value="expert">Focus workspace</option></select></label>
        <button className="button small" onClick={openNewProject} disabled={!ready}><Plus size={16} />New project</button>
      </header>
      <main id="main" ref={main} tabIndex={-1} aria-busy={storageOperation} data-layout={['guide', 'primer', 'terms', 'privacy', 'support'].includes(view) ? 'reading' : ['paper-search', 'library', 'screen', 'extract', 'writing', 'discover'].includes(view) ? 'research' : 'working'} data-interface={preferences.interfaceMode ?? 'guided'}>
        {(storageConflict || recoveryRaw) && <section className="error" role="alert"><h2>{storageConflict ? 'Another tab saved changes' : 'Some stored records need recovery'}</h2><p>Saving is paused so this tab cannot overwrite stored work. Download the copy in this tab before loading the latest saved workspace.</p><div className="button-row"><button className="button secondary" onClick={backup}>Download this tab’s backup</button>{recoveryRaw && <button className="button secondary" onClick={() => download('research-atlas-recovery-raw.json', recoveryRaw, 'application/json')}>Download original stored data</button>}<button className="button secondary" disabled={storageOperation} onClick={() => window.location.reload()}>Reload latest saved workspace</button></div></section>}
        {ready && projects.length > 0 && (saveState === 'Local storage unavailable' || saveState.startsWith('Could not save')) && <section className="error" role="alert"><p>Changes are still available in this tab. Download a recovery copy before reloading.</p><button type="button" className="button secondary" onClick={backup}>Download recovery backup</button></section>}
        {notice && <div className="notice" role="status">{notice}<button className="icon-button" onClick={() => setNotice('')} aria-label="Dismiss notice"><X size={16} /></button></div>}
        <div className="stage-frame" key={view} inert={storageOperation}>

        {view === 'overview' && project && <ResearchDashboard project={project} onNavigate={go} onOpenSource={id => openSource('screen', id)} backupDate={backupDate} saveState={saveState} />}
        {view === 'overview' && !project && <>
          <section className="journey-hero">
            <span className="eyebrow">RESEARCH ATLAS</span>
            <h1>Turn curiosity into<br />a research project.</h1>
            <p>Research answers a focused question using evidence and a method you can explain. Start with an idea, then save your sources and decisions as the project takes shape.</p>
            <button className="button light" onClick={project ? () => go('roadmap') : openNewProject} disabled={!ready}>{project ? 'Resume your project' : 'Start a research project'}<ArrowRight size={18} /></button>
          </section>
          <section className="entry-grid intent-grid" aria-label="Choose a starting point">
            <button className="entry-card" onClick={() => go('primer')}><BookOpen /><strong>I’m new to research</strong><span>Explore an interest and meet your first real papers.</span><span className="intent-action">Start guided path <ArrowRight size={17} /></span></button>
            <button className="entry-card" onClick={openNewProject} disabled={!ready}><Plus /><strong>I already have a topic or question</strong><span>Build a project roadmap around what you want to understand.</span><span className="intent-action">Start a project <ArrowRight size={17} /></span></button>
            <button className="entry-card" onClick={() => go('paper-search')}><Search /><strong>I need to find papers</strong><span>Search first. Create a project when you want to save evidence.</span><span className="intent-action">Search for papers <ArrowRight size={17} /></span></button>
          </section>
          <nav className="secondary-paths" aria-label="More ways to explore"><button className="text-button" onClick={() => go('explore')}>Explore disciplines</button><button className="text-button" onClick={() => go('conferences')}>Find a conference</button><button className="text-button" onClick={() => go('projects')}>Open saved projects</button><button className="text-button" onClick={() => go('guide')}>Research planner</button></nav>
          <p className="muted">Your projects stay in this browser. Search sends only the terms you enter to the scholarly provider.</p>
        </>}

        {view === 'paper-search' && <>
          <div className="page-heading"><div><span className="eyebrow">LITERATURE</span><h1>Paper search</h1><p>Look up papers by topic or title. Start with relevance, or sort retrieved papers by journal quartile, date, citations or available prices.</p></div></div>
          <nav className="discover-tools" aria-label="Discovery tools"><button className="button secondary" aria-pressed={discoverySection === 'search'} onClick={() => setDiscoverySection('search')}>Search</button><button className="button secondary" onClick={() => go('library')}>Explore connections</button><button className="button secondary" aria-pressed={discoverySection === 'notebook'} onClick={() => setDiscoverySection('notebook')}>Search history</button><button className="text-button" onClick={() => go('explore')}>Explore disciplines</button></nav>
          {discoverySection === 'notebook' ? <SearchNotebook project={project} onReuse={search => { setDiscoverySection('search'); go('paper-search', search.run?.userQuery ?? search.query, search.run); }} /> : ready ? <PaperSearch key={`${project?.id ?? 'standalone'}-${searchTopic ?? ''}-${reusedSearch?.id ?? ''}`} project={project} initialQuery={searchTopic} initialRun={reusedSearch} update={project ? update : undefined} notify={setNotice} onNote={openNote} openProjects={() => go('projects')} />
            : <p className="panel" role="status">Opening paper search…</p>}
        </>}
        {view === 'library' && <AtlasLibrary projects={projects} activeProjectId={active} onChangeProjects={items => { markDirty(); setProjects(current => items.map(item => { const previous = current.find(p => p.id === item.id); return previous && previous !== item ? updateProject(previous, item) : item; })); }} onOpenProject={id => { selectProject(id); go('screen'); }} notify={setNotice} />}
        {view === 'guide' && <ResearchPlanner
         
          onStart={() => go('primer')}
          onConferences={() => go('conferences')}
          openSection={target => go(target === 'analysis' ? 'data' : target === 'draft' ? 'writing' : target === 'publish' ? 'publication' : target)}
          workbench={<section className="panel"><h2>Plan beside your project</h2><p>Your timeline, budget, submission pack and reviewer replies live in your project Overview.</p><button className="button" onClick={project ? () => go('roadmap') : openNewProject}>{project ? 'Open project plan' : 'Start a project'}</button></section>}
        />}
        {view === 'publish-hub' && <><div className="page-heading"><div><span className="eyebrow">SHARE YOUR RESEARCH</span><h1>Publish your research</h1><p>Keep venue checks, conference dates, submission preparations, and reviewer replies together.</p></div></div><nav className="publish-tools" aria-label="Publishing tools">{([['match', 'Journal Match'], ['venues', 'Venue finder'], ['conferences', 'Conference finder'], ['submission', 'Submission & reviewer replies']] as const).map(([id,title]) => <button className="button secondary" key={id} aria-pressed={publishSection === id} onClick={() => setPublishSection(id)}>{title}</button>)}</nav>{publishSection === 'match' ? <JournalMatch key={project?.id ?? 'standalone'} project={project} update={update} onProjects={() => go('projects')} /> : publishSection === 'conferences' ? <ConferencePlanner /> : project ? publishSection === 'venues' ? <ExecutionWorkspace project={project} mode="publication" update={update} /> : <PlannerWorkbench project={project} update={update} onStart={openNewProject} onProjects={() => go('projects')} ready={ready} /> : <section className="panel"><h2>Start with a project</h2><p>Venue checks and submission notes belong to a particular study. You can browse conferences without creating a project.</p><button className="button" onClick={openNewProject}>Start a project</button></section>}</>}
        {view === 'conferences' && <ConferencePlanner />}
        {view === 'preferences' && <><WorkspacePreferences value={preferences} onChange={changePreferences} /><InstallApp /></>}
        {view === 'privacy' && <PrivacyData backupDate={backupDate} onBackup={backup} />}
        {(view === 'terms' || view === 'support') && <PublicInformation page={view} />}

        {view === 'primer' && <BeginnerExplorer ready={ready} onCreateProject={createFromExploration} onOpenSearch={query => go('paper-search', query)} onLearn={() => go('guide')} />}

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

        {(view === 'roadmap' || view === 'notebook' || current) && !project && <section className="panel empty-state">
          <FolderOpen size={28} /><h1>Create your research project</h1><p>Set a direction and keep your questions, evidence, and plans together.</p>
          {view === 'discover' && searchTopic
            ? <button className="button" onClick={() => searchDiscipline(searchTopic)} disabled={!ready}><Search size={17} />Search {searchTopic}</button>
            : <button className="button" onClick={openNewProject} disabled={!ready}><Plus size={17} />Start a project</button>}
        </section>}

        {(view === 'roadmap' || view === 'history' || view === 'notebook' || current) && project && <ProjectShell project={project} view={view} onNavigate={go} />}
        {view === 'notebook' && project && <ResearchNotebook
          key={`${project.id}:${sourceSelection?.paperId ?? ''}`}
          project={project}
          initialPaperId={sourceSelection?.paperId}
          onSaveNotes={notebookNotes => update({ notebookNotes })}
          onOpenEvidence={paperId => openSource('extract', paperId)}
          onEditingChange={setOpenEdits}
        />}
        {view === 'history' && project && <><div className="page-heading"><div><span className="eyebrow">RESEARCH TRAIL</span><h1>Project history</h1><p>Inspect how questions, sources and decisions shaped this project.</p></div></div><ProjectHistory project={project} /></>}
        {view === 'roadmap' && project && <>
          <div className="page-heading"><div><span className="eyebrow">PROJECT ROADMAP</span><h1>{project.title}</h1><p>{project.discipline}{project.goal ? ` · ${project.goal}` : ''}</p></div><button className="button secondary" onClick={() => go('projects')}><ArrowDownToLine size={16} />Export project</button></div>
          <div className="button-row"><button className="button secondary" onClick={() => go('history')}>Project history</button><button className="button secondary" onClick={() => go('projects')}>Switch or back up projects</button></div>
          <details className="panel"><summary>My plan — timeline, budget & submission</summary><PlannerWorkbench project={project} update={update} onStart={openNewProject} onProjects={() => go('projects')} ready={ready} /></details>
          <ResearchReadiness project={project} onNavigate={go} />
          {next && <section className="next-task"><div><span className="eyebrow">YOUR NEXT USEFUL STEP</span><h2>{next.title}</h2><p>{next.detail}</p><small>Work at your own pace. Recorded progress is a planning aid, not a research-quality score.</small></div><button className="button" onClick={() => go(next.id)}>Open next task <ArrowRight size={17} /></button></section>}
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
          <ContextGuide stage={current.id} expanded={preferences.interfaceMode !== 'expert' && !['question', 'methods', 'data', 'screen', 'extract', 'writing'].includes(current.id)} />
          {view === 'screen' && <DuplicateReview project={project} update={update} disabled={evidenceEditing} />}
          {view === 'profile' || view === 'topic' || view === 'question' || view === 'methods' ? <PlanningWorkspace key={`${project.id}-${view}`} project={project} mode={view} interfaceMode={preferences.interfaceMode} saveState={saveState} update={update} next={advance} /> : null}
          {(view === 'screen' || view === 'extract') && <nav className="button-row" aria-label="Literature workspace layout"><button type="button" className="button secondary" aria-pressed={literatureLayout === 'desk'} onClick={() => setLiteratureLayout('desk')}>Evidence Desk</button><button type="button" className="button secondary" aria-pressed={literatureLayout === 'cards'} disabled={evidenceEditing} onClick={() => setLiteratureLayout('cards')}>Cards & matrix</button></nav>}
          {(view === 'screen' || view === 'extract') && literatureLayout === 'desk' && <EvidenceDesk key={`${project.id}-${view}`} project={project} mode={view} interfaceMode={preferences.interfaceMode} initialPaperId={sourceSelection?.paperId} update={update} onWrite={(paperId, claimId) => openSource('writing', paperId, claimId)} onNote={openNote} onEditingChange={setOpenEdits} onSelectionChange={paperId => { if (!paperId || project.papers.filter(paper => paper.id === paperId).length !== 1) return; setSourceSelection({ paperId }); window.history.replaceState(null, '', `#${view}?${new URLSearchParams({ paper: paperId })}`); currentRoute.current = window.location.hash; }} />}
          {view === 'discover' || (view === 'screen' || view === 'extract') && literatureLayout === 'cards' ? <EvidenceWorkspace key={`${project.id}-${view}-${searchTopic ?? ''}`} project={project} mode={view} update={update} notify={setNotice} onNote={openNote} initialQuery={view === 'discover' ? searchTopic : undefined} /> : null}
          {view === 'data' || view === 'writing' || view === 'publication' ? <ExecutionWorkspace key={`${project.id}-${view}-${view === 'writing' ? `${sourceSelection?.paperId ?? ''}-${sourceSelection?.claimId ?? ''}` : ''}`} project={project} mode={view} interfaceMode={preferences.interfaceMode} initialSelection={view === 'writing' ? sourceSelection : undefined} onNote={openNote} update={update} /> : null}
          <NextAction project={project} onNavigate={go} />
          <div className="journey-actions"><button className="button secondary" onClick={() => go('roadmap')}>Back to roadmap</button>{view !== 'profile' && view !== 'topic' && view !== 'question' && view !== 'methods' && <button className="button" onClick={advance}>{view === 'publication' ? 'Return to roadmap' : 'Continue to next task'}<ArrowRight size={17} /></button>}</div>
        </>}

        {view === 'projects' && <>
          <div className="page-heading"><div><span className="eyebrow">TRACK YOUR WORK</span><h1>My projects</h1><p>Open a project, review progress, and download a backup.</p></div></div>
          <section className="panel"><h2>Back up and restore</h2><p>Download a backup and keep a copy somewhere you can access if this device is lost. On another device, import the file and compare the project and source counts before relying on the restored copy.</p><BackupStatus date={backupDate} />
            <div className="button-row"><button className="button" onClick={backup} disabled={!ready}><ArrowDownToLine size={17} />Download backup</button><label className="button secondary upload">Import backup<input type="file" disabled={!ready} accept=".json,application/json" onChange={async event => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              const revision = ++importRevision.current;
              input.value = '';
              setImported(null);
              if (!file) return;
              try {
                if (file.size > 10000000) throw Error('This backup exceeds the 10 MB import limit.');
                const backupFile = await parseBackupFile(await file.text());
                if (revision !== importRevision.current) return;
                setImported(backupFile.projects);
                setImportManifest(backupFile.manifest);
              } catch (error) { if (revision === importRevision.current) setNotice(error instanceof Error ? error.message : 'Could not read this backup.'); }
            }} /></label></div>
            {imported && <div className="recommendation"><h3>Import preview: {imported.length} projects</h3><p>{imported.map(item => item.title).join(', ') || 'This backup contains no projects.'}</p>
              {importManifest && <><p>Backup v{importManifest.backupVersion} · app {importManifest.appVersion} · created {new Date(importManifest.createdAt).toLocaleString()} · source: {importManifest.sourceOrigin}</p>
                <p>{importManifest.paperCount} references · {importManifest.screeningEventCount} screening events · {importManifest.evidenceClaimCount} evidence claims · {importManifest.notebookNoteCount} notebook notes. {importManifest.integrity === 'verified' ? 'Integrity checksum verified.' : 'Older backup: no checksum was recorded.'}</p>
                <p>Your existing projects and display preferences stay in place. {importManifest.preferencesIncluded && 'Display preferences are present in the backup for reference.'} New project copies receive new identifiers.</p></>}
              <div className="button-row"><button className="button" onClick={importBackup} disabled={!ready || !imported.length}>Import as new copies</button><button className="button secondary" onClick={() => { ++importRevision.current; setImported(null); setImportManifest(null); }}>Cancel</button></div></div>}
          </section>
          {project && <ReferenceExchange key={project.id} project={project} onImport={papers => update({ papers })} />}
          <div className="project-grid">{projects.map(item => <article key={item.id} className="panel journey-project"><h2>{item.title}</h2><p>{item.discipline} · {item.papers.length} saved references</p>
            <div className="button-row"><button className="button" onClick={() => { selectProject(item.id); go('roadmap'); }}>Open roadmap</button><button className="button secondary" onClick={() => download('research-protocol.md', protocolMarkdown(item), 'text/markdown')}>Export protocol</button><button className="button secondary" onClick={() => download('evidence-matrix.csv', matrixCsv(item), 'text/csv')}>Export evidence</button><button className="text-button danger" onClick={() => removeProject(item)}>Delete project</button></div>
          </article>)}</div>
        </>}
        </div>
        {view === 'projects' && <StorageRecovery revision={diskRevision.current} disabled={saveRevision.current !== savedLocalRevision.current || saveState === 'Saving…' || loadFailed.current || storageConflict} onBusyChange={setStorageOperation} onRestored={workspace => { diskRevision.current = workspace.revision; loadFailed.current = false; writeBlocked.current = false; setStorageConflict(false); setRecoveryRaw(''); savedLocalRevision.current = saveRevision.current; setProjects(workspace.projects); selectProject(workspace.projects[0]?.id ?? ''); setSaveState('Saved on this device'); requestAnimationFrame(() => main.current?.focus({ preventScroll: true })); }} notify={setNotice} />}
        <footer inert={storageOperation} className="public-footer" aria-label="Research Atlas information"><a href="#privacy" onClick={event => { event.preventDefault(); go('privacy'); }}>Privacy & data</a><a href="#terms" onClick={event => { event.preventDefault(); go('terms'); }}>Terms</a><a href="#support" onClick={event => { event.preventDefault(); go('support'); }}>Support</a><span className="muted">Research Atlas {appVersion} beta · Free · Stored on your device</span></footer>
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
        <label className="field"><span>Broad discipline</span><select value={newDiscipline} onChange={event => setNewDiscipline(event.target.value)}><option value="">Choose later</option>{disciplines.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
        <label className="field"><span>What are you trying to understand?</span><input value={newGoal} onChange={event => setNewGoal(event.target.value)} maxLength={500} placeholder="A topic, experience, pattern, or problem — not sure is fine" /></label>
        <label className="field"><span>Your experience</span><select value={newExperience} onChange={event => setNewExperience(event.target.value)}><option value="">Choose later</option><option value="Beginner">First research project</option><option value="Some experience">Some experience</option><option value="Experienced">Experienced researcher</option></select></label>
        <button ref={submitProject} type="submit" className="button">Create project <ArrowRight size={17} /></button>
      </form>
    </dialog>
  </div>;
}
