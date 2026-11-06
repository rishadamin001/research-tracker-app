import { z } from 'zod';

export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000') || value === '9999-12-31') return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const dateField = z.string().refine(isCalendarDate);
const deadlineSchema = z.object({
  date: dateField,
  label: z.string().min(1).max(100),
  cutoff: z.string().max(120).optional(),
});
export const conferenceSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).max(100),
  title: z.string().trim().min(1).max(200),
  organizer: z.string().max(200),
  field: z.string().max(100),
  location: z.string().max(160),
  region: z.enum(['bangladesh', 'international']),
  start: dateField,
  end: dateField,
  url: z.string().max(1200),
  deadlines: z.array(deadlineSchema).max(8),
  checked: dateField.optional(),
  notes: z.string().max(2000).optional(),
}).refine(event => event.end >= event.start, 'The end date must be on or after the start date.');

export type Conference = z.infer<typeof conferenceSchema>;
export const savedConferencesSchema = z.array(conferenceSchema).max(100);
const checked = '2026-11-06';

// Dates are from the linked organizers. Directory results are never promoted here automatically.
export const conferences: Conference[] = [
  {
    id: 'iccdrm-2026', title: 'International Conference on Climate and Disaster Risk Management',
    organizer: 'University of Dhaka', field: 'Climate and disaster risk', location: 'Dhaka, Bangladesh', region: 'bangladesh',
    start: '2026-12-08', end: '2026-12-09', url: 'https://www.du.ac.bd/webPost/97/27482', checked,
    deadlines: [{ date: '2026-11-10', label: 'Registration deadline' }],
  },
  {
    id: 'icce-2026', title: 'International Conference on Civil Engineering (ICCE 2026)',
    organizer: 'Bangladesh University of Engineering and Technology', field: 'Civil engineering', location: 'Dhaka, Bangladesh', region: 'bangladesh',
    start: '2026-12-17', end: '2026-12-19', url: 'https://conf.ce.buet.ac.bd/schedules.html', checked,
    deadlines: [{ date: '2026-11-30', label: 'Registration for non-presenting attendees' }],
  },
  {
    id: 'icfmucc-2027', title: 'The Future of the Muslim Ummah Amid Contemporary Challenges',
    organizer: 'International Islamic University Chittagong', field: 'Islamic studies and society', location: 'Chattogram, Bangladesh', region: 'bangladesh',
    start: '2027-01-26', end: '2027-01-27', url: 'https://icfmucc.iiuc.ac.bd/', checked,
    deadlines: [{ date: '2026-12-10', label: 'Full paper deadline for accepted abstracts' }],
  },
  {
    id: 'iceeict-2027', title: 'International Conference on Electrical Engineering and ICT (ICEEICT 2027)',
    organizer: 'Military Institute of Science & Technology', field: 'Electrical engineering and computing', location: 'Dhaka, Bangladesh and online', region: 'bangladesh',
    start: '2027-01-28', end: '2027-01-30', url: 'https://iceeict.mist.ac.bd/', checked,
    deadlines: [{ date: '2026-11-10', label: 'Paper submission deadline' }, { date: '2026-12-27', label: 'Author registration deadline' }],
  },
  {
    id: 'aafs-2027', title: 'AAFS Annual Scientific Conference',
    organizer: 'American Academy of Forensic Sciences', field: 'Forensic science', location: 'Orlando, United States', region: 'international',
    start: '2027-02-15', end: '2027-02-20', url: 'https://accounts.aafs.org/Meetings/Abstract-Submission-Instructions.aspx', checked,
    deadlines: [{ date: '2026-12-31', label: 'Registration deadline for accepted presenters' }],
  },
  {
    id: 'egu-2027', title: 'European Geosciences Union General Assembly',
    organizer: 'European Geosciences Union', field: 'Earth and planetary sciences', location: 'Vienna, Austria and online', region: 'international',
    start: '2027-04-04', end: '2027-04-09', url: 'https://www.egu27.eu/authors/how-to-submit.html', checked,
    deadlines: [{ date: '2027-01-12', label: 'Abstract submission deadline', cutoff: '13:00 CET' }],
  },
  {
    id: 'chi-2027', title: 'ACM CHI Conference on Human Factors in Computing Systems',
    organizer: 'ACM SIGCHI', field: 'Human-computer interaction', location: 'Pittsburgh, United States', region: 'international',
    start: '2027-05-10', end: '2027-05-14', url: 'https://chi2027.acm.org/', checked,
    deadlines: [{ date: '2027-01-21', label: 'Poster submission deadline', cutoff: 'Anywhere on Earth (AoE)' }],
  },
  {
    id: 'biosensors-2027', title: 'World Congress on Biosensors',
    organizer: 'Elsevier and Biosensors & Bioelectronics', field: 'Biosensors and health technology', location: 'Kyoto, Japan', region: 'international',
    start: '2027-05-18', end: '2027-05-20', url: 'https://www.elsevier.com/en-gb/events/conferences/all/anniversary-world-congress-on-biosensors', checked,
    deadlines: [{ date: '2026-11-13', label: 'Abstract submission deadline' }, { date: '2027-02-26', label: 'Author registration deadline' }],
  },
  {
    id: 'icml-2027', title: 'International Conference on Machine Learning (ICML 2027)',
    organizer: 'ICML', field: 'Machine learning', location: 'Rio de Janeiro, Brazil', region: 'international',
    start: '2027-07-31', end: '2027-08-06', url: 'https://icml.cc/Conferences/2027/Dates', checked,
    deadlines: [],
  },
];

