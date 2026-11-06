import { normalizeDoi, paperSchema, safeUrl, type Paper } from './model';
import { normalizeIssn } from './ranking';

export const referenceFileLimit = 1_000_000;
export const projectReferenceLimit = 2_000;
export type ReferenceFormat = 'ris' | 'bibtex';

type Citation = {
  title: string;
  authors: string[];
  key?: string;
  doi?: string;
  openalex?: string;
  url?: string;
  date?: string;
  year?: string;
  venue?: string;
  publisher?: string;
  serials?: string[];
  isbn?: string;
  kind?: string;
};

function clean(value = '', limit = 20_000) {
  return value.replace(/[\x00-\x1f\x7f]/g, ' ').replace(/\s+/gu, ' ').trim().slice(0, limit);
}

function referenceUrl(value: string | undefined) {
  if (!value || value.length > 2000) return undefined;
  const safe = safeUrl(value);
  if (!safe) return undefined;
  const { username, password } = new URL(safe);
  return username || password ? undefined : safe;
}

function doiFrom(...values: (string | undefined)[]) {
  for (const value of values) {
    if (!value) continue;
    try {
      const url = referenceUrl(value) && new URL(value);
      if (url && /^(?:dx\.)?doi\.org$/i.test(url.hostname)) return normalizeDoi(decodeURIComponent(url.pathname.slice(1)));
      return normalizeDoi(value);
    } catch { /* Keep looking for a recognized DOI. */ }
  }
  return null;
}

function openAlexId(...values: (string | undefined)[]) {
  for (const value of values) {
    const work = /^https?:\/\/openalex\.org\/(W\d+)\/?$/i.exec(value?.trim() ?? '')?.[1];
    if (work) return `https://openalex.org/${work.toUpperCase()}`;
  }
}

function dateParts(value = '', fallback = '') {
  const match = /^(\d{4})(?=$|[-/\s])(?:[-/](\d{1,2})[-/](\d{1,2})(?:[T/\s]|$))?/.exec(value.trim());
  const year = Number(match?.[1] ?? /^(\d{4})\b/.exec(fallback.trim())?.[1]) || null;
  const iso = match?.[2] && match?.[3] ? `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}` : undefined;
  const time = iso && Date.parse(iso);
  const publicationDate = typeof time === 'number' && Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === iso ? iso : undefined;
  return { year, publicationDate };
}

function serials(values: string[]) {
  const ids = new Set<string>();
  for (const value of values) {
    for (const match of value.matchAll(/(?<!\d)\d{4}-?\d{3}[\dX](?!\d)/gi)) {
      try { ids.add(normalizeIssn(match[0])); } catch { /* Skip an invalid ISSN. */ }
    }
  }
  return [...ids].slice(0, 12);
}

function paperFromCitation(citation: Citation, format: ReferenceFormat): Paper | undefined {
  const title = clean(citation.title);
  if (!title) return undefined;
  const doi = doiFrom(citation.doi, citation.url);
  const openAlex = openAlexId(citation.openalex, citation.key, citation.url);
  const issns = serials(citation.serials ?? []);
  const referenceAuthors = citation.authors.map(author => clean(author, 500)).filter(Boolean).slice(0, 500);
  const workType = citation.kind;
  return paperSchema.parse({
    id: openAlex ?? `reference:${crypto.randomUUID()}`,
    title,
    authors: clean(referenceAuthors.join(', ')),
    referenceAuthors,
    referenceKey: clean(citation.key, 500) || undefined,
    isbn: clean(citation.isbn, 40) || undefined,
    ...dateParts(citation.date || citation.year, citation.year),
    doi,
    journal: clean(citation.venue),
    publisher: clean(citation.publisher, 500) || undefined,
    venueType: workType === 'article' ? 'journal' : workType === 'conference-paper' ? 'conference' : undefined,
    workType,
    issns: issns.length ? issns : undefined,
    url: referenceUrl(citation.url) ?? (doi ? `https://doi.org/${doi.split('/').map(encodeURIComponent).join('/')}` : openAlex ?? ''),
    oa: null,
    source: format === 'ris' ? 'RIS import' : 'BibTeX import',
  });
}

const risTypes = new Map([['JOUR', 'article'], ['JFULL', 'article'], ['CONF', 'conference-paper'], ['CPAPER', 'conference-paper'], ['BOOK', 'book'], ['CHAP', 'book-chapter'], ['THES', 'dissertation'], ['RPRT', 'report'], ['DATA', 'dataset']]);

