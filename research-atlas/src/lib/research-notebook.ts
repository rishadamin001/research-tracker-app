import { z } from 'zod';
import { claimReviewLabels, evidenceLevelLabels } from './evidence-ledger';
import type { Paper, Project } from './model';

export const notebookNoteLimit = 300;
export const notebookSourceLimit = 12;

const notebookSourceSchema = z.object({
  paperId: z.string().max(500),
  title: z.string().max(20000),
  doi: z.string().max(500).nullable(),
});
export type NotebookSource = z.infer<typeof notebookSourceSchema>;

const notebookFields = {
  id: z.uuid(),
  text: z.string().trim().min(1).max(6000),
  sources: z.array(notebookSourceSchema).max(notebookSourceLimit),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
};

export const notebookNoteSchema = z.discriminatedUnion('kind', [
  z.object({ ...notebookFields, kind: z.literal('interpretation') }),
  z.object({
    ...notebookFields,
    kind: z.literal('question'),
    status: z.enum(['open', 'done']),
    nextStep: z.string().trim().max(2000),
  }),
]);
export type NotebookNote = z.infer<typeof notebookNoteSchema>;
export type NotebookProject = Pick<Project, 'title' | 'papers'> & { notebookNotes?: NotebookNote[] };

export type NotebookEntry = {
  key: string;
  kind: 'finding' | 'interpretation' | 'question' | 'earlier';
  label: string;
  text: string;
  sources: NotebookSource[];
  createdAt?: string;
  locator?: string;
  basis?: string;
  review?: string;
  uncertainty?: string;
  status?: 'open' | 'done';
  nextStep?: string;
  noteId?: string;
  claimId?: string;
};

export function notebookSource(paper: Paper): NotebookSource {
  return { paperId: paper.id, title: paper.title, doi: paper.doi?.slice(0, 500) ?? null };
}

export function notebookEntries(project: NotebookProject): NotebookEntry[] {
  const notes: NotebookEntry[] = (project.notebookNotes ?? []).map(note => ({
    key: note.id,
    kind: note.kind,
    label: note.kind === 'interpretation' ? 'My interpretation' : 'Question / next action',
    text: note.text,
    sources: note.sources,
    createdAt: note.createdAt,
    noteId: note.id,
    ...(note.kind === 'question' ? { status: note.status, nextStep: note.nextStep } : {}),
  }));
  const fromSources = project.papers.flatMap((paper, paperIndex) => {
    const entries: NotebookEntry[] = [];
    const sources = [notebookSource(paper)];
    if (paper.notes.trim()) entries.push({
      key: `earlier-note-${paperIndex}`, kind: 'earlier', label: 'Earlier working note', text: paper.notes, sources,
    });
    if (paper.finding.trim()) entries.push({
      key: `earlier-finding-${paperIndex}`, kind: 'earlier', label: 'Earlier extraction',
      text: paper.finding, locator: paper.locator, sources,
    });
    for (const claim of paper.evidenceClaims ?? []) {
      const key = `${paperIndex}-${claim.id}`;
      if (claim.claimType === 'finding' && (claim.evidenceLevel === 'abstract' || claim.evidenceLevel === 'full_text')) {
        entries.push({
          key, kind: 'finding', label: 'Source finding', text: claim.claimText, sources,
          createdAt: claim.createdAt, locator: claim.locator, basis: evidenceLevelLabels[claim.evidenceLevel],
          review: claimReviewLabels[claim.reviewStatus], uncertainty: claim.uncertainty, claimId: claim.id,
        });
      }
      if (claim.interpretation.trim()) entries.push({
        key: `${key}-interpretation`, kind: 'interpretation', label: 'My interpretation · Evidence Desk',
        text: claim.interpretation, sources, createdAt: claim.createdAt, locator: claim.locator,
        basis: evidenceLevelLabels[claim.evidenceLevel], claimId: claim.id,
      });
    }
    return entries;
  });
  return [...notes, ...fromSources].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export function notebookEntryDetails(entry: NotebookEntry) {
  return [
    entry.basis && `Reading basis: ${entry.basis}`,
    entry.locator && `Location: ${entry.locator}`,
    entry.review && `Review: ${entry.review}`,
    entry.uncertainty && `Uncertainty: ${entry.uncertainty}`,
    entry.status && `Status: ${entry.status === 'done' ? 'Done' : 'Open'}`,
    entry.nextStep && `Next step: ${entry.nextStep}`,
  ].filter((line): line is string => Boolean(line));
}

export function notebookText(project: NotebookProject, entries = notebookEntries(project)) {
  return [
    `Researcher's Notebook — ${project.title}`,
    ...entries.map(entry => [
      entry.label,
      entry.createdAt && `Authored: ${entry.createdAt}`,
      ...entry.sources.map(source => `Source: ${source.title || 'Untitled source'}${source.doi ? ` (DOI: ${source.doi})` : ''}`),
      ...notebookEntryDetails(entry),
      '',
      entry.text,
    ].filter(line => line !== undefined).join('\n')),
  ].join('\n\n---\n\n') + '\n';
}
