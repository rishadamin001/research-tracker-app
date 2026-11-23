import { conferenceCheckKeys, conferenceChecks, type Conference } from '@/lib/conferences';

export function ConferenceReviewFields({ event }: { event?: Conference }) {
  return <details>
    <summary>Check this conference before submitting</summary>
    <p>Open the organizer’s website. For each check you make, record what you found and where you found it. Leave unanswered checks blank.</p>
    <div className="conference-form-grid">{conferenceCheckKeys.map(key => <label key={key}>
      {conferenceChecks[key]}
      <textarea name={`check-${key}`} maxLength={600} rows={2} defaultValue={event?.reviewNotes?.[key]} />
    </label>)}</div>
  </details>;
}
