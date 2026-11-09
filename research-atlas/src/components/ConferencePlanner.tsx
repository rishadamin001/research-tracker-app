import { useEffect, useState, type FormEvent } from 'react';
import { Bookmark, CalendarDays, Check, Clock3, ExternalLink, MapPin, Plus, ShieldCheck } from 'lucide-react';
import { External } from '@/components/External';
import { ConferenceDiscovery } from './ConferenceDiscovery';
import {
  calendarIcs, calendarSlots, conferences, conferenceSchema, googleCalendarUrl,
  localDateKey, nextDeadline, savedConferencesSchema, shiftDate, showDate, type Conference,
} from '@/lib/conferences';
import { safeUrl } from '@/lib/model';
import { download } from '@/lib/storage';
import './conference-planner.css';

const storageKey = 'research-atlas-conference-tracker-v1';
type Region = Conference['region'];
type View = Region | 'saved';
const views: { value: View; label: string }[] = [
  { value: 'bangladesh', label: 'Bangladesh' }, { value: 'international', label: 'International' }, { value: 'saved', label: 'My tracker' },
];

function readTracker() {
  try {
    const result = savedConferencesSchema.safeParse(JSON.parse(localStorage.getItem(storageKey) ?? '[]'));
    return result.success ? result.data : [];
  } catch { return []; }
}

function CalendarActions({ event, today }: { event: Conference; today: string }) {
  const slots = calendarSlots(event, today);
  const [selection, setSelection] = useState('event');
  const slot = slots.find(item => item.id === selection) ?? slots[0];
  return <details className="conference-calendar">
    <summary><CalendarDays size={17} aria-hidden="true" /> Add to calendar</summary>
    <label>Which date do you want to save?
      <select aria-label="Which date do you want to save?" value={slot.id} onChange={change => setSelection(change.target.value)}>
        <option value="event">Conference dates</option>
        {slots.slice(1).map(item => <option key={item.id} value={item.id}>{item.label} · {showDate(item.start)}</option>)}
      </select>
    </label>
    <p>Calendar entries are all-day reminders. Confirm the exact time and time zone with the organizer.</p>
    <div className="conference-actions">
      <a className="button secondary" href={googleCalendarUrl(slot)} rel="noreferrer">Open Google Calendar <ExternalLink size={14} aria-hidden="true" /></a>
      <button className="button secondary" type="button" onClick={() => download(`${event.id}-${slot.id}.ics`, calendarIcs(event, slot), 'text/calendar;charset=utf-8')}>Download .ics</button>
    </div>
  </details>;
}

function ConferenceCard({ event, today, isSaved, inTracker, onSave, onEdit }: {
  event: Conference; today: string; isSaved: boolean; inTracker: boolean; onSave: () => void; onEdit: () => void;
}) {
  const deadline = nextDeadline(event, today);
  const ended = event.end < today;
  const running = !ended && event.start <= today;
  const dates = event.start === event.end ? showDate(event.start) : `${showDate(event.start)} – ${showDate(event.end)}`;
  const stale = event.checked && shiftDate(event.checked, 30) < today;

  return <article className="conference-card">
    <div className="conference-card-top">
      <span className="conference-badge">{event.field || (event.region === 'bangladesh' ? 'Bangladesh' : 'International')}</span>
      <span className="conference-muted">{ended ? 'Ended' : running ? 'In progress' : 'Upcoming'}</span>
    </div>
    <h2>{event.title}</h2>
    {event.organizer && <p className="conference-muted">{event.organizer}</p>}
    <p className="conference-icon-line"><CalendarDays size={16} aria-hidden="true" /> {dates}</p>
    {event.location && <p className="conference-icon-line"><MapPin size={16} aria-hidden="true" /> {event.location}</p>}
    <div className="conference-deadline">
      <Clock3 size={17} aria-hidden="true" />
      {deadline ? <div><strong>{deadline.label}</strong><span>{showDate(deadline.date)}{deadline.cutoff ? ` · ${deadline.cutoff}` : ''}</span></div>
        : <div>No future deadline in this listing. Check the event page.</div>}
    </div>
    {event.notes && <p className="conference-notes">{event.notes}</p>}
    <div className="conference-source">
      {event.url && <External href={event.url}>{event.checked ? 'Organizer’s event page' : 'Saved event source'}</External>}
      <small>{event.checked ? `Source checked ${showDate(event.checked)}${stale ? ' · Recheck dates' : ''}` : 'Personal tracker entry · details not checked by Atlas'}</small>
    </div>
    <div className="conference-actions">
      {inTracker ? <button type="button" className="button secondary" onClick={onEdit}>Edit tracker entry</button>
        : <button type="button" className="button secondary" disabled={isSaved} onClick={onSave}>{isSaved ? <Check size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}{isSaved ? 'Saved' : 'Save to tracker'}</button>}
    </div>
    <CalendarActions event={event} today={today} />
  </article>;
}

