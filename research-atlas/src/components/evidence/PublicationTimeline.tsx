'use client';

import { type Paper } from '@/lib/model';

export function PublicationTimeline({ papers }: { papers: Paper[] }) {
  if (!papers.length) return null;
  const years = new Map<number, number>();
  let unknown = 0;
  for (const paper of papers) {
    if (paper.year === null) unknown++;
    else years.set(paper.year, (years.get(paper.year) ?? 0) + 1);
  }
  const counts = [...years.entries()].sort(([left], [right]) => right - left);
  const maximum = Math.max(1, ...years.values(), unknown);

  return (
    <details className="panel">
      <summary>Publication timeline</summary>
      <p>Explore the publication years in your saved library. The bars count saved records. Citation relationships require separate data.</p>
      <ul>
        {counts.map(([year, count]) => (
          <li key={year}>{year} · {count} <meter min={0} max={maximum} value={count} aria-label={`${count} saved papers from ${year}`} /></li>
        ))}
        {unknown > 0 && <li>Year unavailable · {unknown} <meter min={0} max={maximum} value={unknown} aria-label={`${unknown} saved papers with unknown year`} /></li>}
      </ul>
    </details>
  );
}
