import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = { title: string; children: ReactNode; onClose: () => void; sheet?: boolean; description?: string };

export function AtlasDialog({ title, children, onClose, sheet, description }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const label = useId();
  useLayoutEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();
    dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    return () => { dialog.close(); if (trigger?.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return <dialog ref={ref} className={'atlas-dialog' + (sheet ? ' atlas-sheet' : '')} aria-labelledby={label}
    aria-describedby={description ? label + '-description' : undefined}
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><h2 id={label}>{title}</h2><button type="button" className="icon-button" aria-label={'Close ' + title} onClick={onClose}><X size={19}/></button></header>
    {description && <p id={label+'-description'}>{description}</p>}
    {children}
  </dialog>;
}
