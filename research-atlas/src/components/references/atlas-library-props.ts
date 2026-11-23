import type { Project } from '@/lib/model';

export type Props = {
  projects: Project[];
  activeProjectId: string;
  ready: boolean;
  onChangeProjects: (projects: Project[]) => void;
  onOpenProject: (projectId: string, paperId: string) => void;
  onCreateProject: (onCreated?: (id: string) => void) => void;
  onFindPapers: () => void;
  notify: (message: string) => void;
};
