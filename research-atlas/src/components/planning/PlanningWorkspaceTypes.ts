import type { Project } from '@/lib/model';
import type { InterfaceMode } from '@/components/shared/TaskSteps';

export type PlanningProps = {
  project: Project;
  update: (patch: Partial<Project>) => void;
  next: () => void;
  interfaceMode?: InterfaceMode;
  saveState?: string;
};
