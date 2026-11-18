'use client';

import type { PaperSearchProps } from '@/components/evidence/evidence-workspace-types';
import { DiscoverPapers } from './DiscoverPapers';

export function PaperSearch(props: PaperSearchProps) {
  return <DiscoverPapers {...props} />;
}
