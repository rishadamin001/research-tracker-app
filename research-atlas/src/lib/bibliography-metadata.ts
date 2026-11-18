import { z } from 'zod';

export const bibliographyText = z.string().trim().min(1).max(500);
const bibliographyName = z.union([
  z.object({ family: bibliographyText, given: bibliographyText.optional() }),
  z.object({ literal: bibliographyText }),
]);

export const bibliographyMetadataSchema = z.object({
  authors: z.array(bibliographyName).min(1).max(500).optional(),
  publicationMonth: z.number().int().min(1).max(12).optional(),
  journalAbbreviation: bibliographyText.optional(),
  volume: bibliographyText.optional(),
  issue: bibliographyText.optional(),
  pages: bibliographyText.optional(),
});
export type BibliographyMetadata = z.infer<typeof bibliographyMetadataSchema>;

export function bibliographyMetadata(fields: BibliographyMetadata): BibliographyMetadata | undefined {
  const { authors, publicationMonth, journalAbbreviation, volume, issue, pages } = fields;
  return authors || publicationMonth || journalAbbreviation || volume || issue || pages
    ? { authors, publicationMonth, journalAbbreviation, volume, issue, pages }
    : undefined;
}

export function pageRange(first: string | null | undefined, last: string | null | undefined) {
  if (!first) return undefined;
  return bibliographyText.safeParse(last && last !== first ? `${first}-${last}` : first).data;
}
