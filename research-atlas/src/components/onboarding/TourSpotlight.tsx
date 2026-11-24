import { useLayoutEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { tourSteps } from './tourSteps';

type Props = { index: number; move: (step: number) => void; skip: () => void; dismiss: () => void; finish: (action?: 'project' | 'papers') => void };

export function TourSpotlight({ index, move, skip, dismiss, finish }: Props) {
  const ring = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const step = tourSteps[index];
  useLayoutEffect(() => {
    const box = card.current!;
    const frame = ring.current!;
    const controller = new AbortController();
    const { signal } = controller;
    let request = 0;
    let observed: Element | undefined;
    const resize = new ResizeObserver(schedule);
    resize.observe(box);
    function position() {
      const pad = 10;
      const vw = document.documentElement.clientWidth, vh = window.visualViewport?.height ?? innerHeight;
      const height = box.offsetHeight, width = box.offsetWidth;
      const target = step && Array.from(document.querySelectorAll<HTMLElement>('[data-tour="'+step.target+'"]')).find(el => {
        const b = el.getBoundingClientRect();
        return b.width && b.height && b.right > 0 && b.left < vw && el.checkVisibility?.() !== false;
      });
      if (target && observed !== target) {
        if (observed) resize.unobserve(observed);
        observed = target;
        resize.observe(target);
        target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
      }
      const b = target?.getBoundingClientRect();
      const visible = b && b.bottom > 0 && b.top < vh;
      if (frame.hidden !== !visible) frame.hidden = !visible;
      let x = (vw-width)/2, y = (vh-height)/2;
      if (visible) {
        frame.style.left = (b.left-3)+'px'; frame.style.top = (b.top-3)+'px';
        frame.style.width = (b.width+6)+'px'; frame.style.height = (b.height+6)+'px';
        if (vw - b.right >= width + 2*pad) { x = b.right + pad; y=b.top; }
        else if (b.left >= width + 2*pad) { x=b.left-width-pad; y=b.top; }
        else { x=b.left; y=vh-b.bottom >= height+pad || b.top < height+pad ? b.bottom+pad : b.top-height-pad; }
      }
      box.style.left = Math.max(pad, Math.min(x, vw-width-pad))+'px';
      box.style.top = Math.max(pad, Math.min(y, vh-height-pad))+'px';
    }
    function schedule() { cancelAnimationFrame(request); request=requestAnimationFrame(position); }
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.getElementById('root')!, { childList: true, subtree: true, attributes: true, attributeFilter: ['class','hidden'] });
    window.addEventListener('resize',schedule,{signal});
    window.addEventListener('scroll',schedule,{signal,capture:true});
    window.visualViewport?.addEventListener('resize',schedule,{signal});
    // Navigation can slide into view on a phone.
    document.addEventListener('transitionend',schedule,{signal});
    position(); heading.current?.focus({preventScroll:true});
    return () => { controller.abort(); mutations.disconnect(); resize.disconnect(); cancelAnimationFrame(request); };
  },[step]);
  return <div className="atlas-tour">
    <div aria-hidden="true" ref={ring} className="tour-target-ring" hidden/>
    <section role="dialog" aria-modal="false" aria-labelledby="coach-heading" aria-describedby="coach-copy" className="tour-coach" ref={card}>
      <header><span>{step ? 'Workspace tour · '+(index+1)+' of '+tourSteps.length : 'Workspace tour complete'}</span><button className="icon-button" aria-label="Close tour" onClick={dismiss}><X size={18}/></button></header>
      {step && <step.icon className="coach-icon" size={22}/>}
      <h2 ref={heading} tabIndex={-1} id="coach-heading">{step?.title ?? 'Ready to begin?'}</h2>
      <p id="coach-copy">{step?.text ?? 'Choose a starting point. You can revisit the tour from Preferences.'}</p>
      {step ? <div className="button-row"><button className="button secondary" disabled={!index} onClick={()=>move(index-1)}><ArrowLeft size={15}/>Back</button><button className="button" onClick={()=>move(index+1)}>Next<ArrowRight size={15}/></button><button className="text-button" onClick={skip}>Skip tour</button></div>
      : <div className="button-row"><button className="button" onClick={()=>finish('project')}>Start my first research project</button><button className="button secondary" onClick={()=>finish('papers')}>Explore some papers</button><button className="text-button" onClick={()=>finish()}>Finish tour</button></div>}
    </section>
  </div>;
}
