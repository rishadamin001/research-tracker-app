import type { Project } from '@/lib/model';

export type Props = {
  projects: Project[];
  activeProjectId: string;
  ready: boolean;
  onChangeProjects: (projects: Project[]) => void;
  onOpenProject: (id: string) => void;
  onCreateProject: (onCreated?: (id: string) => void) => void;
  onFindPapers: () => void;
  notify: (message: string) => void;
};
