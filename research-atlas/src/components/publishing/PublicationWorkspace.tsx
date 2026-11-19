import { useState, type FormEvent } from 'react';
import { Plus, Search } from 'lucide-react';
import { External } from '@/components/shared/External';
import { doiWebsiteUrl, sourceLinks } from '@/lib/links';
import { normalizeDoi } from '@/lib/model';
import { checkDoi } from '@/lib/providers';
import { journalOrderLabels, orderJournals } from '@/lib/ranking';
import { OrderSelect, useStoredOrder } from '@/components/shared/publication/RankingControls';
import type { Journal, WorkspaceProps } from '@/components/workspace/execution-workspace-types';
import { JournalEditor } from './JournalEditor';
import { OpenAccessLookup } from './OpenAccessLookup';

type DoiRecord = Awaited<ReturnType<typeof checkDoi>>;

export function PublicationWorkspace({ project, update }: WorkspaceProps) {
  const [title, setTitle] = useState('');
  const [doi, setDoi] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [record, setRecord] = useState<DoiRecord>();
  const [journalOrder, setJournalOrder] = useStoredOrder('atlas-journal-sort-v2', journalOrderLabels, 'quartile');
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
