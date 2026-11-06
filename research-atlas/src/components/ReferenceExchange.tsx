import { useMemo, useState, type ChangeEvent } from 'react';
import { Download, FileUp } from 'lucide-react';
import type { Paper, Project } from '@/lib/model';
import { exportReferences, parseReferenceFile, projectReferenceLimit, referenceFileLimit, reviewReferenceImport, type ReferenceFormat } from '@/lib/reference-exchange';
import { download } from '@/lib/storage';

const reviewPageSize = 8;

export function ReferenceExchange({ project, onImport }: { project: Project; onImport: (papers: Paper[]) => void }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof parseReferenceFile>>();
  const [separate, setSeparate] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const reviewed = useMemo(() => preview && reviewReferenceImport(preview.papers, project.papers), [preview, project.papers]);
  const possible = reviewed?.additions.filter(item => item.similar) ?? [];
  const accepted = reviewed?.additions.filter(item => !item.similar || separate.includes(item.paper.id)) ?? [];
  const available = projectReferenceLimit - project.papers.length;

  function clearPreview() {
    setPreview(undefined);
    setSeparate([]);
    setPage(0);
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
      setPreview(parseReferenceFile(content, format));
    } catch (failure) {
      setError(failure instanceof TypeError ? 'Save the reference file with UTF-8 encoding and try again.'
        : failure instanceof Error ? failure.message : 'Atlas could not read this reference file.');
    } finally { setReading(false); }
  }

  function exportFile(format: ReferenceFormat) {
    download(`references.${format === 'ris' ? 'ris' : 'bib'}`, exportReferences(project.papers, format), 'text/plain;charset=utf-8');
  }

  function importAccepted() {
    if (!accepted.length || accepted.length > available) return;
    onImport([...project.papers, ...accepted.map(item => item.paper)]);
    setNotice(`${accepted.length} ${accepted.length === 1 ? 'reference added' : 'references added'} to ${project.title}.`);
    clearPreview();
  }

  return <section className="panel" aria-label="Reference exchange">
    <h2>Import and export references</h2>
    <p>Move citation metadata between this project and a reference manager. Files stay on this device. Use a project backup to move research notes, screening decisions and drafts.</p>
    <div className="button-row">
      <button type="button" className="button secondary" aria-expanded={open} onClick={() => setOpen(value => !value)}><FileUp size={16} aria-hidden="true" /> Import reference file</button>
      <button type="button" className="button secondary" disabled={!project.papers.length} onClick={() => exportFile('ris')}><Download size={16} aria-hidden="true" /> Export RIS</button>
      <button type="button" className="button secondary" disabled={!project.papers.length} onClick={() => exportFile('bibtex')}><Download size={16} aria-hidden="true" /> Export BibTeX</button>
    </div>
    {open && <div className="recommendation">
      <p>Choose a UTF-8 RIS or BibTeX file up to 1 MB. Preview your references before adding them to <strong>{project.title}</strong>.</p>
      <label className="field"><span>RIS or BibTeX file</span><input type="file" accept=".ris,.bib,.bibtex" disabled={reading} onChange={readFile} /></label>
      {reading && <p role="status">Opening the reference file…</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {preview && reviewed && <section aria-label="Reference import preview">
        <h3>Preview reference import</h3>
        <p role="status">{accepted.length} ready to add · {reviewed.duplicates} exact matches skipped · {preview.skipped} without titles skipped</p>
        {reviewed.additions.some(item => !item.similar) && <ul>{reviewed.additions.filter(item => !item.similar).slice(0, 5).map(({ paper }) => <li key={paper.id}>{paper.title}</li>)}</ul>}
        {possible.length > 0 && <fieldset className="planner-checks">
          <legend>Review {possible.length} possible {possible.length === 1 ? 'duplicate' : 'duplicates'}</legend>
          <p>Similar titles, first authors and years can indicate different versions. Select any records you want to keep separately.</p>
          {possible.slice(page * reviewPageSize, (page + 1) * reviewPageSize).map(({ paper, similar }) => <label className="checkbox" key={paper.id}>
            <input type="checkbox" checked={separate.includes(paper.id)} onChange={event => setSeparate(values => event.target.checked ? [...values, paper.id] : values.filter(id => id !== paper.id))} />
            <span>Keep {paper.title} ({paper.year}) as a separate reference. Similar to {similar?.title} ({similar?.year}).</span>
          </label>)}
          {possible.length > reviewPageSize && <div className="button-row">
            <button type="button" className="button secondary small" onClick={() => setPage(value => value - 1)} disabled={page === 0}>Previous matches</button>
            <span>Page {page + 1} of {Math.ceil(possible.length / reviewPageSize)}</span>
            <button type="button" className="button secondary small" onClick={() => setPage(value => value + 1)} disabled={(page + 1) * reviewPageSize >= possible.length}>Next matches</button>
          </div>}
        </fieldset>}
        {accepted.length > available && <p className="error" role="alert">This project has room for {available} more references. Choose a smaller file or use another project.</p>}
        <div className="button-row">
          <button type="button" className="button" disabled={!accepted.length || accepted.length > available} onClick={importAccepted}>Add references to project</button>
          <button type="button" className="button secondary" onClick={clearPreview}>Cancel reference import</button>
        </div>
      </section>}
    </div>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
