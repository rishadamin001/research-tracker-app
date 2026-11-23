import { useEffect, useState } from 'react';
import { CalendarDays, Plus, ShieldCheck } from 'lucide-react';
import { External } from '@/components/shared/External';
import { ConferenceDiscovery } from './ConferenceDiscovery';
import { conferences, localDateKey, nextDeadline, savedConferencesSchema, type Conference } from '@/lib/conferences';
import './conference-planner.css';
import { ConferenceEventEditor } from './ConferenceEventEditor';
import { ConferenceCard } from './ConferenceCard';

const storageKey = 'research-atlas-conference-tracker-v1';

type Region = Conference['region'];

type View = Region | 'saved';

const views: { value: View; label: string }[] = [
  { value: 'bangladesh', label: 'Bangladesh' }, { value: 'international', label: 'International' }, { value: 'saved', label: 'My tracker' },
];

function readTracker() {
  try {
    const original = localStorage.getItem(storageKey);
    const items = savedConferencesSchema.parse(JSON.parse(original ?? '[]'));
    return { items, original, readable: true };
  } catch { return { items: [], original: null, readable: false }; }
}

export function ConferencePlanner() {
  const [workspace, setWorkspace] = useState<'curated' | 'discover'>('curated');
  const [discoveryRegion, setDiscoveryRegion] = useState<Region>('bangladesh');
  const [view, setView] = useState<View>('bangladesh');
  const [today, setToday] = useState(localDateKey);
  const [tracker, setTracker] = useState(readTracker);
  const saved = tracker.items;
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
      if (!tracker.readable || localStorage.getItem(storageKey) !== tracker.original) {
        setMessage('The tracker could not be read or changed in another tab. Copy your edits and reload before saving.');
        return false;
      }
      const original = JSON.stringify(items);
      localStorage.setItem(storageKey, original);
      setTracker({ items, original, readable: true });
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
    {view === 'saved' && !tracker.readable && <p role="alert">This browser could not read your saved tracker. Saving is disabled to protect its contents.</p>}
    {view === 'saved' && editor && <ConferenceEventEditor key={editor === 'new' ? 'new' : editor.id} event={editor === 'new' ? undefined : editor} today={today}
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
