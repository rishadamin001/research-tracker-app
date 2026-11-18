'use client';

import type { EvidenceWorkspaceProps } from './evidence-workspace-types';
import './EvidenceLedger';
import '@/components/shared/publication/RankingControls';
import { DiscoverPapers } from '@/components/discovery/DiscoverPapers';
import { ScreenPapers } from './ScreenPapers';
import { ExtractEvidence } from './ExtractEvidence';

export function EvidenceWorkspace({ mode, ...props }: EvidenceWorkspaceProps) {
  if (mode === 'discover') return <DiscoverPapers key={props.project.id} {...props} />;
  if (mode === 'screen') return <ScreenPapers key={props.project.id} {...props} />;
  return <ExtractEvidence key={props.project.id} {...props} />;
}
