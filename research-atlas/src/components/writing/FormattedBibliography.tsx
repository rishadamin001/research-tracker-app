import { useState } from 'react';
import type { Project } from '@/lib/model';
import type { WritingCitation } from '@/lib/writing-studio';
import { BibliographyStylePreview } from './BibliographyStylePreview';

export function FormattedBibliography({ project, citations }: { project: Project; citations: WritingCitation[] }) {
  const [open, setOpen] = useState(false);
  return <details onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Format a bibliography</summary>
    {open && <BibliographyStylePreview papers={project.papers} citations={citations} />}
  </details>;
}