export const conferenceDirectories = {
  bangladesh: {
    official: [
      { label: 'IEEE Bangladesh Section', url: 'https://www.ieeebd.com/ieee-bds/' },
      { label: 'University of Dhaka disaster studies events', url: 'https://www.du.ac.bd/allPostRecord/97/Event' },
      { label: 'RUET conference portal', url: 'https://icecte.ruet.ac.bd/' },
    ],
    discovery: [
      { label: 'AllConferenceAlert.com Bangladesh', url: 'https://www.allconferencealert.com/bangladesh' },
      { label: 'AllConferenceAlert.net Bangladesh', url: 'https://allconferencealert.net/bangladesh' },
      { label: '10Times Bangladesh', url: 'https://10times.com/bangladesh/conferences' },
      { label: 'International Conference Alerts Bangladesh', url: 'https://internationalconferencealerts.com/engineering/bangladesh' },
    ],
  },
  international: {
    official: [
      { label: 'IEEE Conference Search', url: 'https://events.ieee.org/search-ieee-conferences/' },
      { label: 'ACM Conferences', url: 'https://www.acm.org/conferences' },
      { label: 'Elsevier Conferences', url: 'https://www.elsevier.com/events/conferences' },
      { label: 'Nature Conferences', url: 'https://conferences.nature.com/' },
      { label: 'Springer Nature proceedings guidance', url: 'https://www.springernature.com/gp/authors/publish-a-book/step-by-step-conference-proceedings' },
    ],
    discovery: [
      { label: 'WikiCFP', url: 'http://www.wikicfp.com/cfp/allcfp' },
      { label: '10Times global directory', url: 'https://10times.com/conferences' },
      { label: 'Conference Locate (Clocate)', url: 'https://www.clocate.com/international-conferences/' },
    ],
  },
};

export function localDateKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(date.getFullYear()).padStart(4, '0')}-${month}-${day}`;
}

export function shiftDate(day: string, offset: number) {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

const dateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });
export function showDate(day: string) {
  return dateFormatter.format(new Date(`${day}T00:00:00Z`));
}

export function nextDeadline(event: Conference, today: string) {
  return event.deadlines.filter(item => item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
}

export type CalendarSlot = { id: string; label: string; title: string; start: string; end: string; location: string; details: string; };

export function calendarSlots(event: Conference, today: string): CalendarSlot[] {
  const source = event.url ? `\nSource: ${event.url}` : '';
  return [
    { id: 'event', label: 'Conference dates', title: event.title, start: event.start, end: event.end, location: event.location,
      details: `Conference dates. Check the organizer’s schedule before attending.${source}` },
    ...event.deadlines.map((item, index) => ({
      id: `deadline-${item.date}-${index}`,
      label: item.label,
      title: `${item.label}: ${event.title}`,
      start: item.date,
      end: item.date,
      location: '',
      details: `Date reminder. ${item.cutoff ? `Organizer cutoff: ${item.cutoff}. ` : ''}Check the organizer’s exact cutoff and time zone.${source}`,
    })).filter(item => item.start >= today),
  ];
}

const compact = (day: string) => day.replace(/-/g, '');
export function googleCalendarUrl(slot: CalendarSlot) {
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: slot.title, dates: `${compact(slot.start)}/${compact(shiftDate(slot.end, 1))}`,
    details: slot.details, location: slot.location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function escapeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\n|\r/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

// RFC 5545 folds content lines at 75 octets and continues on a leading space.
function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  let folded = '';
  let width = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (width + size > 75) { folded += '\r\n '; width = 1; }
    folded += char;
    width += size;
  }
  return folded;
}

export function calendarIcs(event: Conference, slot: CalendarSlot, now = new Date()) {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Research Atlas//Conference Planner//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${event.id}-${slot.id}@research-atlas.local`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(slot.start)}`, `DTEND;VALUE=DATE:${compact(shiftDate(slot.end, 1))}`,
    `SUMMARY:${escapeCalendarText(slot.title)}`, `LOCATION:${escapeCalendarText(slot.location)}`,
    `DESCRIPTION:${escapeCalendarText(slot.details)}`, 'END:VEVENT', 'END:VCALENDAR', '',
  ].map(foldCalendarLine).join('\r\n');
}
