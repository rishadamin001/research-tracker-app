import { useRef, type RefObject } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { disciplines } from '@/lib/content';

type Props = {
  dialog: RefObject<HTMLDialogElement | null>;
  projectTitle: RefObject<HTMLInputElement | null>;
  title: string;
  discipline: string;
  goal: string;
  experience: string;
  onTitleChange: (value: string) => void;
  onDisciplineChange: (value: string) => void;
  onGoalChange: (value: string) => void;
  onExperienceChange: (value: string) => void;
  onSubmit: () => void;
};

export function NewProjectDialog({ dialog, projectTitle, title, discipline, goal, experience,
  onTitleChange, onDisciplineChange, onGoalChange, onExperienceChange, onSubmit }: Props) {
  const closeDialog = useRef<HTMLButtonElement>(null);
  const submitProject = useRef<HTMLButtonElement>(null);

  return <dialog ref={dialog} className="journey-dialog" aria-labelledby="project-dialog-title" onKeyDown={event => {
    if (event.key !== 'Tab') return;
    const boundary = event.shiftKey ? closeDialog.current : submitProject.current;
    if (event.target !== boundary) return;
    event.preventDefault();
    (event.shiftKey ? submitProject.current : closeDialog.current)?.focus();
  }}>
    <form onSubmit={event => { event.preventDefault(); onSubmit(); }}>
      <button ref={closeDialog} type="button" className="icon-button modal-close" onClick={() => dialog.current?.close()} aria-label="Close new project"><X size={20} /></button>
      <h2 id="project-dialog-title">Start a research project</h2><p>You can rename the project as your question develops.</p>
      <label className="field"><span>Working title</span><input ref={projectTitle} value={title} maxLength={200} onChange={event => onTitleChange(event.target.value)} placeholder="For example, student well-being and digital habits" /></label>
      <label className="field"><span>Broad discipline</span><select value={discipline} onChange={event => onDisciplineChange(event.target.value)}><option value="">Choose later</option>{disciplines.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
      <label className="field"><span>What are you trying to understand?</span><input value={goal} onChange={event => onGoalChange(event.target.value)} maxLength={500} placeholder="A topic, experience, pattern, or problem — not sure is fine" /></label>
      <label className="field"><span>Your experience</span><select value={experience} onChange={event => onExperienceChange(event.target.value)}><option value="">Choose later</option><option value="Beginner">First research project</option><option value="Some experience">Some experience</option><option value="Experienced">Experienced researcher</option></select></label>
      <button ref={submitProject} type="submit" className="button">Create project <ArrowRight size={17} /></button>
    </form>
  </dialog>;
}
