'use client';

import { searchWebsiteUrl } from '@/lib/links';
import { type Paper } from '@/lib/model';
import { External } from '@/components/shared/External';

export function DiscoverySourceLinks({ paper }: { paper: Paper }) {
  return (
    <div className="button-row">
      {paper.url && <External href={paper.url}>Open source</External>}
      {paper.oa && paper.oa !== paper.url && <External href={paper.oa}>Read open copy</External>}
      {!paper.url && !paper.oa && <External href={searchWebsiteUrl(paper.title)}>Find source by title</External>}
    </div>
  );
}
