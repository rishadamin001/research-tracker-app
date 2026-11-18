import type { ResearchPlan } from '@/lib/research-plan';

export type ToolProps = { plan: ResearchPlan; patch: (values: Partial<ResearchPlan>) => void };
