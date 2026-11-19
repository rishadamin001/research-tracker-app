import { WritingStudio } from '@/components/writing/WritingStudio';
import type { Props } from './execution-workspace-types';
import { DataWorkspace } from '@/components/planning/DataWorkspace';
import { PublicationWorkspace } from '@/components/publishing/PublicationWorkspace';

export function ExecutionWorkspace({ project, update, mode, interfaceMode, initialSelection, onNote }: Props) {
  switch (mode) {
    case 'data': return <DataWorkspace project={project} update={update} interfaceMode={interfaceMode} />;
    case 'writing': return <WritingStudio key={`${project.id}-${initialSelection?.paperId ?? ''}-${initialSelection?.claimId ?? ''}`} project={project} update={update} interfaceMode={interfaceMode} initialSelection={initialSelection} onNote={onNote} />;
    case 'publication': return <PublicationWorkspace key={project.id} project={project} update={update} />;
  }
}
