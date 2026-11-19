import type { PlanningProps } from './PlanningWorkspaceTypes';
import { ProjectProfileForm } from './ProjectProfileForm';
import { ResearchTopicForm } from './ResearchTopicForm';
import { ResearchMethodsForm } from './ResearchMethodsForm';
import { ResearchQuestionForm } from './ResearchQuestionForm';

type PlanningMode = 'profile' | 'topic' | 'question' | 'methods';

export function PlanningWorkspace({ mode, ...props }: PlanningProps & { mode: PlanningMode }) {
  switch (mode) {
    case 'profile': return <ProjectProfileForm {...props} />;
    case 'topic': return <ResearchTopicForm {...props} />;
    case 'question': return <ResearchQuestionForm {...props} />;
    case 'methods': return <ResearchMethodsForm {...props} />;
  }
}
