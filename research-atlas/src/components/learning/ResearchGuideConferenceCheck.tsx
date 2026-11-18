import { CalendarDays, Presentation, ArrowRight } from 'lucide-react';
import { External } from '@/components/shared/External';

const conferenceChecks = [
  'I found the event on an official organizer or host website.',
  'I checked that the organizer, committee, and venue can be independently confirmed.',
  'I confirmed the submission deadline, time zone, event dates, and fees.',
  'I checked how submissions are reviewed and what an acceptance includes.',
  'I verified the proceedings publisher and checked any indexing claim for this event edition.',
];

export function ResearchGuideConferenceCheck({ onConferences, checked, onToggle, onReset }: { onConferences: () => void; checked: string[]; onToggle: (item: string) => void; onReset: () => void }) {
  return <section className="guide-chapter" aria-labelledby="guide-conferences">
    <h2 id="guide-conferences">Before you submit, register, or travel</h2>
    <p className="guide-intro">A call for papers (CFP) is an invitation to send work. It lists what to submit and when. Use alert directories to find leads, then confirm the details with the university, society, or publisher that runs the event.</p>
    <div className="guide-metric-grid">
      <article className="guide-card"><span className="guide-icon"><CalendarDays size={23} aria-hidden="true" /></span><h3>Submission deadline</h3><p>The last date to send the requested abstract or paper. Check the exact time and time zone before adding a reminder.</p></article>
      <article className="guide-card"><span className="guide-icon"><Presentation size={23} aria-hidden="true" /></span><h3>Conference dates</h3><p>The days the event takes place. Registration and final manuscript deadlines may fall on separate dates.</p></article>
    </div>
    <fieldset className="guide-checklist">
      <legend>Check one event</legend>
      <p role="status">{checked.length} of {conferenceChecks.length} checks complete.</p>
      {conferenceChecks.map(item => <label key={item} className="guide-check-row">
        <input type="checkbox" checked={checked.includes(item)} onChange={() => onToggle(item)} /><span>{item}</span>
      </label>)}
      <p>For an indexing claim, check the exact edition and proceedings title. A previous edition or a promise to submit proceedings to an index leaves coverage for the new edition uncertain.</p>
      <External href="https://thinkcheckattend.org/check/">Think. Check. Attend. full checklist</External>
      {checked.length > 0 && <button type="button" className="button secondary small" onClick={onReset}>Reset checklist</button>}
    </fieldset>
    <button type="button" className="button" onClick={onConferences}>Explore upcoming conferences <ArrowRight size={16} aria-hidden="true" /></button>
  </section>;
}
