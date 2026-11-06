import { useRef, useState, type FormEvent } from 'react';
import { Download, Plus, Search } from 'lucide-react';
import { External } from './External';
import { routeDesign } from '../lib/content';
import { doiWebsiteUrl, sourceLinks } from '../lib/links';
import { normalizeDoi, safeUrl, type Paper, type Project } from '../lib/model';
import { checkDoi, resolveOa } from '../lib/providers';
import { download } from '../lib/storage';
import { journalOrderLabels, metricNumber, orderJournals } from '../lib/ranking';
import { JournalMetrics } from './JournalMetrics';
import { OrderSelect, useStoredOrder } from './RankingControls';

type Props = {
  project: Project;
  update: (patch: Partial<Project>) => void;
  mode: 'data' | 'writing' | 'publication';
};

type WorkspaceProps = Omit<Props, 'mode'>;
type Journal = Project['journalCandidates'][number];

const dataTemplate = [
  '### Materials and provenance',
  '### Permissions, consent, and restrictions',
  '### Storage, access, and backups',
  '### File names, versions, and documentation',
  '### Retention, sharing, and disposal',
].join('\n\n');

const analysisTemplate = [
  '### Material or dataset version',
  '### Preparation and exclusions',
  '### Analysis performed and tools used',
  '### Results and links to working files',
  '### Uncertainty, limitations, and deviations from plan',
].join('\n\n');

function NotesField({ label, value, onChange, placeholder, rows = 6 }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return <label className="field">
    <span>{label}</span>
    <textarea rows={rows} maxLength={20000} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
  </label>;
}

function DataWorkspace({ project, update }: WorkspaceProps) {
  function exportRecords() {
    download('data-and-analysis.md', [
      `# ${project.title}`,
      '## Research question', project.question,
      '## Ethics and access considerations', project.ethics,
      '## Data management plan', project.dataPlan,
      '## Planned analysis', project.analysis,
      '## Analysis record', project.analysisRecord,
    ].join('\n\n'), 'text/markdown');
  }

  return <div className="content-grid">
    <div>
      <section className="panel">
        <h2>Plan how to manage your research materials</h2>
        <p>Record what you expect to collect or reuse, where it comes from, and how it can be kept and shared.</p>
        <button className="button secondary small" disabled={Boolean(project.dataPlan.trim())} onClick={() => update({ dataPlan: dataTemplate })}>
          Add planning prompts
        </button>
        <NotesField label="Data management plan" value={project.dataPlan} onChange={dataPlan => update({ dataPlan })} placeholder="Describe the materials, access permissions, storage, backups, and retention." />
      </section>
      <section className="panel">
        <h2>Document what you analyzed</h2>
        <p>Record the materials and methods you actually used, the results you observed, and any differences from your plan.</p>
        {project.analysis.trim() && <details>
          <summary>Read the analysis plan from Methodology</summary>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{project.analysis}</p>
        </details>}
        <button className="button secondary small" disabled={Boolean(project.analysisRecord.trim())} onClick={() => update({ analysisRecord: analysisTemplate })}>
          Add analysis prompts
        </button>
        <NotesField label="Analysis record" value={project.analysisRecord} onChange={analysisRecord => update({ analysisRecord })} placeholder="Record the version, method, results, uncertainty, and links to the analysis files you control." />
        <button className="button" disabled={!project.dataPlan.trim() && !project.analysisRecord.trim()} onClick={exportRecords}>
          <Download size={16} /> Export data and analysis notes
        </button>
      </section>
    </div>
    <aside>
      <section className="panel warm">
        <h3>Work through an example</h3>
        <p>A survey team records the consent restrictions, who can access responses, where the codebook is stored, and which version of the data was analyzed.</p>
        <p>Describe the storage and controls here. Keep participant identifiers, credentials, and raw confidential materials in storage approved for your project.</p>
        {project.ethics.trim() && <details>
          <summary>Read your ethics notes</summary>
          <p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{project.ethics}</p>
        </details>}
      </section>
    </aside>
  </div>;
}

function manuscriptSections(project: Project) {
  if (project.purpose === 'synthesize') {
    return ['Review question and eligibility', 'Search and screening methods', 'Included evidence and appraisal', 'Synthesis and limitations', 'Implications'];
  }
  if (project.purpose === 'interpret' || project.discipline === 'Law & governance') {
    return ['Problem and argument', 'Sources and selection criteria', 'Interpretive framework', 'Analysis and counterarguments', 'Conclusion'];
  }
  if (project.discipline === 'Computing & engineering' && ['predict', 'design'].includes(project.purpose)) {
    return ['Problem and related work', 'System or model', 'Evaluation design and baselines', 'Results and limitations', 'Reproducibility and conclusion'];
  }
  return ['Introduction and research question', 'Methods and ethics', 'Results', 'Discussion and limitations', 'Conclusion'];
}