function displayAuthor(name: string) {
  const [last, firstOrSuffix, first] = name.split(',').map(part => part.trim());
  if (firstOrSuffix === undefined) return name;
  return first ? `${first} ${last}, ${firstOrSuffix}` : `${firstOrSuffix} ${last}`.trim();
}

function parseRis(text: string) {
  const entries: Citation[] = [];
  let fields: Map<string, string[]> | undefined;
  let lastTag = '';
  for (const [index, line] of text.split(/\r\n|\n|\r/).entries()) {
    const tag = /^([A-Z][A-Z0-9])\s*-[ \t]?(.*)$/i.exec(line);
    const name = tag?.[1].toUpperCase();
    if (name === 'TY') {
      if (fields) throw Error(`The RIS record before line ${index + 1} is missing its ER end tag.`);
      fields = new Map();
    }
    if (!fields) continue;
    if (name === 'ER') {
      const all = (...names: string[]) => names.flatMap(key => fields?.get(key) ?? []);
      const one = (...names: string[]) => all(...names).find(value => value.trim());
      const kind = risTypes.get(one('TY')?.trim().toUpperCase() ?? '');
      const sn = all('SN');
      entries.push({ title: one('TI', 'T1', 'CT', 'BT') ?? '', authors: (fields.get('AU') ?? fields.get('A1') ?? []).map(displayAuthor),
        doi: one('DO'), url: one('UR'), key: one('ID', 'AN'), openalex: one('AN'), date: one('DA', 'Y1', 'PY'), year: one('PY', 'Y1'),
        venue: one('JF', 'JO', 'T2', 'JA'), publisher: one('PB'), serials: sn, isbn: sn.find(value => /^(?:\d[ -]?){9,12}[\dX]$/i.test(value.trim())), kind });
      if (entries.length > projectReferenceLimit) throw Error(`Import up to ${projectReferenceLimit.toLocaleString()} references at a time.`);
      fields = undefined;
    } else if (name && tag) {
      const prior = fields.get(name);
      if (prior) prior.push(tag[2]);
      else fields.set(name, [tag[2]]);
      lastTag = name;
    } else if (line.trim()) {
      const prior = fields.get(lastTag);
      if (prior?.length) prior[prior.length - 1] += ` ${line.trim()}`;
    }
  }
  if (fields) throw Error('The last RIS record is missing its ER end tag.');
  return entries;
}

const texCharacters: Record<string, string> = {
  '\\': '\\textbackslash{}', '{': '\\{', '}': '\\}', '#': '\\#', '$': '\\$', '%': '\\%',
  '&': '\\&', '_': '\\_', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
};
const texEscapes = new Map(Object.entries(texCharacters).map(([character, escaped]) => [escaped, character]));

