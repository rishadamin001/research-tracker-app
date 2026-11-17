import { useMemo, useState } from 'react';
import { cslBibliographyStyles, formatCslBibliography, type CslBibliographyStyle, type CslReference } from '@/lib/csl-bibliography';
import { normalizeDoi, type Paper, type Project } from '@/lib/model';
import { download } from '@/lib/storage';
import { citationSourceUrl, currentCitationPaper, type WritingCitation } from '@/lib/writing-studio';

function itemType(paper: Paper | undefined): CslReference['type'] {
  switch (paper?.workType) {
    case 'book': return 'book';
    case 'book-chapter': case 'chapter': return 'chapter';
    case 'proceedings-article': case 'conference-paper': return 'paper-conference';
    case 'dissertation': case 'thesis': return 'thesis';
    case 'report': return 'report';
    case 'journal-article': return 'article-journal';
    default: return paper?.venueType === 'journal' ? 'article-journal' : 'article';
  }
}

function reference(project: Pick<Project, 'papers'>, citation: WritingCitation): CslReference {
  const snapshot = citation.sourceSnapshot;
  const authors = snapshot.referenceAuthors?.length ? snapshot.referenceAuthors : [snapshot.authors];
  let doi: string | undefined;
  try { if (snapshot.doi) doi = normalizeDoi(snapshot.doi); } catch { /* The source link is the fallback. */ }
  const venue = snapshot.journal.trim();
  return {
    id: citation.id,
    type: itemType(currentCitationPaper(project, citation)),
    title: snapshot.title,
    authors: authors.filter(author => author.trim()).map(literal => ({ literal })),
    issued: snapshot.year != null && Number.isInteger(snapshot.year) && snapshot.year > 0 ? [snapshot.year] : undefined,
    containerTitle: venue && venue !== 'Source not supplied' ? venue : undefined,
    publisher: snapshot.publisher,
    ...(doi ? { doi } : { url: citationSourceUrl(citation) }),
  };
}

function StylePreview({ papers, citations }: { papers: Project['papers']; citations: WritingCitation[] }) {
  const [style, setStyle] = useState<CslBibliographyStyle>('apa');
  const result = useMemo(() => {
    try {
      const sources = citations.slice().sort((left, right) => left.number - right.number).map(citation => reference({ papers }, citation));
      return { text: formatCslBibliography(style, sources).map(entry => entry.text).join('\n\n'), error: false };
    } catch { return { text: '', error: true }; }
  }, [papers, citations, style]);
  return <>
    <p>(c) Frank Bennett. citeproc-js implements the <a href="https://citationstyles.org/">Citation Style Language</a>. <a href="https://github.com/rishadamin001/research-tracker-app/blob/main/research-atlas/docs/CSL-SOURCES.md">Bibliography styles and notices</a>.</p>
    <label className="field"><span>Bibliography style</span><select value={style} onChange={event => setStyle(event.target.value as CslBibliographyStyle)}>
      {Object.entries(cslBibliographyStyles).map(([id, label]) => <option key={id} value={id}>{label}</option>)}
    </select></label>
    <p>Author names are shown as saved when separate name parts are unavailable. Check missing publication details before submission.</p>
    {result.error ? <p role="alert" className="error">Could not format the bibliography. Review the saved reference details and try again.</p>
      : <pre className="writing-preview" role="region" aria-label="Formatted bibliography" tabIndex={0}>{result.text}</pre>}
    <button type="button" className="button secondary" disabled={!result.text} onClick={() => download(`bibliography-${style}.txt`, result.text, 'text/plain;charset=utf-8')}>Download formatted bibliography</button>
    <p className="muted">This standalone export is plain text. Its numbering may differ from the markers in your draft.</p>
  </>;
}

export function FormattedBibliography({ project, citations }: { project: Project; citations: WritingCitation[] }) {
  const [open, setOpen] = useState(false);
  return <details onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>Format a bibliography</summary>
    {open && <StylePreview papers={project.papers} citations={citations} />}
  </details>;
}
