import { useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';
import { readTour, writeTour, type TourStatus } from './onboardingStorage';
import { tourSteps } from './tourSteps';
import { TourSpotlight } from './TourSpotlight';
import { WelcomeDialog } from './WelcomeDialog';

type Props = { view: string; guided: boolean; existing: boolean; openMenu: (open: boolean) => void; startProject: () => void; explore: () => void; papers: () => void };

export function WorkspaceOrientation({ view, guided, existing, openMenu, startProject, explore, papers }: Props) {
  const [state, setState] = useState(readTour);
  const [active, setActive] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const firstView = useRef(view);
  const welcome = state.status === 'new' && !existing && firstView.current === 'overview' && view === 'overview' && guided;
  const visible = active;
  useEffect(() => {
    if (state.status==='new' && (existing || firstView.current!=='overview' || !guided)) writeTour({status:'dismissed',step:0});
  }, [state.status,existing,guided]);
  function remember(status: TourStatus, step: number) {
    const next = {status, step};
    writeTour(next); setState(next);
  }
  function close(status: TourStatus, restore = true) {
    remember(status, state.step); setActive(false); openMenu(false);
    if (restore) requestAnimationFrame(() => (trigger.current ?? document.querySelector<HTMLElement>('#main'))?.focus({preventScroll:true}));
  }
  function start(replay: boolean) {
    remember(replay ? 'replay-requested' : 'in-progress', replay ? 0 : state.step);
    setActive(true);
  }
  useEffect(() => {
    if (!visible) return;
    const media = matchMedia('(max-width: 900px)');
    const adjust = () => openMenu(media.matches && !!tourSteps[state.step] && tourSteps[state.step].target !== 'new-project');
    adjust(); media.addEventListener('change',adjust);
    return () => media.removeEventListener('change',adjust);
  }, [openMenu, state.step, visible, view]);
  useEffect(() => () => { if (active) openMenu(false); },[active,openMenu]);
  useEffect(() => {
    if (!visible) return;
    const escape = (e: KeyboardEvent) => { if(e.key==='Escape'){ e.preventDefault(); close('in-progress'); } };
    const back = () => close('in-progress');
    const Watcher = (window as Window & { CloseWatcher?: new () => EventTarget & {destroy:()=>void} }).CloseWatcher;
    const watcher=Watcher ? new Watcher() : undefined;
    watcher?.addEventListener('close',back);
    document.addEventListener('keydown',escape);
    window.addEventListener('popstate',back);
    return () => { watcher?.destroy(); document.removeEventListener('keydown',escape); window.removeEventListener('popstate',back); };
  });
  if (welcome) return <WelcomeDialog start={()=>start(false)} skip={()=>close('skipped')} explore={()=>{close('dismissed',false); explore();}}/>;
  if (visible) return <TourSpotlight index={state.step} move={step=>remember('in-progress',step)} skip={()=>close('skipped')} dismiss={()=>close('in-progress')} finish={action=>{
    close('completed',!action);
    if(action==='project') startProject();
    if(action==='papers') papers();
  }}/>;
  const resume = state.status === 'in-progress' || state.status === 'replay-requested';
  if(view!=='preferences' && !(view==='overview' && guided && resume)) return null;
  return <section className="panel orientation-invite" aria-label="Workspace tour"><Compass aria-hidden="true"/><div><h2>Workspace tour</h2><p>Find the tools for each part of your research.</p></div><button ref={trigger} type="button" className="button secondary" onClick={()=>start(view==='preferences' || !resume)}>{view==='preferences' ? 'Replay workspace tour' : 'Resume tour'}</button></section>;
}