function citationText(paper: Paper) {
  const firstAuthor = paper.authors.split(',')[0].trim();
  const author = firstAuthor && paper.authors.includes(',') ? `${firstAuthor} et al.` : firstAuthor || paper.title;
  return `(${author}, ${paper.year ?? 'n.d.'})`;
}

function WritingWorkspace({ project, update }: WorkspaceProps) {
  const [paperId, setPaperId] = useState('');
  const [notice, setNotice] = useState('');
  const draft = useRef<HTMLTextAreaElement>(null);
  const sections = manuscriptSections(project);
  const design = routeDesign(project.purpose, project.discipline);
  const selectedPaper = project.papers.find(paper => paper.id === paperId);

  function insertCitation() {
    if (!selectedPaper || !draft.current) return;
    const { selectionStart, selectionEnd } = draft.current;
    const citation = citationText(selectedPaper);
    const manuscript = project.manuscript.slice(0, selectionStart) + citation + project.manuscript.slice(selectionEnd);
    if (manuscript.length > 20000) {
      setNotice('The draft has reached its length limit. Shorten it before inserting another citation.');
      return;
    }
    update({ manuscript });
    setNotice(`Citation inserted for ${selectedPaper.title}.`);
    requestAnimationFrame(() => {
      draft.current?.focus();
      draft.current?.setSelectionRange(selectionStart + citation.length, selectionStart + citation.length);
    });
  }

  return <div className="content-grid">
    <section className="panel">
      <h2>Draft your research report</h2>
      <p>Build the argument around your question and verified notes. Adapt the outline to your assignment or journal.</p>
      <button className="button secondary small" disabled={Boolean(project.manuscript.trim())} onClick={() => update({ manuscript: sections.map(section => `## ${section}`).join('\n\n') })}>
        Start with the suggested outline
      </button>
      <label className="field">
        <span>Manuscript draft</span>
        <textarea ref={draft} value={project.manuscript} onChange={event => update({ manuscript: event.target.value })} maxLength={20000} rows={14} />
      </label>
      {project.papers.length > 0 ? <>
        <label className="field">
          <span>Reference from this project</span>
          <select value={selectedPaper ? paperId : ''} onChange={event => setPaperId(event.target.value)}>
            <option value="">Choose a saved source</option>
            {project.papers.map(paper => <option key={paper.id} value={paper.id}>{paper.title} ({paper.year ?? 'date unknown'})</option>)}
          </select>
        </label>
        <p className="muted">Citations use the saved author and year as a starting point. Confirm the metadata and your required citation style.</p>
        {selectedPaper?.url && <External href={selectedPaper.url}>Open selected reference</External>}
        {selectedPaper?.finding && <p style={{ overflowWrap: 'anywhere' }}>Your evidence note from this source: {selectedPaper.finding}</p>}
        {selectedPaper?.locator && <p style={{ overflowWrap: 'anywhere' }}>Evidence locator: {selectedPaper.locator}</p>}
      </> : <p>Save a source in Literature to make it available here for citation.</p>}
      <div className="button-row">
        {project.papers.length > 0 && <button className="button secondary" disabled={!selectedPaper} onClick={insertCitation}>Insert citation</button>}
        <button className="button" disabled={!project.manuscript.trim()} onClick={() => download('manuscript-draft.md', `# ${project.title}\n\n${project.manuscript}\n`, 'text/markdown')}>
          <Download size={16} /> Export manuscript draft
        </button>
      </div>
      {notice && <p role="status">{notice}</p>}
    </section>
    <aside>
      <section className="panel warm">
        <h3>Suggested sections</h3>
        <ol>{sections.map(section => <li key={section}>{section}</li>)}</ol>
        {project.question.trim() && <p style={{ overflowWrap: 'anywhere' }}><strong>Current question:</strong> {project.question}</p>}
        {design && <>
          <h3>Reporting guidance</h3>
          <p>{design.standard}</p>
          <External href={design.url}>Check guidance and applicability</External>
        </>}
      </section>
    </aside>
  </div>;
}

const journalChecks = [
  { id: 'identity', label: 'Checked the title, publisher, and ISSN against an authoritative source' },
  { id: 'scope', label: 'Read the journal scope and article requirements' },
  { id: 'fees', label: 'Checked fees, currency, and any waiver policy' },
  { id: 'review', label: 'Checked the review policy, editorial board, and archiving' },
];

