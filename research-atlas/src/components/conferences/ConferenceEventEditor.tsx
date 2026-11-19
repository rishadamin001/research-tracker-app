import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { conferenceSchema, type Conference } from '@/lib/conferences';
import { safeUrl } from '@/lib/model';

export function ConferenceEventEditor({ event, today, onSave, onCancel, onRemove }: {
  event?: Conference; today: string; onSave: (event: Conference) => void; onCancel: () => void; onRemove: () => void;
}) {
  const [deadlines, setDeadlines] = useState<Conference['deadlines']>(event?.deadlines ?? []);
  const [error, setError] = useState('');
  function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const fields = new FormData(formEvent.currentTarget);
    const read = (name: string) => String(fields.get(name) ?? '').trim();
    const url = read('source');
    if (url && !safeUrl(url)) { setError('Enter a complete http or https source URL.'); return; }
    const parsed = conferenceSchema.safeParse({
      id: event?.id ?? crypto.randomUUID(), title: read('title'), organizer: read('organizer'),
      field: read('field'), location: read('location'), region: read('region'), start: read('start'), end: read('end'),
      url, deadlines: deadlines.map(item => ({ ...item, label: item.label.trim(), cutoff: item.cutoff?.trim() })), notes: read('notes'),
    });
    if (!parsed.success) { setError('Check that the end date follows the start date and every deadline has a date and label.'); return; }
    onSave(parsed.data);
  }
  return <form className="conference-editor" onSubmit={submit} aria-label={event ? 'Edit conference' : 'Add conference'}>
    <h2>{event ? 'Edit saved conference' : 'Add a conference'}</h2>
    <label>Conference name<input name="title" required maxLength={200} defaultValue={event?.title} /></label>
    <div className="conference-form-grid">
      <label>Location<input name="location" maxLength={160} defaultValue={event?.location} /></label>
      <label>Region<select name="region" defaultValue={event?.region ?? 'bangladesh'}><option value="bangladesh">Bangladesh</option><option value="international">International</option></select></label>
      <label>Organizer<input name="organizer" maxLength={200} defaultValue={event?.organizer} /></label>
      <label>Research area<input name="field" maxLength={100} defaultValue={event?.field} /></label>
      <label>Start date<input name="start" type="date" required defaultValue={event?.start ?? today} /></label>
      <label>End date<input name="end" type="date" required defaultValue={event?.end ?? today} /></label>
    </div>
    <label>Event website<input name="source" type="url" maxLength={1200} defaultValue={event?.url} placeholder="https://" /></label>
    {deadlines.map((deadline, index) => <fieldset key={index} className="conference-editor-deadline">
      <legend>Deadline {index + 1}</legend>
      <div className="conference-form-grid">
        <label>Deadline label<input required value={deadline.label} maxLength={100} onChange={change => setDeadlines(items => items.map((item, i) => i === index ? { ...item, label: change.target.value } : item))} /></label>
        <label>Deadline date<input required type="date" value={deadline.date} onChange={change => setDeadlines(items => items.map((item, i) => i === index ? { ...item, date: change.target.value } : item))} /></label>
        <label>Organizer cutoff and time zone<input value={deadline.cutoff ?? ''} maxLength={120} onChange={change => setDeadlines(items => items.map((item, i) => i === index ? { ...item, cutoff: change.target.value } : item))} placeholder="For example, 13:00 CET" /></label>
      </div>
      <button type="button" className="button secondary" onClick={() => setDeadlines(items => items.filter((_, i) => i !== index))}>Remove deadline {index + 1}</button>
    </fieldset>)}
    {deadlines.length < 8 && <button type="button" className="button secondary" onClick={() => setDeadlines(items => [...items, { label: '', date: today }])}><Plus size={16} aria-hidden="true" /> Add deadline</button>}
    <label>Private tracker notes<textarea aria-label="Private tracker notes" name="notes" rows={3} maxLength={2000} defaultValue={event?.notes} /></label>
    {error && <p role="alert" className="error">{error}</p>}
    <div className="conference-actions">
      <button type="submit" className="button">Save event</button>
      <button type="button" className="button secondary" onClick={onCancel}>Cancel</button>
      {event && <button type="button" className="text-button danger" onClick={onRemove}>Remove from tracker</button>}
    </div>
  </form>;
}
