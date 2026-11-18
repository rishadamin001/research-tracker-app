import { useMemo, useState } from 'react';
import { citationCslReference, cslBibliographyStyles, formatCslBibliography, type CslBibliographyStyle } from '@/lib/csl-bibliography';
import type { Project } from '@/lib/model';
import { download } from '@/lib/storage';
import type { WritingCitation } from '@/lib/writing-studio';

export function BibliographyStylePreview({ papers, citations }: { papers: Project['papers']; citations: WritingCitation[] }) {
  const [style, setStyle] = useState<CslBibliographyStyle>('apa');
  const result = useMemo(() => {
    try {
      const sources = citations.slice().sort((left, right) => left.number - right.number).map(citation => citationCslReference({ papers }, citation));
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
