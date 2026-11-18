import { ArrowRight } from 'lucide-react';

export function PlanningContinue({ children, next }: { children: string; next: () => void }) {
  return (
    <button type="button" className="button" onClick={next}>
      {children} <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
}
