import { useLayoutEffect, useRef } from 'react';

export function RemoveConferenceDialog({ title, onCancel, onRemove }: {
  title: string; onCancel: () => void; onRemove: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current!;
    const opener = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  return <dialog ref={ref} aria-labelledby="remove-tracked-event" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id="remove-tracked-event">Remove this conference?</h2>
    <p>Your tracker entry for {title}, including your private notes, will be removed from this browser.</p>
    <div className="conference-actions">
      <button type="button" className="button secondary" onClick={onCancel}>Keep event</button>
      <button type="button" className="button" onClick={onRemove}>Remove event</button>
    </div>
  </dialog>;
}
