import { useState } from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import { calendarIcs, calendarSlots, googleCalendarUrl, showDate, type Conference } from '@/lib/conferences';
import { download } from '@/lib/storage';

export function ConferenceCalendarActions({ event, today }: { event: Conference; today: string }) {
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
