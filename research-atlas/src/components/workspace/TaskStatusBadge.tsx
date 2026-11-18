import { type TaskStatus } from '@/lib/workflow';

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={`task-status ${status.toLowerCase().replaceAll(' ', '-')}`}>{status === 'Complete' ? 'Ready for now' : status === 'In progress' ? 'Draft' : status}</span>;
}
