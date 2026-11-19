import { type Project } from '@/lib/model';
import type { WritingSelection } from '@/lib/writing-studio';

export type Props = {
  project: Project;
  update: (patch: Partial<Project>) => void;
  mode: 'data' | 'writing' | 'publication';
  interfaceMode?: 'guided' | 'expert';
  initialSelection?: WritingSelection;
  onNote?: (paperId?: string) => void;
};

export type WorkspaceProps = Omit<Props, 'mode'>;

export type Journal = Project['journalCandidates'][number];
