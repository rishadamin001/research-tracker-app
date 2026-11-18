import { useEffect, useId, useRef, useState } from 'react';
import type { Project } from '@/lib/model';
import { correctLibraryMetadata, referenceMetadataFields, type LibraryLink } from '@/lib/atlas-library';

export function ReferenceMetadataEditor({ link, projects, onSave, onCancel }: { link: LibraryLink; projects: Project[]; onSave: (projects: Project[]) => void; onCancel: () => void }) {
  const heading = useId();
  const titleInput = useRef<HTMLInputElement>(null);
  const [fields, setFields] = useState(() => referenceMetadataFields(link.paper));
  const [refreshDraft, setRefreshDraft] = useState(true);
  const [error, setError] = useState('');
  const field = (name: keyof typeof fields, value: string) => setFields(current => ({ ...current, [name]: value }));
  const unsaved = JSON.stringify(fields) !== JSON.stringify(referenceMetadataFields(link.paper));
  useEffect(() => { titleInput.current?.focus(); }, []);
  return <form aria-labelledby={heading} onSubmit={event => {
    event.preventDefault();
    try { onSave(correctLibraryMetadata(projects, link, fields, refreshDraft)); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save the reference details.'); }
  }}>
    <h3 id={heading}>Edit reference in {link.projectTitle}</h3>
    <label className="field"><span>Reference title</span><input ref={titleInput} required maxLength={20000} value={fields.title} onChange={event => field('title', event.target.value)} /></label>
    <div className="field"><label htmlFor={`${heading}-authors`}>Authors, one name per line</label><textarea id={`${heading}-authors`} rows={3} maxLength={20000} value={fields.authors} onChange={event => field('authors', event.target.value)} /></div>
    <div className="two-col">
      <label className="field"><span>Publication name</span><input maxLength={20000} value={fields.journal} onChange={event => field('journal', event.target.value)} /></label>
      <label className="field"><span>Publication year</span><input inputMode="numeric" maxLength={4} value={fields.year} onChange={event => field('year', event.target.value)} /></label>
    </div>
    <label className="field"><span>Publisher</span><input maxLength={500} value={fields.publisher} onChange={event => field('publisher', event.target.value)} /></label>
    <p className="muted">Changing the publication name clears the previous venue identifiers, quartile and publishing-fee estimate.</p>
    <label className="checkbox"><input type="checkbox" checked={refreshDraft} onChange={event => setRefreshDraft(event.target.checked)} /> Update linked Writing Studio references in this project</label>
    {unsaved && <p className="muted">Reference details have unsaved changes.</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <div className="button-row">
      <button type="submit" className="button">Save reference details</button>
      <button type="button" className="button secondary" onClick={onCancel}>Cancel editing</button>
    </div>
  </form>;
}