function bibText(value = '') {
  return value.replace(/\\(?:textbackslash\{\}|textasciitilde\{\}|textasciicircum\{\}|[{}#$%&_])|[{}]/g, escape => texEscapes.get(escape) ?? '');
}

function bibAuthors(value = '') {
  const authors: string[] = [];
  let depth = 0;
  let start = 0;
  for (const match of value.matchAll(/\\[{}]|[{}]|\s+and\s+/gi)) {
    if (match[0] === '{') depth++;
    else if (match[0] === '}') depth--;
    else if (depth === 0 && !match[0].startsWith('\\')) {
      authors.push(value.slice(start, match.index));
      start = match.index + match[0].length;
    }
  }
  authors.push(value.slice(start));
  return authors.map(author => {
    const name = bibText(author).trim();
    return author.trim().startsWith('{') ? name : displayAuthor(name);
  });
}

const bibTypes = new Map([['article', 'article'], ['inproceedings', 'conference-paper'], ['conference', 'conference-paper'], ['book', 'book'], ['incollection', 'book-chapter'], ['inbook', 'book-chapter'], ['phdthesis', 'dissertation'], ['mastersthesis', 'dissertation'], ['techreport', 'report'], ['report', 'report'], ['dataset', 'dataset']]);
const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

function parseBibtex(text: string) {
  const entries: Citation[] = [];
  const strings = new Map(months.map((name, index) => [name, String(index + 1)]));
  let position = 0;
  let expandedSize = 0;

  function invalid(message: string): never {
    const line = text.slice(0, position).split('\n').length;
    throw Error(`BibTeX line ${line}: ${message}`);
  }

  function skip() {
    while (position < text.length) {
      if (/\s/u.test(text[position])) position++;
      else if (text[position] === '%') {
        const next = text.indexOf('\n', position);
        position = next < 0 ? text.length : next + 1;
      } else break;
    }
  }

  function token(pattern: RegExp, message: string) {
    pattern.lastIndex = position;
    const match = pattern.exec(text);
    if (!match) return invalid(message);
    position = pattern.lastIndex;
    return match[0];
  }

  function delimited(opener: string) {
    const closer = opener === '{' ? '}' : opener === '(' ? ')' : '"';
    const start = ++position;
    let braces = 0;
    let parentheses = 0;
    while (position < text.length) {
      const character = text[position++];
      if (character === '\\') { position++; continue; }
      if (character === closer && braces === 0 && parentheses === 0) return text.slice(start, position - 1);
      if (character === '{') braces++;
      if (character === '}') braces--;
      if (opener === '(' && braces === 0 && character === '(') parentheses++;
      if (opener === '(' && braces === 0 && character === ')') parentheses--;
      if (braces < 0) return invalid('unbalanced braces.');
    }
    return invalid('a field or entry is missing its closing delimiter.');
  }

  function expression() {
    let value = '';
    do {
      skip();
      const start = text[position];
      let part: string;
      if (start === '{' || start === '"') part = delimited(start);
      else {
        const atom = token(/[^\s,})#=]+/y, 'expected a field value.');
        part = strings.get(atom.toLowerCase()) ?? atom;
      }
      expandedSize += part.length;
      if (expandedSize > referenceFileLimit) return invalid('expanded fields exceed the 1 MB import limit.');
      value += part;
      skip();
      if (text[position] !== '#') break;
      position++;
    } while (position < text.length);
    return value;
  }

  while (position < text.length) {
    skip();
    if (position >= text.length) break;
    if (text[position++] !== '@') return invalid('expected an entry beginning with @.');
    skip();
    const type = token(/[a-z][a-z0-9_-]*/iy, 'expected an entry type.').toLowerCase();
    skip();
    const opener = text[position];
    if (opener !== '{' && opener !== '(') return invalid('expected an opening brace or parenthesis.');
    if (type === 'comment' || type === 'preamble') { delimited(opener); continue; }
    const closer = opener === '{' ? '}' : ')';
    position++;
    skip();
    const key = type === 'string' ? '' : token(/[^\s,{}()]+/y, 'expected a reference key.');
    skip();
    if (type !== 'string' && text[position] === ',') { position++; skip(); }
    else if (type !== 'string' && text[position] !== closer) return invalid('expected a comma after the reference key.');

    const fields = new Map<string, string>();
    while (text[position] !== closer) {
      const name = token(/[a-z][a-z0-9_.:-]*/iy, 'expected a field name.').toLowerCase();
      skip();
      if (text[position++] !== '=') return invalid(`expected = after ${name}.`);
      const value = expression();
      fields.set(name, value);
      if (text[position] === closer) break;
      if (text[position++] !== ',') return invalid(`expected a comma after ${name}.`);
      skip();
    }
    position++;
    if (type === 'string') {
      for (const [name, value] of fields) strings.set(name, value);
      continue;
    }
    const get = (name: string) => bibText(fields.get(name));
    entries.push({ title: get('title'), authors: bibAuthors(fields.get('author')), key, doi: get('doi'), url: get('url'),
      openalex: get('openalex'), venue: get('journaltitle') || get('journal') || get('booktitle'), publisher: get('publisher'),
      date: get('date'), year: get('year'), serials: [get('issn')], isbn: get('isbn'), kind: bibTypes.get(type) });
    if (entries.length > projectReferenceLimit) throw Error(`Import up to ${projectReferenceLimit.toLocaleString()} references at a time.`);
  }
  return entries;
}

export function parseReferenceFile(raw: string, format: ReferenceFormat) {
  if (new TextEncoder().encode(raw).length > referenceFileLimit) throw Error('Choose a reference file under 1 MB.');
  const entries = format === 'ris' ? parseRis(raw.replace(/^\uFEFF/, '')) : parseBibtex(raw.replace(/^\uFEFF/, ''));
  if (!entries.length) throw Error('The file does not contain any references in the selected format.');
  const papers = entries.flatMap(entry => paperFromCitation(entry, format) ?? []);
  if (!papers.length) throw Error('The file contains no references with titles.');
  return { papers, skipped: entries.length - papers.length };
}

function comparisonText(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function creators(paper: Paper) {
  return paper.referenceAuthors ?? paper.authors.split(',').map(author => author.trim()).filter(Boolean);
}

export function reviewReferenceImport(incoming: Paper[], existing: Paper[]) {
  const ids = new Set<string>();
  const dois = new Set<string>();
  const byTitle = new Map<string, Paper>();
  const additions: { paper: Paper; similar?: Paper }[] = [];
  let duplicates = 0;

  for (const [papers, reviewing] of [[existing, false], [incoming, true]] as const) {
    for (const paper of papers) {
      const id = openAlexId(paper.id, paper.url) ?? paper.id;
      const doi = doiFrom(paper.doi ?? undefined, paper.url);
      if (reviewing && (ids.has(id) || (doi && dois.has(doi)))) { duplicates++; continue; }
      ids.add(id);
      if (doi) dois.add(doi);

      const title = comparisonText(paper.title);
      const firstAuthor = comparisonText((creators(paper)[0] ?? '').split(',')[0]).split(' ').at(-1) ?? '';
      if (title.length < 16 || !firstAuthor || paper.year == null) {
        if (reviewing) additions.push({ paper });
        continue;
      }
      const key = `${title}|${firstAuthor}|`;
      const similar = byTitle.get(`${key}${paper.year}`) ?? byTitle.get(`${key}${paper.year - 1}`) ?? byTitle.get(`${key}${paper.year + 1}`);
      if (reviewing) additions.push({ paper, similar });
      const exactYear = `${key}${paper.year}`;
      if (!byTitle.has(exactYear)) byTitle.set(exactYear, paper);
    }
  }
  return { additions, duplicates };
}

const exportTypes = new Map([
  ['article', ['JOUR', 'article']], ['conference-paper', ['CPAPER', 'inproceedings']], ['book', ['BOOK', 'book']],
  ['book-chapter', ['CHAP', 'incollection']], ['dissertation', ['THES', 'phdthesis']], ['report', ['RPRT', 'techreport']], ['dataset', ['DATA', 'dataset']],
]);

function exportType(paper: Paper) {
  const type = paper.venueType === 'journal' ? 'article' : paper.venueType === 'conference' ? 'conference-paper' : paper.workType ?? '';
  return exportTypes.get(type) ?? ['GEN', 'misc'];
}

function risRecord(paper: Paper) {
  const openAlex = openAlexId(paper.id);
  const fields = [['TY', exportType(paper)[0]], ['TI', paper.title], ...creators(paper).map(author => ['AU', author]),
    ['PY', paper.publicationDate?.replaceAll('-', '/') ?? paper.year], ['T2', paper.journal], ['PB', paper.publisher],
    ['DO', paper.doi], ['UR', referenceUrl(paper.url)], ['ID', paper.referenceKey ?? openAlex],
    ['AN', paper.referenceKey && paper.referenceKey !== openAlex ? openAlex : undefined],
    ...[...(paper.issns ?? []), paper.isbn].map(identifier => ['SN', identifier])];
  return `${fields.filter(([, value]) => value != null && value !== '').map(([key, value]) => `${key}  - ${clean(String(value))}`).join('\r\n')}\r\nER  -`;
}

function bibRecord(paper: Paper, key: string) {
  const escape = (value: string) => clean(value).replace(/[\\{}#$%&_~^]/g, character => texCharacters[character]);
  const type = exportType(paper)[1];
  const author = creators(paper).map(name => /\s+and\s+|,/i.test(name) ? `{${escape(name)}}` : escape(name)).join(' and ');
  const fields = [['title', paper.title], [type === 'inproceedings' || type === 'incollection' ? 'booktitle' : 'journal', paper.journal],
    ['publisher', paper.publisher], ['year', paper.year], ['date', paper.publicationDate], ['doi', paper.doi],
    ['url', referenceUrl(paper.url)], ['openalex', openAlexId(paper.id)], ['issn', paper.issns?.join(', ')], ['isbn', paper.isbn]];
  const lines = fields.filter(([, value]) => value != null && value !== '').map(([field, value]) => `  ${field} = {${escape(String(value))}}`);
  if (author) lines.push(`  author = {${author}}`);
  return `@${type}{${key},\n${lines.join(',\n')}\n}`;
}

export function exportReferences(papers: Paper[], format: ReferenceFormat) {
  if (format === 'ris') return `${papers.map(risRecord).join('\r\n\r\n')}\r\n`;
  const usedKeys = new Set<string>();
  const records = papers.map((paper, index) => {
    const base = paper.referenceKey?.replace(/[^a-z0-9:._-]/gi, '-') || `atlas-${index + 1}`;
    let key = base;
    let suffix = 2;
    while (usedKeys.has(key.toLowerCase())) key = `${base}-${suffix++}`;
    usedKeys.add(key.toLowerCase());
    return bibRecord(paper, key);
  });
  return `${records.join('\n\n')}\n`;
}
