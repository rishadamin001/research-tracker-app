'use client';

import { type Paper } from '@/lib/model';

const publishedOn = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

export function PaperPublished({ paper }: { paper: Paper }) {
  return paper.publicationDate
    ? <time dateTime={paper.publicationDate}>{publishedOn.format(new Date(paper.publicationDate))}</time>
    : paper.year ?? 'Year unknown';
}
