import { tourSteps } from './tourSteps';

const key = 'atlas-onboarding-v2';
export type TourStatus = 'new' | 'in-progress' | 'skipped' | 'dismissed' | 'completed' | 'replay-requested';
export type TourState = { status: TourStatus; step: number };
const states: TourStatus[] = ['new','in-progress','skipped','dismissed','completed','replay-requested'];

export function readTour(): TourState {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (saved && states.includes(saved.status) && Number.isInteger(saved.step) && saved.step >= 0 && saved.step <= tourSteps.length) return saved;
    const previous = JSON.parse(localStorage.getItem('atlas-workspace-tour-v1') ?? 'null');
    if (previous?.status === 'complete') return {status:'completed',step:tourSteps.length};
    if (previous?.status === 'skipped') return {status:'skipped',step:0};
    if (previous?.status === 'started') return {status:'in-progress',step:0};
    // Earlier versions stored tour, reading, search and display preferences independently.
    const known = Object.keys(localStorage).some(name => /^(atlas-|research-atlas)/.test(name));
    return { status: known ? 'dismissed' : 'new', step: 0 };
  } catch { return { status: 'dismissed', step: 0 }; }
}
export function writeTour(state: TourState) {
  try { localStorage.setItem(key, JSON.stringify(state)); } catch { /* Current-session choices still apply. */ }
}