function JournalEditor({ journal, onChange, onRemove }: {
  journal: Journal;
  onChange: (patch: Partial<Journal>) => void;
  onRemove: () => void;
}) {
  const website = safeUrl(journal.url);
  return <details className="panel matrix-paper">
    <summary style={{ overflowWrap: 'anywhere' }}>
      <span><strong>{journal.title || 'Untitled candidate'}</strong>
        <small>{journal.metrics
          ? `Recent citations per paper ${journal.metrics.citedness == null ? 'unavailable' : metricNumber(journal.metrics.citedness)} · h-index ${journal.metrics.hIndex == null ? 'unavailable' : metricNumber(journal.metrics.hIndex)} · OpenAlex`
          : 'Journal metrics unavailable'}</small>
      </span>
    </summary>
    <div className="lesson-body">
      <label className="field"><span>Journal title</span><input maxLength={200} value={journal.title} onChange={event => onChange({ title: event.target.value })} /></label>
      <label className="field"><span>Official journal website</span><input type="url" maxLength={2000} value={journal.url} onChange={event => onChange({ url: event.target.value })} /></label>
      {website && <External href={website}>Open journal website</External>}
      {journal.url && !website && <p className="muted">Enter a complete website address beginning with https:// or http://.</p>}
      <JournalMetrics value={journal.metrics} onChange={metrics => onChange({ metrics })} />
      <NotesField label="Scope and article fit" value={journal.scope} onChange={scope => onChange({ scope })} rows={3} />
      <NotesField label="Fees and waivers" value={journal.cost} onChange={cost => onChange({ cost })} placeholder="Record the official cost, currency, or whether the fees are still unknown." rows={3} />
      <fieldset>
        <legend>My verification checklist</legend>
        {journalChecks.map(check => <div key={check.id}>
          <label className="checkbox">
            <input type="checkbox" checked={journal.checks.includes(check.id)} onChange={event => onChange({
              checks: event.target.checked ? [...journal.checks, check.id] : journal.checks.filter(id => id !== check.id),
            })} />{' '}{check.label}
          </label>
        </div>)}
      </fieldset>
      <NotesField label="Verification sources and notes" value={journal.verification} onChange={verification => onChange({ verification })} placeholder="Record which official sources you checked, the dates, and what remains uncertain." rows={4} />
      <button className="text-button danger" onClick={onRemove}>Remove journal from shortlist</button>
    </div>
  </details>;
}

type DoiRecord = Awaited<ReturnType<typeof checkDoi>>;

function OpenAccessLookup({ doi }: { doi: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url?: string; message: string }>();

  async function lookup() {
    setBusy(true);
    setResult(undefined);
    try {
      const match = await resolveOa(doi);
      const url = match.is_oa ? safeUrl(match.best_oa_location?.url) : undefined;
      const message = match.is_oa ? `${match.source} reports open access.` : `No open-access location reported by ${match.source}.`;
      setResult({ url, message: match.is_oa && !url ? `${message} A usable link is unavailable.` : message });
    } catch (error) {
      setResult({ message: error instanceof Error ? error.message : 'Open-access lookup is unavailable.' });
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="button secondary" disabled={busy} onClick={lookup}>{busy ? 'Looking up open access…' : 'Resolve open-access copy'}</button>
    {result && <p role="status">{result.message}</p>}
    {result?.url && <External href={result.url}>Open legal OA copy</External>}
  </>;
}

function PublicationWorkspace({ project, update }: WorkspaceProps) {
  const [title, setTitle] = useState('');
  const [doi, setDoi] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<DoiRecord>();
  const [journalOrder, setJournalOrder] = useStoredOrder('atlas-journal-sort', journalOrderLabels, 'citedness');
  const journals = orderJournals(project.journalCandidates, journalOrder);

  function addJournal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || project.journalCandidates.length >= 100) return;
    const candidate: Journal = { id: crypto.randomUUID(), title: title.trim(), url: '', scope: '', cost: '', checks: [], verification: '' };
    update({ journalCandidates: [...project.journalCandidates, candidate] });
    setTitle('');
  }

  async function verifyDoi(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setRecord(undefined);
    setBusy(true);
    try {
      const metadata = await checkDoi(doi);
      normalizeDoi(metadata.DOI);
      setRecord(metadata);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'DOI lookup failed.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="content-grid">
    <div>
      <section className="panel">
        <h2>Build a journal shortlist</h2>
        <p>Compare venues against your study scope, article type, budget, and evidence from official sources.</p>
        <form onSubmit={addJournal}>
          <label className="field"><span>New journal candidate</span><input required maxLength={200} value={title} onChange={event => setTitle(event.target.value)} /></label>
          <button className="button" disabled={!title.trim() || project.journalCandidates.length >= 100}><Plus size={16} /> Add journal</button>
        </form>
        {project.journalCandidates.length >= 100 && <p>Your shortlist has reached its 100-journal limit.</p>}
        {journals.length > 0 && <>
          <OrderSelect label="Sort journal shortlist" labels={journalOrderLabels} order={journalOrder} onChange={setJournalOrder} />
          <p className="muted">Values come from OpenAlex. Compare journals in the same field and check fit, fees, and editorial practices separately. Journals without the selected metric appear last.</p>
        </>}
      </section>
      {journals.map(journal => <JournalEditor key={journal.id} journal={journal}
        onChange={patch => update({ journalCandidates: project.journalCandidates.map(candidate => candidate.id === journal.id ? { ...candidate, ...patch } : candidate) })}
        onRemove={() => {
          if (window.confirm(`Remove ${journal.title || 'this journal'} and its verification notes?`)) {
            update({ journalCandidates: project.journalCandidates.filter(candidate => candidate.id !== journal.id) });
          }
        }}
      />)}
      <section className="panel">
        <h2>Check a publication’s identity</h2>
        <p>Look up an article DOI in Crossref to inspect its published metadata.</p>
        <form onSubmit={verifyDoi}>
          <label className="field"><span>Article DOI</span><input value={doi} required disabled={busy} maxLength={350} onChange={event => {
            setDoi(event.target.value);
            setError('');
            setRecord(undefined);
          }} placeholder="10.1038/nature12373" /></label>
          <button className="button" disabled={busy}>{busy ? 'Checking…' : 'Check DOI metadata'} <Search size={16} /></button>
        </form>
        {error && <p className="error" role="alert">{error}</p>}
        {record && <div className="verification">
          <span className="tag">VERIFIED METADATA · CROSSREF</span>
          <h3>{record.title[0] || 'Title not supplied'}</h3>
          <dl>
            <dt>Journal / container</dt><dd>{record['container-title'].join(', ') || 'Not supplied'}</dd>
            <dt>Publisher</dt><dd>{record.publisher}</dd>
            <dt>ISSN</dt><dd>{record.ISSN.join(', ') || 'Not supplied'}</dd>
            <dt>DOI</dt><dd>{record.DOI}</dd>
          </dl>
          <External href={doiWebsiteUrl(record.DOI)}>Open publisher record</External>
          <h4>Unknown / requires manual verification</h4>
          <p>Check the journal’s policies, fees, editorial board, archiving, and any indexing claim independently.</p>
          {Boolean(record['update-to']?.length) && <p>Crossref includes post-publication update metadata. Inspect the source record before relying on this article.</p>}
          <OpenAccessLookup key={record.DOI} doi={record.DOI} />
        </div>}
      </section>
    </div>
    <aside>
      <section className="panel warm">
        <h3>Document your checks</h3>
        <p>Verify claims against the current publisher policies and relevant directories. Save the source and date for every claim you rely on.</p>
        <External href="https://thinkchecksubmit.org/journals/">Think. Check. Submit.</External>
      </section>
      <section className="panel">
        <h3>Manual verification</h3>
        <div className="standard"><External href="https://doaj.org/search/journals">DOAJ journal directory</External></div>
        <div className="standard"><External href="https://mjl.clarivate.com/">Web of Science Master Journal List</External></div>
        <div className="standard"><External href={sourceLinks.scopus}>Scopus sources</External></div>
        <div className="standard"><External href="https://www.scimagojr.com/journalrank.php">SCImago quartiles by subject and year</External></div>
        <div className="standard"><External href="https://help.openalex.org/data/sources/attributes/#summary_stats">OpenAlex journal metrics</External></div>
        <div className="standard"><External href="https://pubpeer.com/">PubPeer discussion by DOI</External></div>
      </section>
    </aside>
  </div>;
}

export function ExecutionWorkspace({ project, update, mode }: Props) {
  switch (mode) {
    case 'data': return <DataWorkspace project={project} update={update} />;
    case 'writing': return <WritingWorkspace key={project.id} project={project} update={update} />;
    case 'publication': return <PublicationWorkspace key={project.id} project={project} update={update} />;
  }
}
