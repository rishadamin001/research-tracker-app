import CSL from 'citeproc';
import sourceData from '../assets/csl/sources.json';

export const cslBibliographyStyles = {
  apa: 'APA 7',
  ieee: 'IEEE',
  vancouver: 'Vancouver (NLM citation-sequence)',
} as const;

export type CslBibliographyStyle = keyof typeof cslBibliographyStyles;
export type CslName = { family: string; given?: string; literal?: never } | { literal: string; family?: never; given?: never };
export type CslDate = readonly [year: number] | readonly [year: number, month: number] | readonly [year: number, month: number, day: number];
export type CslReference = {
  id: string;
  type: 'article' | 'article-journal' | 'book' | 'chapter' | 'paper-conference' | 'report' | 'thesis' | 'webpage';
  title: string;
  authors?: readonly CslName[];
  editors?: readonly CslName[];
  issued?: CslDate;
  containerTitle?: string;
  containerTitleShort?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  publisher?: string;
  publisherPlace?: string;
  edition?: string;
};

export type CslBibliographyEntry = { id: string; text: string };

const locale = sourceData.locale.join('\n');

function citeprocItem(reference: CslReference, id: string): Record<string, unknown> {
  const names = (people: readonly CslName[] | undefined) => people?.map(person => person.literal === undefined
    ? { family: person.family, given: person.given }
    : { literal: person.literal });

  return {
    id,
    type: reference.type,
    title: reference.title,
    author: names(reference.authors),
    editor: names(reference.editors),
    issued: reference.issued ? { 'date-parts': [[...reference.issued]] } : undefined,
    'container-title': reference.containerTitle,
    'container-title-short': reference.containerTitleShort,
    volume: reference.volume,
    issue: reference.issue,
    page: reference.pages,
    DOI: reference.doi,
    URL: reference.url,
    publisher: reference.publisher,
    'publisher-place': reference.publisherPlace,
    edition: reference.edition,
  };
}

export function formatCslBibliography(style: CslBibliographyStyle, references: readonly CslReference[]): CslBibliographyEntry[] {
  if (!references.length) return [];
  if (new Set(references.map(reference => reference.id)).size !== references.length) {
    throw Error('Each bibliography reference needs a distinct identifier.');
  }

  // Give Citeproc internal IDs and preserve the caller's stable source IDs in its output order.
  const records = new Map(references.map((reference, index) => {
    const engineId = `atlas-reference-${index + 1}`;
    return [engineId, { id: reference.id, item: citeprocItem(reference, engineId) }];
  }));
  const engine = new CSL.Engine({
    retrieveLocale: () => locale,
    retrieveItem: id => {
      const record = records.get(id);
      if (!record) throw Error('The citation formatter requested an unknown reference.');
      return record.item;
    },
  }, sourceData[style].join('\n'), 'en-US');
  engine.setOutputFormat('text');
  engine.updateItems([...records.keys()]);
  const result = engine.makeBibliography();
  if (!result || result[1].length !== references.length) throw Error('Could not format every bibliography reference.');
  const [{ entry_ids: ids }, entries] = result;
  return entries.map((text, index) => {
    const [engineId, ...extraIds] = ids[index] ?? [];
    const record = records.get(engineId);
    if (!record || extraIds.length) throw Error('Could not match a formatted entry to its source.');
    return { id: record.id, text: text.trim() };
  });
}
