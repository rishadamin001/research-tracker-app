import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function HelpPopover({ title, onClose, children }: { title:string; onClose:()=>void; children:ReactNode }) {
  const panel=useRef<HTMLElement>(null);
  const opener=useRef<Element|null>(null);
  useEffect(()=>{
    opener.current=document.activeElement;
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();onClose(); if(opener.current instanceof HTMLElement) opener.current.focus();}};
    const outside=(event:PointerEvent)=>{if(event.target instanceof Node && !panel.current?.contains(event.target) && !opener.current?.contains(event.target)) onClose();};
    panel.current?.focus({preventScroll:true});
    document.addEventListener('keydown',escape);
    document.addEventListener('pointerdown',outside);
    return ()=>{document.removeEventListener('keydown',escape);document.removeEventListener('pointerdown',outside);};
  },[onClose]);
  return <section className="help-popover" role="dialog" aria-label={title} ref={panel} tabIndex={-1}>
    <header><h3>{title}</h3><button type="button" className="icon-button" aria-label={'Close '+title} onClick={()=>{onClose(); if(opener.current instanceof HTMLElement) opener.current.focus();}}><X size={16}/></button></header>{children}
  </section>;
}
