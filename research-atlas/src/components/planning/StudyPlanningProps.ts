import type { Project } from '@/lib/model';
import type { InterfaceMode } from '@/components/shared/TaskSteps';

export type Props = { project: Project; update: (patch: Partial<Project>) => void; interfaceMode?: InterfaceMode };
