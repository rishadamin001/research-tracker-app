import { Bookmark, CalendarDays, Check, Clock3, MapPin } from 'lucide-react';
import { External } from '@/components/shared/External';
import { conferenceCheckKeys, conferenceChecks, nextDeadline, shiftDate, showDate, type Conference } from '@/lib/conferences';
import { ConferenceCalendarActions } from './ConferenceCalendarActions';

export function ConferenceCard({ event, today, isSaved, inTracker, onSave, onEdit }: {
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
    {inTracker && <details>
      <summary>Your conference checks</summary>
      <p>Use “Edit tracker entry” to record sources and follow up on open questions. These notes reflect your own review.</p>
      <dl>{conferenceCheckKeys.map(key => <div key={key}><dt>{conferenceChecks[key]}</dt><dd>{event.reviewNotes?.[key] || 'Still to check'}</dd></div>)}</dl>
    </details>}
    <div className="conference-source">
      {event.url && <External href={event.url}>{event.checked ? 'Organizer’s event page' : 'Saved event source'}</External>}
      <small>{event.checked ? `Source checked ${showDate(event.checked)}${stale ? ' · Recheck dates' : ''}` : 'Personal tracker entry · details not checked by Atlas'}</small>
    </div>
    <div className="conference-actions">
      {inTracker ? <button type="button" className="button secondary" onClick={onEdit}>Edit tracker entry</button>
        : <button type="button" className="button secondary" disabled={isSaved} onClick={onSave}>{isSaved ? <Check size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}{isSaved ? 'Saved' : 'Save to tracker'}</button>}
    </div>
    <ConferenceCalendarActions event={event} today={today} />
  </article>;
}
