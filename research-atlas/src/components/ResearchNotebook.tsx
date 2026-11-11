'use client';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import { BookOpen, Download, Plus } from 'lucide-react';
import type { Paper, Project } from '@/lib/model';
import {
  notebookEntries, notebookEntryDetails, notebookNoteLimit, notebookNoteSchema, notebookSource,
  notebookSourceLimit, notebookText, type NotebookEntry, type NotebookNote, type NotebookSource,
} from '@/lib/research-notebook';
import { download } from '@/lib/storage';
import './research-notebook.css';

type Props = {
  project: Project & { notebookNotes?: NotebookNote[] };
  onSaveNotes: (notes: NotebookNote[]) => void;
  initialPaperId?: string;
  onOpenEvidence: (paperId: string) => void;
  onEditingChange?: (editing: boolean) => void;
};

type Draft = {
  id?: string;
  kind: NotebookNote['kind'];
  text: string;
  sources: NotebookSource[];
  nextStep: string;
  status: 'open' | 'done';
};

function newDraft(source?: Paper): Draft {
  return {
    kind: 'interpretation',
    text: '',
    sources: source ? [notebookSource(source)] : [],
    nextStep: '',
    status: 'open',
  };
}

const pageSize = 20;

export function ResearchNotebook({ project, onSaveNotes, initialPaperId, onOpenEvidence, onEditingChange }: Props) {
  const papers = useMemo(() => {
    const counts = new Map<string, number>();
    project.papers.forEach(paper => counts.set(paper.id, (counts.get(paper.id) ?? 0) + 1));
    return project.papers.filter(paper => counts.get(paper.id) === 1);
  }, [project.papers]);
  const initialPaper = papers.find(paper => paper.id === initialPaperId);
  const [draft, setDraft] = useState(() => newDraft(initialPaper));
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<NotebookEntry['kind'] | ''>('');
  const [paperFilter, setPaperFilter] = useState(initialPaper?.id ?? '');
  const [findingPaper, setFindingPaper] = useState(initialPaper?.id ?? '');
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const editor = useRef<HTMLTextAreaElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const notes = project.notebookNotes ?? [];
  const entries = useMemo(() => notebookEntries(project), [project]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matching = useMemo(() => entries.filter(entry =>
    (!kind || entry.kind === kind) &&
    (!paperFilter || entry.sources.some(source => source.paperId === paperFilter)) &&
    (!normalizedQuery || [
      entry.label, entry.text, ...notebookEntryDetails(entry),
      ...entry.sources.flatMap(source => [source.title, source.doi]),
    ].join(' ').toLocaleLowerCase().includes(normalizedQuery)),
  ), [entries, kind, normalizedQuery, paperFilter]);
  const pages = Math.max(1, Math.ceil(matching.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const atLimit = notes.length >= notebookNoteLimit && !draft.id;
  const hasUnsavedText = Boolean(draft.text.trim() || draft.nextStep.trim());
  const editing = Boolean(draft.id || hasUnsavedText);

  function changeDraft(patch: Partial<Draft>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    setError('');
    onEditingChange?.(Boolean(next.id || next.text.trim() || next.nextStep.trim()));
  }

  function attachSource(paperId: string) {
    const paper = papers.find(item => item.id === paperId);
    if (paper && draft.sources.length < notebookSourceLimit && !draft.sources.some(source => source.paperId === paperId)) {
      changeDraft({ sources: [...draft.sources, notebookSource(paper)] });
    }
  }

  function resetDraft() {
    setDraft(newDraft(initialPaper));
    setError('');
    onEditingChange?.(false);
  }

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    if (atLimit) return;
    const previous = notes.find(note => note.id === draft.id);
    if (draft.id && !previous) {
      setError('This note has changed. Copy your text, then reopen the saved note before editing again.');
      return;
    }
    const now = new Date().toISOString();
    const result = notebookNoteSchema.safeParse({
      id: previous?.id ?? crypto.randomUUID(),
      kind: draft.kind,
      text: draft.text,
      sources: draft.sources,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      ...(draft.kind === 'question' ? { status: draft.status, nextStep: draft.nextStep } : {}),
    });
    if (!result.success) {
      setError('Enter a note and check the length of the text and next step.');
      return;
    }
    onSaveNotes(previous ? notes.map(note => note.id === previous.id ? result.data : note) : [result.data, ...notes]);
    resetDraft();
    setPage(0);
    setMessage(previous ? 'Notebook entry updated.' : 'Notebook entry added.');
  }

  function editNote(id: string) {
    const note = notes.find(item => item.id === id);
    if (!note || editing) return;
    setMessage('');
    changeDraft({
      id: note.id, kind: note.kind, text: note.text, sources: note.sources,
      nextStep: note.kind === 'question' ? note.nextStep : '',
      status: note.kind === 'question' ? note.status : 'open',
    });
    requestAnimationFrame(() => editor.current?.focus());
  }

  return <section className="research-notebook" aria-labelledby="research-notebook-title">
    <div className="panel notebook-intro">
      <div>
        <h1 id="research-notebook-title">Researcher’s Notebook</h1>
        <p>Keep source findings, your interpretations and your next actions in one place for <strong>{project.title}</strong>.</p>
      </div>
      <button type="button" className="button secondary" disabled={!entries.length}
        onClick={() => download('research-notebook.txt', notebookText(project, entries), 'text/plain;charset=utf-8')}>
        <Download size={16} aria-hidden="true" /> Export notebook
      </button>
    </div>

    <section className="panel" aria-labelledby="notebook-editor-title">
      <h2 id="notebook-editor-title">{draft.id ? 'Edit my note' : 'Add my note'}</h2>
      {initialPaper && <p>Opened from <strong>{initialPaper.title}</strong>.</p>}
      <form onSubmit={saveNote} className="notebook-form">
        <label className="field">
          <span>Note type</span>
          <select value={draft.kind} disabled={atLimit} onChange={event => changeDraft({ kind: event.target.value as Draft['kind'] })}>
            <option value="interpretation">My interpretation</option>
            <option value="question">Question / next action</option>
          </select>
        </label>
        <label className="field">
          <span>My note</span>
          <textarea ref={editor} rows={4} maxLength={6000} value={draft.text} disabled={atLimit} required
            onChange={event => changeDraft({ text: event.target.value })} />
        </label>
        {draft.kind === 'question' && <div className="notebook-fields">
          <label className="field">
            <span>Next step (optional)</span>
            <input value={draft.nextStep} maxLength={2000} onChange={event => changeDraft({ nextStep: event.target.value })} />
          </label>
          <label className="field">
            <span>Action status</span>
            <select value={draft.status} onChange={event => changeDraft({ status: event.target.value as Draft['status'] })}>
              <option value="open">Open</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>}
        {papers.length > 0 && <label className="field">
          <span>Link a saved source (optional)</span>
          <select value="" disabled={atLimit || draft.sources.length >= notebookSourceLimit}
            onChange={event => attachSource(event.target.value)}>
            <option value="">Choose a source</option>
            {papers.filter(paper => !draft.sources.some(source => source.paperId === paper.id)).map(paper =>
              <option key={paper.id} value={paper.id}>{paper.title.slice(0, 180) || 'Untitled source'}{paper.year ? ` (${paper.year})` : ''}</option>,
            )}
          </select>
        </label>}
        {draft.sources.length > 0 && <ul className="notebook-linked" aria-label="Sources linked to this note">
          {draft.sources.map((source, index) => <li key={`${source.paperId}:${index}`}>
            <span>{source.title || 'Untitled source'}</span>
            <button className="text-button" type="button" aria-label={`Remove source link to ${source.title || 'Untitled source'}`}
              onClick={() => changeDraft({ sources: draft.sources.filter((_, item) => item !== index) })}>Remove link</button>
          </li>)}
        </ul>}
        <div className="button-row">
          <button type="submit" className="button" disabled={atLimit || !draft.text.trim()}>
            <Plus size={16} aria-hidden="true" /> {draft.id ? 'Save changes' : 'Save my note'}
          </button>
          {editing && <button type="button" className="button secondary" onClick={resetDraft}>Cancel note edits</button>}
        </div>
        {atLimit && <p>You have reached the limit of {notebookNoteLimit} entries. You can still edit an existing entry.</p>}
        {error && <p className="notice" role="alert">{error}</p>}
        {message && <p role="status">{message}</p>}
      </form>
      <details className="notebook-source-entry">
        <summary>Record a source finding</summary>
        <p>Use Evidence Desk to record what a paper reports, where you read it, and whether you used the abstract or full text. Those findings also appear here.</p>
        {papers.length ? <div className="notebook-finding-controls">
          <label className="field">
            <span>Source for finding</span>
            <select value={findingPaper} onChange={event => setFindingPaper(event.target.value)}>
              <option value="">Choose a source</option>
              {papers.map(paper => <option key={paper.id} value={paper.id}>{paper.title.slice(0, 180) || 'Untitled source'}</option>)}
            </select>
          </label>
          <button type="button" className="button secondary" disabled={!papers.some(paper => paper.id === findingPaper) || editing}
            onClick={() => onOpenEvidence(findingPaper)}><BookOpen size={16} aria-hidden="true" /> Open Evidence Desk</button>
        </div> : <p>Save a paper to this project to record a finding.</p>}
        {editing && <small>Save or cancel your note edits to open Evidence Desk.</small>}
      </details>
    </section>

    <section className="panel" aria-labelledby="notebook-entries-title">
      <h2 ref={resultsHeading} id="notebook-entries-title" tabIndex={-1}>Notebook entries</h2>
      <div className="notebook-filters">
        <label className="field">
          <span>Find notebook entries</span>
          <input type="search" value={query} maxLength={300}
            onChange={event => { setQuery(event.target.value); setPage(0); }} />
        </label>
        <label className="field">
          <span>Entry type</span>
          <select value={kind} onChange={event => { setKind(event.target.value as typeof kind); setPage(0); }}>
            <option value="">All types</option>
            <option value="finding">Source findings</option>
            <option value="interpretation">My interpretations</option>
            <option value="question">Questions / next actions</option>
            <option value="earlier">Earlier notes and extractions</option>
          </select>
        </label>
        {papers.length > 0 && <label className="field">
          <span>Filter by source</span>
          <select value={paperFilter} onChange={event => { setPaperFilter(event.target.value); setPage(0); }}>
            <option value="">All sources and project notes</option>
            {papers.map(paper => <option key={paper.id} value={paper.id}>{paper.title.slice(0, 180) || 'Untitled source'}</option>)}
          </select>
        </label>}
      </div>
      <p role="status">{matching.length} {matching.length === 1 ? 'entry' : 'entries'}</p>
      {!matching.length && <p>{entries.length ? 'No entries match these filters.' : 'Add an interpretation or a question to begin your notebook.'}</p>}
      <ul className="notebook-entries">
        {matching.slice(currentPage * pageSize, (currentPage + 1) * pageSize).map(entry => <li key={entry.key}>
          <div className="notebook-entry-heading">
            <h3>{entry.label}</h3>
            {entry.createdAt && <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString()}</time>}
          </div>
          <p className="notebook-entry-text">{entry.text}</p>
          {entry.sources.map((source, index) => <p key={`${source.paperId}:${index}`} className="notebook-source-detail">
            <strong>Source</strong> {source.title || 'Untitled source'}{source.doi && <> · DOI {source.doi}</>}
            {papers.some(paper => paper.id === source.paperId) && <>
              {' · '}
              <button type="button" className="text-button" disabled={editing}
                aria-label={`Open ${source.title || 'untitled source'} in Evidence Desk`}
                onClick={() => onOpenEvidence(source.paperId)}>Open in Evidence Desk</button>
            </>}
          </p>)}
          {notebookEntryDetails(entry).map(detail => <p key={detail} className="notebook-source-detail">{detail}</p>)}
          {entry.noteId && <button type="button" className="text-button" disabled={editing}
            onClick={() => editNote(entry.noteId!)}>Edit note</button>}
        </li>)}
      </ul>
      {pages > 1 && <nav className="button-row" aria-label="Notebook pages">
        <button type="button" className="button secondary" disabled={currentPage === 0}
          onClick={() => { setPage(currentPage - 1); resultsHeading.current?.focus(); }}>Previous entries</button>
        <span>{currentPage + 1} / {pages}</span>
        <button type="button" className="button secondary" disabled={currentPage + 1 === pages}
          onClick={() => { setPage(currentPage + 1); resultsHeading.current?.focus(); }}>Next entries</button>
      </nav>}
    </section>
  </section>;
}
