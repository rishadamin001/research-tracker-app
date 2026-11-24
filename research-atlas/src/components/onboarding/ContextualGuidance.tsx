import { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { hints, type Hint } from './researchHints';
const sessionSeen = new Set<Hint>();
export function ContextualGuidance({ openLibrary }: { openLibrary: () => void }) {
  const [active, setActive] = useState<Hint>();
  useEffect(() => {
    function receive(event: Event) {
      const hint = (event as CustomEvent<Hint>).detail;
      if (!Object.hasOwn(hints,hint) || sessionSeen.has(hint)) return;
      const key='atlas-guidance-v2-'+hint;
      try { if(localStorage.getItem(key)) return; localStorage.setItem(key,'seen'); } catch { /* Session-only fallback. */ }
      sessionSeen.add(hint); setActive(hint);
    }
    window.addEventListener('atlas-research-hint',receive);
    return ()=>window.removeEventListener('atlas-research-hint',receive);
  },[]);
  if (!active) return null;
  return <aside className="context-coach" aria-label="Research guidance"><Lightbulb size={18}/><div role="status"><strong>{hints[active][0]}</strong><p>{hints[active][1]}</p></div><div className="button-row">{active==='paper' && <button className="button secondary small" onClick={openLibrary}>Open Library</button>}<button className="text-button" onClick={()=>setActive(undefined)}>{active==='paper'?'Continue searching':'Got it'}</button></div></aside>;
}
