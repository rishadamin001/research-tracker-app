import type { Paper } from '@/lib/model';

export function ReferenceDetails({ paper }: { paper: Paper }) {
  const citation = [paper.authors || 'Authors unavailable', paper.publicationDate ?? paper.year ?? 'Date unavailable', paper.journal || 'Publication unavailable'];
  return <>
    <span className="reference-detail">{citation.join(' · ')}</span>
    <span className="reference-detail">{paper.doi ? `DOI ${paper.doi}` : 'DOI unavailable'} · {paper.source}</span>
    {/^https:\/\/(openalex\.org|europepmc\.org)\//.test(paper.id) && <span className="reference-detail">Record ID {paper.id}</span>}
  </>;
}
