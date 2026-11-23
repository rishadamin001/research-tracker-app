import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookMarked, ClipboardCheck, Compass, Download, FilePenLine, Files, FolderPlus, NotebookPen, Search } from 'lucide-react';
import './workspace-tour.css';

const stops = [
  { title: 'Home dashboard', path: 'Home', icon: Compass, text: 'Return here to pick up your active project. Your next task, recent sources and notes are together.' },
  { title: 'Create a project', path: 'New project', icon: FolderPlus, text: 'Start with a working title. You can revise the title and add your question as you read.' },
  { title: 'Find papers', path: 'Discover', icon: Search, text: 'Search a few keywords, such as “commuter students”. Compare titles and abstracts from a scholarly database.' },
  { title: 'Save to Library', path: 'Discover → Save paper', icon: BookMarked, text: 'Save a useful paper to your project. Library brings together references across your projects.' },
  { title: 'Screen a paper', path: 'My Research → Literature', icon: ClipboardCheck, text: 'Choose Include, Maybe or Exclude. Write a reason, such as “Interviews cover the students in my question”.' },
  { title: 'Researcher’s Notebook', path: 'My Research → Notebook', icon: NotebookPen, text: 'Catch your own ideas and questions here. Link a note to its paper so you can find the context later.' },
  { title: 'Evidence Desk', path: 'My Research → Evidence', icon: Files, text: 'Record what the paper reports and its page or table. Use the interpretation field for what you think it means.' },
  { title: 'Writing Studio', path: 'My Research → Write', icon: FilePenLine, text: 'Build a section around a finding. Insert its linked citation, then check the bibliography before exporting.' },
  { title: 'Export and back up', path: 'Write · My projects', icon: Download, text: 'Download a Word draft from Write. In My projects, download a backup to keep your editable work and check that the file opens.' },
] as const;

type TourProgress = { step: number; status: 'new' | 'started' | 'skipped' | 'complete' };
const storageKey = 'atlas-workspace-tour-v1';

function readProgress(): TourProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? 'null');
    if (saved && ['started', 'skipped', 'complete'].includes(saved.status)
      && Number.isInteger(saved.step) && saved.step >= 0 && saved.step < stops.length) return saved;
  } catch { /* The map also works without device storage. */ }
  return { step: 0, status: 'new' };
}

export function WorkspaceTour({ preferences = false, onDismiss }: { preferences?: boolean; onDismiss: () => void }) {
  const [progress, setProgress] = useState(readProgress);
  const [open, setOpen] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => { if (open) heading.current?.focus(); }, [open, progress.step]);

  function remember(status: TourProgress['status'], step = progress.step) {
    const updated = { status, step };
    setProgress(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setStorageError(false);
    } catch { setStorageError(true); }
  }
  function close(status: 'skipped' | 'complete' | 'started') {
    remember(status);
    setOpen(false);
    requestAnimationFrame(() => {
      if (trigger.current) trigger.current.focus();
      else onDismiss();
    });
  }
  const hidden = !preferences && (progress.status === 'complete' || progress.status === 'skipped');
  const { title, path, icon: Icon, text } = stops[progress.step];
  return <>
    {!hidden && <section className="panel workspace-tour" aria-label="Workspace tour">
      {!open ? <div className="tour-invite">
        <div><h2>Workspace tour</h2><p>See where to find papers, record evidence and back up a project.</p></div>
        <div className="button-row"><button type="button" ref={trigger} className="button secondary" onClick={() => {
          remember('started', progress.status === 'complete' ? 0 : progress.step);
          setOpen(true);
        }}>{progress.status === 'complete' ? 'Replay tour' : progress.status === 'started' ? 'Resume tour' : 'Take the tour'}</button>
        {!preferences && <button type="button" className="text-button" onClick={() => close('skipped')}>Skip tour</button>}</div>
      </div> : <>
        <div className="tour-progress"><span>Workspace tour · {progress.step + 1} of {stops.length}</span><button type="button" className="text-button" onClick={() => close('skipped')}>Skip tour</button></div>
        <ol className="tour-map" aria-label="Tour stops">{stops.map((stop, index) => <li key={stop.title}>
          <button type="button" aria-current={index === progress.step ? 'step' : undefined} aria-label={stop.title} title={stop.title} onClick={() => remember('started', index)}>
            <stop.icon size={18} aria-hidden="true" />
          </button>
        </li>)}</ol>
        <div className="tour-card"><Icon size={24} aria-hidden="true" /><div>
          <h3 ref={heading} tabIndex={-1}>{title}</h3><small>{path}</small><p>{text}</p>
        </div></div>
        <div className="button-row"><button type="button" className="button secondary" disabled={!progress.step} onClick={() => remember('started', progress.step - 1)}><ArrowLeft size={16} />Back</button>
          <button type="button" className="button" onClick={() => progress.step === stops.length - 1 ? close('complete') : remember('started', progress.step + 1)}>{progress.step === stops.length - 1 ? 'Finish tour' : 'Next stop'}<ArrowRight size={16} /></button>
          <button type="button" className="text-button" onClick={() => close('started')}>Continue later</button></div>
      </>}
    </section>}
    {storageError && <p role="status">Your tour choice applies here. This browser could not save it for your next visit.</p>}
  </>;
}
