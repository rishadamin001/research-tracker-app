import { z } from 'zod';

export const progressKey = 'atlas-practice-progress-v1';

const progressSchema = z.record(z.string(), z.object({
  reflection: z.string().max(1000),
  checkedOption: z.number().int().min(0).max(2).optional(),
  revisitAt: z.number().finite().nonnegative().max(8.64e15).optional(),
}));

type Progress = z.infer<typeof progressSchema>;

export type LessonProgress = Progress[string];

export const emptyProgress: LessonProgress = { reflection: '' };

export function readProgress(): Progress {
  try {
    return progressSchema.parse(JSON.parse(localStorage.getItem(progressKey) ?? '{}'));
  } catch {
    return {};
  }
}
