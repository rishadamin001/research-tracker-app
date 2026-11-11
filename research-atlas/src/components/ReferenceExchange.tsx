import { useMemo, useState, type ChangeEvent } from 'react';
import { Download, FileUp } from 'lucide-react';
import type { Paper, Project } from '@/lib/model';
import { exportReferences, parseReferenceFile, projectReferenceLimit, referenceFileLimit, reviewReferenceImport, type ReferenceFormat } from '@/lib/reference-exchange';
import { download } from '@/lib/storage';
import './reference-exchange.css';

const pageSize = 8;
type Preview = ReturnType<typeof parseReferenceFile> & { fileName: string };

function PageButtons({ name, page, total, onChange }: { name: string; page: number; total: number; onChange: (page: number) => void }) {
  if (total <= 1) return null;
  return <nav className="button-row" aria-label={name}>
    <button type="button" className="button secondary small" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous page</button>
    <span>Page {page + 1} of {total}</span>
    <button type="button" className="button secondary small" disabled={page + 1 >= total} onClick={() => onChange(page + 1)}>Next page</button>
  </nav>;
}

function ReferenceDetails({ paper }: { paper: Paper }) {
  const citation = [paper.authors || 'Authors unavailable', paper.publicationDate ?? paper.year ?? 'Date unavailable', paper.journal || 'Publication unavailable'];
  return <>
    <span className="reference-detail">{citation.join(' · ')}</span>
    <span className="reference-detail">{paper.doi ? `DOI ${paper.doi}` : 'DOI unavailable'} · {paper.source}</span>
    {/^https:\/\/(openalex\.org|europepmc\.org)\//.test(paper.id) && <span className="reference-detail">Record ID {paper.id}</span>}
  </>;
}

function TransferGuides({ seed }: { seed?: Paper }) {
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

export function ReferenceExchange({ project, onImport }: { project: Project; onImport: (papers: Paper[]) => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview>();
  const [includeMatches, setIncludeMatches] = useState<Set<string>>(() => new Set());
  const [excludeNew, setExcludeNew] = useState<Set<string>>(() => new Set());
  const [importPage, setImportPage] = useState(0);
  const [exactPage, setExactPage] = useState(0);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [exportSelection, setExportSelection] = useState<Set<string> | null>(null);
  const [exportQuery, setExportQuery] = useState('');
  const [exportPage, setExportPage] = useState(0);

  const reviewed = useMemo(() => preview && reviewReferenceImport(preview.papers, project.papers), [preview, project.papers]);
  const accepted = reviewed?.additions.filter(({ paper, similar }) => similar ? includeMatches.has(paper.id) : !excludeNew.has(paper.id)) ?? [];
  const possibleCount = reviewed?.additions.filter(item => item.similar).length ?? 0;
  const available = projectReferenceLimit - project.papers.length;
  const importPages = Math.ceil((reviewed?.additions.length ?? 0) / pageSize);
  const exactPages = Math.ceil((reviewed?.duplicates ?? 0) / pageSize);
  const visibleImportPage = Math.min(importPage, Math.max(0, importPages - 1));
  const visibleExactPage = Math.min(exactPage, Math.max(0, exactPages - 1));
  const matching = useMemo(() => {
    const query = exportQuery.trim().toLocaleLowerCase();
    return project.papers.filter(paper => [paper.title, paper.authors, paper.doi, paper.journal, ...(paper.tags ?? [])]
      .some(value => value?.toLocaleLowerCase().includes(query)));
  }, [exportQuery, project.papers]);
  const exportPages = Math.ceil(matching.length / pageSize);
  const visibleExportPage = Math.min(exportPage, Math.max(0, exportPages - 1));
  const chosen = exportSelection === null ? project.papers : project.papers.filter(paper => exportSelection.has(paper.id));
  const seed = chosen.length === 1 ? chosen[0] : undefined;

  function clearPreview() {
    setPreview(undefined);
    setIncludeMatches(new Set());
    setExcludeNew(new Set());
    setImportPage(0);
    setExactPage(0);
  }

  async function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    clearPreview();
    setError('');
    setNotice('');
    const format = /\.ris$/i.test(file.name) ? 'ris' : /\.bib(?:tex)?$/i.test(file.name) ? 'bibtex' : undefined;
    if (!format) { setError('Choose a .ris, .bib, or .bibtex file.'); return; }
    if (file.size > referenceFileLimit) { setError('Choose a reference file under 1 MB.'); return; }
    setReading(true);
    try {
      const content = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
      setPreview({ ...parseReferenceFile(content, format), fileName: file.name });
    } catch (failure) {
      setError(failure instanceof TypeError ? 'Save the reference file with UTF-8 encoding and try again.'
        : failure instanceof Error ? failure.message : 'Atlas could not read this reference file.');
    } finally { setReading(false); }
  }

  function exportFile(format: ReferenceFormat) {
    if (!chosen.length) return;
    download(`references.${format === 'ris' ? 'ris' : 'bib'}`, exportReferences(chosen, format), 'text/plain;charset=utf-8');
  }

  function importAccepted() {
    if (!accepted.length || accepted.length > available) return;
    onImport([...project.papers, ...accepted.map(item => item.paper)]);
    setNotice(`${accepted.length} ${accepted.length === 1 ? 'reference added' : 'references added'} to ${project.title}.`);
    clearPreview();
  }

  return <section className="panel reference-exchange" aria-label="Reference exchange">
    <h2>Import and export references</h2>
    <p>Move citation metadata between <strong>{project.title}</strong> and another research tool. Use a project backup to move notes, screening decisions and drafts.</p>
    <div className="button-row">
      <button type="button" className="button secondary" aria-expanded={open} onClick={() => setOpen(value => !value)}><FileUp size={16} aria-hidden="true" /> Import reference file</button>
      <button type="button" className="button secondary" disabled={!project.papers.length} aria-expanded={exportSelection !== null} onClick={() => setExportSelection(value => value === null ? new Set() : null)}>
        {exportSelection === null ? 'Choose references to export' : 'Export the whole project instead'}
      </button>
    </div>
    {exportSelection !== null && <fieldset className="planner-checks reference-options">
      <legend>References to export</legend>
      <label className="field"><span>Filter export references</span><input type="search" maxLength={300} value={exportQuery} onChange={event => { setExportQuery(event.target.value); setExportPage(0); }} placeholder="Title, author, DOI, publication or tag" /></label>
      <p role="status">{chosen.length} of {project.papers.length} selected · {matching.length} match the filter</p>
      <div className="button-row">
        <button type="button" className="button secondary small" disabled={!matching.length} onClick={() => setExportSelection(ids => new Set([...(ids ?? []), ...matching.map(paper => paper.id)]))}>Select all matching references</button>
        <button type="button" className="button secondary small" disabled={!chosen.length} onClick={() => setExportSelection(new Set())}>Clear selection</button>
      </div>
      {matching.slice(visibleExportPage * pageSize, (visibleExportPage + 1) * pageSize).map(paper => <label className="reference-select" key={paper.id}>
        <input type="checkbox" aria-label={`Export ${paper.title}${paper.doi ? ` (DOI ${paper.doi})` : ''}`} checked={exportSelection.has(paper.id)} onChange={event => {
          const next = new Set(exportSelection);
          if (event.target.checked) next.add(paper.id);
          else next.delete(paper.id);
          setExportSelection(next);
        }} />
        <span><strong>{paper.title}</strong><ReferenceDetails paper={paper} /></span>
      </label>)}
      <PageButtons name="Export reference pages" page={visibleExportPage} total={exportPages} onChange={setExportPage} />
    </fieldset>}
    <div className="button-row reference-export-actions">
      <button type="button" className="button secondary" disabled={!chosen.length} onClick={() => exportFile('ris')}><Download size={16} aria-hidden="true" /> Export RIS</button>
      <button type="button" className="button secondary" disabled={!chosen.length} onClick={() => exportFile('bibtex')}><Download size={16} aria-hidden="true" /> Export BibTeX</button>
    </div>
    <TransferGuides seed={seed} />
    {open && <div className="recommendation">
      <p>Choose a UTF-8 RIS or BibTeX file up to 1 MB. Atlas reads it on this device.</p>
      <label className="field"><span>RIS or BibTeX file</span><input type="file" accept=".ris,.bib,.bibtex" disabled={reading} onChange={readFile} /></label>
      {reading && <p role="status">Opening the reference file…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {preview && reviewed && <section aria-label="Reference import preview">
        <h3>Preview reference import</h3>
        <p><strong>{preview.fileName}</strong> → {project.title}</p>
        <p role="status">{accepted.length} ready to add · {reviewed.duplicates} exact matches skipped · {preview.skipped} without titles skipped</p>
        {reviewed.additions.length > 0 && <fieldset className="planner-checks reference-options">
          <legend>Choose which references to add</legend>
          <p>New references are selected. Review the {possibleCount} possible {possibleCount === 1 ? 'duplicate' : 'duplicates'} and select any versions you want to keep separately.</p>
          {reviewed.additions.slice(visibleImportPage * pageSize, (visibleImportPage + 1) * pageSize).map(({ paper, similar, similarOrigin }) => <div key={paper.id} className="reference-review">
            <label className="reference-select">
              <input type="checkbox" checked={similar ? includeMatches.has(paper.id) : !excludeNew.has(paper.id)}
                aria-label={`${similar ? 'Keep' : 'Add'} ${paper.title}${similar ? ' as a separate reference' : ''}${paper.doi ? ` (DOI ${paper.doi})` : ''}`}
                onChange={event => {
                  const checked = event.target.checked;
                  const change = similar ? setIncludeMatches : setExcludeNew;
                  change(values => {
                    const next = new Set(values);
                    if (similar ? checked : !checked) next.add(paper.id);
                    else next.delete(paper.id);
                    return next;
                  });
                }} />
              <span><strong>{paper.title}</strong><ReferenceDetails paper={paper} /></span>
            </label>
            {similar && <div className="reference-match">
              <strong>Possible match {similarOrigin === 'project' ? 'in this project' : 'earlier in this file'}</strong>
              <span className="reference-detail">{similar.title}</span>
              <ReferenceDetails paper={similar} />
            </div>}
          </div>)}
          <PageButtons name="Import reference pages" page={visibleImportPage} total={importPages} onChange={setImportPage} />
        </fieldset>}
        {reviewed.duplicates > 0 && <details className="reference-transfer">
          <summary>Review skipped exact matches</summary>
          <p>Matching identifiers are kept as one reference. Atlas keeps the existing project copy or the first occurrence in this file.</p>
          {reviewed.exactMatches.slice(visibleExactPage * pageSize, (visibleExactPage + 1) * pageSize).map(({ paper, match, by }, index) => <div key={index} className="reference-review reference-exact">
            <div><strong>{paper.title}</strong><ReferenceDetails paper={paper} /></div>
            <div className="reference-match"><strong>Same {by} {match.origin === 'project' ? 'in this project' : 'earlier in this file'}</strong><span className="reference-detail">{match.paper.title}</span><ReferenceDetails paper={match.paper} /></div>
          </div>)}
          <PageButtons name="Exact match pages" page={visibleExactPage} total={exactPages} onChange={setExactPage} />
        </details>}
        {accepted.length > available && <p className="error" role="alert">This project has room for {available} more references. Select fewer references or use another project.</p>}
        <div className="button-row">
          <button type="button" className="button" disabled={!accepted.length || accepted.length > available} onClick={importAccepted}>Add references to project</button>
          <button type="button" className="button secondary" onClick={clearPreview}>Cancel reference import</button>
        </div>
      </section>}
    </div>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
