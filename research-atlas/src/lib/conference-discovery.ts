import { isCalendarDate, type Conference } from './conferences';

export type ConferenceRegion = Conference['region'];
export type DirectoryOrganization = 'all' | 'ieee' | 'acm' | 'nature' | 'who' | 'unesco' | 'bangladesh';
export type ConferenceSearchBrief = {
  region: ConferenceRegion;
  topic: string;
  location: string;
  organizer: string;
  from: string;
  until: string;
};

// Base URLs only: no undocumented query parameters, harvested event data or
// claims that Atlas has applied a directory's filters on the user's behalf.
export const officialConferenceDirectories = [
  { id: 'ieee', organization: 'ieee', label: 'IEEE Conference Search', url: 'https://events.ieee.org/search-ieee-conferences/', regions: ['bangladesh', 'international'], scope: 'Engineering, computing and technology', instructions: 'Search keywords, then refine by date, location, sponsor or field of interest. For Bangladesh, apply its location filter.', kind: 'Conference directory' },
  { id: 'acm', organization: 'acm', label: 'ACM Conferences', url: 'https://www.acm.org/conferences', regions: ['bangladesh', 'international'], scope: 'Computing and its related fields', instructions: 'Browse the conference calendar and follow the event website for its current call for papers. A browser access check may be required.', kind: 'Conference calendar' },
  { id: 'nature', organization: 'nature', label: 'Nature Conferences', url: 'https://conferences.nature.com/', regions: ['international'], scope: 'Life sciences, physical sciences and interdisciplinary research', instructions: 'Browse upcoming events and inspect their dates, location, format and organizer pages.', kind: 'Publisher event calendar' },
  { id: 'who', organization: 'who', label: 'WHO Events', url: 'https://www.who.int/news-room/events', regions: ['international'], scope: 'Public health and global health', instructions: 'Review the event calendar. It includes meetings, webinars and consultations as well as conferences; a listing does not imply a call for papers.', kind: 'Institutional event calendar' },
  { id: 'unesco', organization: 'unesco', label: 'UNESCO Calendar', url: 'https://www.unesco.org/en/events', regions: ['international'], scope: 'Education, science, culture and society', instructions: 'Review upcoming activities and follow each event page. Many activities are not manuscript-submission venues.', kind: 'Institutional event calendar' },
  { id: 'ieee-bd', organization: 'bangladesh', label: 'IEEE Bangladesh Section', url: 'https://www.ieeebd.com/ieee-bds/', regions: ['bangladesh'], scope: 'IEEE society and university connections in Bangladesh', instructions: 'Use the section as a starting point to identify organizers, then check the specific conference website for current dates and submissions.', kind: 'Society hub' },
  { id: 'du', organization: 'bangladesh', label: 'University of Dhaka events', url: 'https://www.du.ac.bd/allPostRecord/97/Event', regions: ['bangladesh'], scope: 'University disaster studies and related events', instructions: 'Browse institutional announcements and verify the relevant department, event dates and submission information.', kind: 'University event page' },
  { id: 'ruet', organization: 'bangladesh', label: 'RUET conference portal', url: 'https://icecte.ruet.ac.bd/', regions: ['bangladesh'], scope: 'Electrical, computing and telecommunications engineering', instructions: 'Check the current event edition and organizer details. This is an event portal, not a nationwide search engine.', kind: 'University conference portal' },
] as const;

export function conferenceDiscoverySources(region: ConferenceRegion, organization: DirectoryOrganization = 'all') {
  return officialConferenceDirectories.filter(source => source.regions.some(item => item === region) && (organization === 'all' || source.organization === organization));
}

export function conferenceBriefError(brief: ConferenceSearchBrief): string {
  if ((brief.from && !isCalendarDate(brief.from)) || (brief.until && !isCalendarDate(brief.until))) return 'Choose valid conference dates.';
  if (brief.from && brief.until && brief.until < brief.from) return 'The latest conference date must be on or after the earliest date.';
  return '';
}

export function conferenceSearchBrief(brief: ConferenceSearchBrief): string {
  return [
    'Conference search brief',
    `Region: ${brief.region === 'bangladesh' ? 'Events held in Bangladesh' : 'International events; choose a country or city on the directory'}`,
    brief.topic.trim() ? `Topic or keywords: ${brief.topic.trim()}` : '',
    brief.location.trim() ? `Country, city or online format: ${brief.location.trim()}` : '',
    brief.organizer.trim() ? `Organizer or society: ${brief.organizer.trim()}` : '',
    brief.from ? `Earliest conference date: ${brief.from}` : '',
    brief.until ? `Latest conference date: ${brief.until}` : '',
    'Apply these details in the selected directory. Atlas has not searched or filtered its event records.',
    'Verify the actual organizer, current dates, submission rules, fees and any indexing claim before relying on a lead.',
  ].filter(Boolean).join('\n');
}
