import type { Paper } from '@/lib/model';

export function ReferenceTransferGuides({ seed }: { seed?: Paper }) {
  return <details className="reference-transfer">
    <summary>Use these references in another tool</summary>
    <ul>
      <li>Download BibTeX for <a href="https://learn.researchrabbit.ai/en/articles/12454528-how-to-search-in-researchrabbit" target="_blank" rel="noreferrer">ResearchRabbit import</a>.</li>
      <li>Download RIS or BibTeX for <a href="https://docs.litmaps.com/en/articles/9081738-import-articles-into-litmaps" target="_blank" rel="noreferrer">Litmaps import</a> or <a href="https://www.zotero.org/support/kb/importing_standardized_formats" target="_blank" rel="noreferrer">Zotero import</a>.</li>
      <li>Paste a DOI or title into <a href="https://www.connectedpapers.com/" target="_blank" rel="noreferrer">Connected Papers</a> to start from a single paper.</li>
    </ul>
    {seed && <label className="field">
      <span>{seed.doi ? 'DOI for Connected Papers' : 'Title for Connected Papers'}</span>
      <input readOnly value={seed.doi ?? seed.title} onFocus={event => event.currentTarget.select()} />
    </label>}
    <p>Import the downloaded file in the other tool. You choose which references to share there.</p>
  </details>;
}
