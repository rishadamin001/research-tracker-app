import { type Project } from '@/lib/model';
import { type SearchRun } from '@/lib/search-provenance';

export interface EvidenceWorkspaceProps {
  project: Project;
  update: (patch: Partial<Project>) => void;
  notify: (message: string) => void;
  mode: 'discover' | 'screen' | 'extract';
  onNote?: (paperId: string) => void;
  onScreen?: (paperId: string) => void;
  initialQuery?: string;
}

export interface PaperSearchProps {
  project?: Project;
  update?: EvidenceWorkspaceProps['update'];
  notify: EvidenceWorkspaceProps['notify'];
  initialQuery?: string;
  initialRun?: SearchRun;
  openProjects: () => void;
  onNote?: (paperId: string) => void;
  onScreen?: (paperId: string) => void;
}