function EventEditor({ event, today, onSave, onCancel, onRemove }: {
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

export function ConferencePlanner() {
  const [workspace, setWorkspace] = useState<'curated' | 'discover'>('curated');
  const [discoveryRegion, setDiscoveryRegion] = useState<Region>('bangladesh');
  const [view, setView] = useState<View>('bangladesh');
  const [today, setToday] = useState(localDateKey);
  const [saved, setSaved] = useState(readTracker);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('event');
  const [showPast, setShowPast] = useState(false);
  const [editor, setEditor] = useState<Conference | 'new' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const update = () => setToday(localDateKey());
    const timer = window.setInterval(update, 60_000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', update); };
  }, []);

  function saveTracker(items: Conference[], status: string) {
    if (items.length > 100) { setMessage('The tracker can hold up to 100 conferences. Remove an entry first.'); return false; }
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      setSaved(items);
      setMessage(status);
      return true;
    } catch { setMessage('This browser could not save the tracker. You can still download calendar entries.'); return false; }
  }

  const records = view === 'saved' ? saved : conferences.filter(event => event.region === view);
  const term = query.trim().toLocaleLowerCase();
  const filtered = records.filter(event => (showPast || event.end >= today) &&
    [event.title, event.location, event.field, event.organizer].some(value => value.toLocaleLowerCase().includes(term)));
  const dateKey = (event: Conference) => sort === 'deadline' ? nextDeadline(event, today)?.date ?? '9999-12-31' : event.start;
  filtered.sort((a, b) => dateKey(a).localeCompare(dateKey(b)) || a.start.localeCompare(b.start));
  function openDirectories() { if (view !== 'saved') setDiscoveryRegion(view); setWorkspace('discover'); }
  function addDiscoveredLead() {
    setWorkspace('curated'); setView('saved');
    setQuery(''); setShowPast(false);
    if (editor) { setMessage('Finish or cancel the current tracker edit before adding another event.'); return; }
    setEditor('new');
    setMessage('Enter the source and dates you checked. This personal entry will not be marked as verified by Atlas.');
  }

  return <section className="conference-planner" aria-label="Conference planner">
    <div className="conference-intro">
      <CalendarDays size={28} aria-hidden="true" />
      <div><p className="conference-kicker">EVENTS AND DEADLINES</p><h1>Conference planner</h1><p>Browse a small curated list, explore official directories for broader coverage, and track dates you choose to save.</p></div>
    </div>
    <div className="conference-tabs" role="group" aria-label="Conference workspace"><button type="button" aria-pressed={workspace === 'curated'} onClick={() => setWorkspace('curated')}>Curated events and tracker</button><button type="button" aria-pressed={workspace === 'discover'} onClick={openDirectories}>Discover directories</button></div>
    <div className="conference-workspace-panel" hidden={workspace !== 'curated'}>
    <div className="conference-toolbar">
      <div className="conference-tabs" role="group" aria-label="Conference region or tracker">{views.map(item => <button key={item.value} type="button" aria-pressed={view === item.value} onClick={() => { setView(item.value); setQuery(''); setShowPast(false); setEditor(null); }}>{item.label}{item.value === 'saved' ? ` (${saved.length})` : ''}</button>)}</div>
      {view === 'saved' && <button type="button" className="button" onClick={() => setEditor('new')}><Plus size={17} aria-hidden="true" /> Add my event</button>}
    </div>
    {message && <p role="status" className="conference-status">{message}</p>}
    {view === 'saved' && editor && <EventEditor key={editor === 'new' ? 'new' : editor.id} event={editor === 'new' ? undefined : editor} today={today}
      onCancel={() => setEditor(null)} onRemove={() => { if (editor !== 'new' && saveTracker(saved.filter(item => item.id !== editor.id), 'Event removed from your tracker.')) setEditor(null); }}
      onSave={entry => { if (saveTracker([...saved.filter(item => item.id !== entry.id), entry], 'Event saved on this device.')) setEditor(null); }} />}
    <div className="conference-filters">
      <label>{view === 'saved' ? 'Search my tracked events' : 'Search curated conferences'}<input aria-label={view === 'saved' ? 'Search my tracked events' : 'Search curated conferences'} type="search" value={query} onChange={change => setQuery(change.target.value)} placeholder="Filter this list by subject, organizer or city" /></label>
      <label>Sort by<select aria-label="Sort by" value={sort} onChange={change => setSort(change.target.value)}><option value="event">Conference date</option><option value="deadline">Next deadline</option></select></label>
      <label className="conference-checkbox"><input type="checkbox" checked={showPast} onChange={change => setShowPast(change.target.checked)} /> Show past events</label>
    </div>
    <p className="conference-curated-count" role="status">{view === 'saved' ? `${records.length} events in your tracker` : `${records.length} curated ${view === 'bangladesh' ? 'Bangladesh' : 'international'} events in this release`} · {filtered.length} shown with current filters.</p>
    <p className="conference-muted conference-freshness">
      {view === 'saved' ? 'Your tracker is saved on this device. Calendar entries are copies of the dates you export.' : 'This search filters the finite curated list; it does not search the web or cover every conference. Past events and deadlines roll off as the date changes. Recheck the organizer’s page for changes.'}
    </p>
    {filtered.length > 0 ? <div className="conference-grid">{filtered.map(event => <ConferenceCard event={event} today={today} key={event.id}
      isSaved={saved.some(item => item.id === event.id)} inTracker={view === 'saved'}
      onEdit={() => setEditor(event)} onSave={() => saveTracker([...saved, event], 'Conference saved to My tracker.')} />)}</div>
      : <p className="conference-empty">{view === 'saved' ? saved.length ? 'No matching events in your tracker. Clear your filters or show past events.' : 'Save a listing or add your own event to start your tracker.' : 'No matches in our curated list with these filters. This does not mean no conferences exist. Clear the filters or discover more sources below.'}</p>}
    {view !== 'saved' && <section className="conference-broader-next"><h2>Looking for more events?</h2><p>Search wider on organizer, society and institutional directories. Directory leads are not automatically checked or added to Atlas.</p><button type="button" className="button secondary" onClick={openDirectories}>Discover beyond this list</button></section>}
    </div>
    <div className="conference-workspace-panel" hidden={workspace !== 'discover'}><ConferenceDiscovery region={discoveryRegion} onRegionChange={setDiscoveryRegion} onAddLead={addDiscoveredLead} /></div>
    <aside className="conference-safety">
      <ShieldCheck size={24} aria-hidden="true" /><div><h2>Check before you pay or submit</h2>
        <ol><li>Find the event on the organizer’s own site and match the name, venue and dates.</li><li>Confirm the committee, fees, review process and publication terms.</li><li>For indexing claims, check the relevant proceedings or database. An event listing alone does not establish indexing.</li></ol>
        <External href="https://thinkcheckattend.org/conference-checker/">Open the Think. Check. Attend. checker</External>
      </div>
    </aside>
  </section>;
}
