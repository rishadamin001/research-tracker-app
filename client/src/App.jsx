import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle, ArrowRight, BookMarked, BookOpen, CalendarDays, Check,
  CheckCheck, ChevronDown, ChevronRight, Download, FileText, GraduationCap,
  LayoutDashboard, LibraryBig, Lightbulb, LoaderCircle, Menu, Pencil, Plus,
  RotateCcw, Search, Sparkles, Trash2, X,
} from 'lucide-react';

const STATUSES = [
  { value: 'reading', label: 'Reading', caption: 'Curiosity in progress', icon: BookOpen },
  { value: 'read', label: 'Read', caption: 'Ideas explored & understood', icon: CheckCheck },
  { value: 'published', label: 'Published', caption: 'Research out in the world', icon: GraduationCap },
];
const EMPTY_METRICS = { total: 0, reading: 0, read: 0, published: 0 };

async function apiRequest(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status}). Please try again.`;
    try {
      const body = await response.json();
      if (typeof body.error === 'string') message = body.error;
      else if (typeof body.message === 'string') message = body.message;
    } catch {
      // A non-JSON error still gets a useful, readable fallback.
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}

function Dialog({ title, description, children, onClose, busy = false, initialFocusRef, className = '' }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (initialFocusRef?.current || dialogRef.current)?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busyRef.current) closeRef.current();
      if (event.key !== 'Tab') return;
      const focusable = [...dialogRef.current.querySelectorAll(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex="0"]',
      )];
      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [initialFocusRef]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose();
    }}>
      <section
        className={`paper-dialog ${className}`} role="dialog" aria-modal="true"
        aria-labelledby="dialog-title" aria-describedby={description ? 'dialog-description' : undefined}
        tabIndex={-1} ref={dialogRef}
      >
        <div className="dialog-header">
          <div>
            <div className="dialog-eyebrow"><BookOpen size={15} aria-hidden="true" /> YOUR RESEARCH LIBRARY</div>
            <h2 id="dialog-title">{title}</h2>
            {description && <p id="dialog-description">{description}</p>}
          </div>
          <button className="action-button dialog-close" type="button" onClick={onClose} disabled={busy} aria-label="Close dialog"><X size={20} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function PaperForm({ paper, onSave, onClose, busy, error }) {
  const titleRef = useRef(null);
  const [fields, setFields] = useState({
    title: paper?.title || '',
    authors: paper?.authors || '',
    journal: paper?.journal || '',
    publicationYear: String(paper?.publicationYear || new Date().getFullYear()),
    status: paper?.status || 'reading',
  });
  const [validationError, setValidationError] = useState('');

  const changeField = (event) => {
    setFields((current) => ({ ...current, [event.target.name]: event.target.value }));
    setValidationError('');
  };

  function submit(event) {
    event.preventDefault();
    const data = {
      ...fields,
      title: fields.title.trim(),
      authors: fields.authors.trim(),
      journal: fields.journal.trim(),
      publicationYear: Number(fields.publicationYear),
    };
    if (!data.title || !data.authors || !data.journal) {
      setValidationError('Please enter a title, authors, and journal.');
      return;
    }
    if (!Number.isInteger(data.publicationYear) || data.publicationYear < 1 || data.publicationYear > 9999) {
      setValidationError('Publication year must be a whole number between 1 and 9999.');
      return;
    }
    onSave(data);
  }

  return (
    <Dialog
      title={paper ? 'Edit paper' : 'Add a paper'}
      description={paper ? 'Keep the details of your research up to date.' : 'Save a discovery. Make it part of your research journey.'}
      onClose={onClose} busy={busy} initialFocusRef={titleRef}
    >
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="form-field form-field-full" htmlFor="paper-title">
            <span>Paper title <span className="required-mark">*</span></span>
            <input id="paper-title" name="title" ref={titleRef} value={fields.title} onChange={changeField} placeholder="e.g. Attention Is All You Need" required disabled={busy} maxLength={400} />
          </label>
          <label className="form-field form-field-full" htmlFor="paper-authors">
            <span>Authors <span className="required-mark">*</span></span>
            <input id="paper-authors" name="authors" value={fields.authors} onChange={changeField} placeholder="e.g. Ashish Vaswani, Noam Shazeer" required disabled={busy} maxLength={1000} />
            <small>Separate multiple authors with commas.</small>
          </label>
          <label className="form-field form-field-full" htmlFor="paper-journal">
            <span>Journal or publication <span className="required-mark">*</span></span>
            <input id="paper-journal" name="journal" value={fields.journal} onChange={changeField} placeholder="e.g. Nature, NeurIPS, arXiv" required disabled={busy} maxLength={300} />
          </label>
          <label className="form-field" htmlFor="paper-year">
            <span>Publication year <span className="required-mark">*</span></span>
            <input id="paper-year" name="publicationYear" type="number" min="1" max="9999" step="1" value={fields.publicationYear} onChange={changeField} required disabled={busy} />
          </label>
          <label className="form-field" htmlFor="paper-status">
            <span>Status <span className="required-mark">*</span></span>
            <select id="paper-status" name="status" value={fields.status} onChange={changeField} disabled={busy}>
              {STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
            </select>
          </label>
        </div>
        {(validationError || error) && <p className="form-error" role="alert"><AlertCircle size={16} aria-hidden="true" />{validationError || error}</p>}
        <div className="form-actions">
          <span className="form-required-note">* Required fields</span>
          <button className="btn btn-secondary" type="button" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={17} className="spin" aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
            {busy ? 'Saving…' : paper ? 'Save changes' : 'Add paper'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

function App() {
  const [papers, setPapers] = useState([]);
  const [metrics, setMetrics] = useState(EMPTY_METRICS);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [activeNav, setActiveNav] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingIds, setPendingIds] = useState([]);
  const [toast, setToast] = useState(null);
  const requestSequence = useRef(0);
  const searchRef = useRef(null);
  const libraryRef = useRef(null);
  const deleteCancelRef = useRef(null);

  const loadData = useCallback(async ({ signal, initial = false } = {}) => {
    const sequence = ++requestSequence.current;
    if (initial) setLoading(true);
    setLoadError('');
    try {
      const [paperData, metricData] = await Promise.all([
        apiRequest('/papers', { signal }), apiRequest('/metrics', { signal }),
      ]);
      if (sequence !== requestSequence.current || signal?.aborted) return false;
      setPapers(paperData.papers);
      setMetrics(metricData);
      setHasLoaded(true);
      return true;
    } catch (error) {
      if (error.name !== 'AbortError' && sequence === requestSequence.current) {
        setLoadError(`We couldn’t load your library. ${error.message}`);
      }
      return false;
    } finally {
      if (sequence === requestSequence.current && !signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData({ signal: controller.signal, initial: true });
    return () => controller.abort();
  }, [loadData]);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!sidebarOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key === 'Escape') setSidebarOpen(false);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  const notify = (message, kind = 'success') => setToast({ message, kind, id: Date.now() });

  function openEditor(paper = null) {
    setEditorError('');
    setEditor({ paper });
  }

  function visitLibrary(nextFilter = 'all', focusSearch = false) {
    setActiveNav('library');
    setFilter(nextFilter);
    setSidebarOpen(false);
    libraryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (focusSearch) searchRef.current?.focus({ preventScroll: true });
  }

  function visitDashboard() {
    setActiveNav('dashboard');
    setFilter('all');
    setSearch('');
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function savePaper(fields) {
    setSubmitting(true);
    setEditorError('');
    const previous = editor.paper;
    try {
      const { paper } = await apiRequest(previous ? `/papers/${previous.id}` : '/papers', {
        method: previous ? 'PATCH' : 'POST', body: JSON.stringify(fields),
      });
      setPapers((current) => previous ? current.map((item) => item.id === paper.id ? paper : item) : [paper, ...current]);
      setMetrics((current) => ({
        ...current,
        total: current.total + (previous ? 0 : 1),
        ...(previous ? { [previous.status]: current[previous.status] - 1 } : {}),
        [paper.status]: current[paper.status] + (previous?.status === paper.status ? 0 : 1),
      }));
      await loadData();
      setEditor(null);
      notify(previous ? 'Paper updated. Your library is up to date.' : 'Paper added to your research library.');
    } catch (error) {
      setEditorError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function changeStatus(paper, status) {
    if (paper.status === status || pendingIds.includes(paper.id)) return;
    setPendingIds((current) => [...current, paper.id]);
    try {
      const { paper: updatedPaper } = await apiRequest(`/papers/${paper.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setPapers((current) => current.map((item) => item.id === paper.id ? updatedPaper : item));
      setMetrics((current) => ({ ...current, [paper.status]: current[paper.status] - 1, [status]: current[status] + 1 }));
      await loadData();
      notify(`Paper marked as ${STATUSES.find((item) => item.value === status).label.toLowerCase()}.`);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setPendingIds((current) => current.filter((id) => id !== paper.id));
    }
  }

  async function deletePaper() {
    setSubmitting(true);
    setDeleteError('');
    const paper = deleteTarget;
    try {
      await apiRequest(`/papers/${paper.id}`, { method: 'DELETE' });
      setPapers((current) => current.filter((item) => item.id !== paper.id));
      setMetrics((current) => ({ ...current, total: current.total - 1, [paper.status]: current[paper.status] - 1 }));
      await loadData();
      setDeleteTarget(null);
      notify('Paper removed from your library.');
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const filteredPapers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    const result = papers.filter((paper) =>
      (filter === 'all' || paper.status === filter)
      && (!term || [paper.title, paper.authors, paper.journal, String(paper.publicationYear)].some((value) => value.toLocaleLowerCase().includes(term))),
    );
    return result.sort((first, second) => {
      if (sort === 'title') return first.title.localeCompare(second.title);
      if (sort === 'year') return second.publicationYear - first.publicationYear || second.id - first.id;
      return second.id - first.id;
    });
  }, [papers, filter, search, sort]);

  function exportLibrary() {
    const escapeCell = (value) => {
      let cell = String(value ?? '');
      if (/^[=+\-@\t\r]/.test(cell)) cell = `'${cell}`;
      return `"${cell.replaceAll('"', '""')}"`;
    };
    const rows = [
      ['Title', 'Authors', 'Journal', 'Publication Year', 'Status'],
      ...papers.map((paper) => [paper.title, paper.authors, paper.journal, paper.publicationYear, paper.status]),
    ];
    const csv = '\uFEFF' + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `research-library-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
    notify(`Exported ${papers.length} ${papers.length === 1 ? 'paper' : 'papers'} to CSV.`);
  }

  const completed = metrics.read + metrics.published;
  const progress = metrics.total ? Math.round(completed / metrics.total * 100) : 0;
  const today = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date());
  const metricCards = [
    { value: 'total', label: 'Total papers', caption: 'All your discoveries, together', icon: LibraryBig },
    { ...STATUSES[0], label: 'Currently reading' },
    { ...STATUSES[1], label: 'Completed reads' },
    { ...STATUSES[2], label: 'Published papers' },
  ];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#paper-library">Skip to paper library</a>
      {sidebarOpen && <button className="sidebar-scrim" type="button" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Workspace navigation">
        <button className="sidebar-brand" onClick={visitDashboard} type="button" aria-label="Research Space dashboard">
          <span className="brand-mark"><BookOpen size={26} strokeWidth={1.8} aria-hidden="true" /><span className="brand-spark">✦</span></span>
          <span>Research<span className="brand-second-line">Space<span className="brand-period">.</span></span></span>
        </button>
        <div className="sidebar-workspace-label">PERSONAL WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          <button className={`nav-link ${activeNav === 'dashboard' ? 'active' : ''}`} type="button" onClick={visitDashboard} aria-current={activeNav === 'dashboard' ? 'page' : undefined}>
            <LayoutDashboard size={19} aria-hidden="true" /><span>Dashboard</span><span className="nav-active-dot" />
          </button>
          <button className={`nav-link ${activeNav === 'library' ? 'active' : ''}`} type="button" onClick={() => visitLibrary('all', true)} aria-current={activeNav === 'library' ? 'page' : undefined}>
            <LibraryBig size={19} aria-hidden="true" /><span>My library</span><span className="sidebar-count">{hasLoaded ? metrics.total : '—'}</span>
          </button>
        </nav>
        <div className="sidebar-section-label">YOUR COLLECTION</div>
        <div className="status-nav" role="group" aria-label="Filter library by status">
          {STATUSES.map((status) => (
            <button className={`status-nav-link ${filter === status.value ? 'selected' : ''}`} key={status.value} type="button" onClick={() => visitLibrary(status.value)} aria-pressed={filter === status.value}>
              <span className={`status-dot status-dot-${status.value}`} /><span>{status.label}</span><span>{hasLoaded ? metrics[status.value] : '—'}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-note"><Sparkles size={19} aria-hidden="true" /><p>Great research starts<br />with a little curiosity.</p><span className="sidebar-note-line" /></div>
        <div className="sidebar-footer"><span className="profile-avatar"><GraduationCap size={20} aria-hidden="true" /></span><div><strong>My workspace</strong><span>Student researcher</span></div><span className="profile-online" title="Personal workspace" /></div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div className="header-left">
            <button className="mobile-menu-button action-button" type="button" aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={sidebarOpen} onClick={() => setSidebarOpen((open) => !open)}><Menu size={22} /></button>
            <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} aria-hidden="true" /><strong>Dashboard</strong></div>
          </div>
          <div className="header-date"><CalendarDays size={15} aria-hidden="true" /><time dateTime={new Date().toISOString().slice(0, 10)}>{today}</time></div>
        </header>

        <div className="workspace-content">
          <section className="page-heading" aria-labelledby="page-title">
            <div><p className="page-eyebrow">YOUR PERSONAL RESEARCH WORKSPACE</p><h1 id="page-title">Your research, <span>in focus.</span></h1><p className="page-subtitle">A little structure for your big ideas. Track, read, and keep moving forward.</p></div>
            <div className="heading-actions">
              <button className="btn btn-secondary" type="button" onClick={exportLibrary} disabled={!papers.length || !hasLoaded}><Download size={17} aria-hidden="true" />Export library</button>
              <button className="btn btn-primary" type="button" onClick={() => openEditor()}><Plus size={18} aria-hidden="true" />Add paper</button>
            </div>
          </section>

          {loadError && <div className="error-banner" role="alert"><AlertCircle size={18} aria-hidden="true" /><span>{loadError}</span><button className="btn btn-ghost" type="button" onClick={() => loadData({ initial: !hasLoaded })} disabled={loading}><RotateCcw size={15} aria-hidden="true" />Retry</button></div>}

          <section className="metric-grid" aria-label="Research metrics" aria-busy={loading}>
            {metricCards.map((card) => {
              const Icon = card.icon;
              return <article className={`metric-card metric-${card.value}`} key={card.value}>
                <div className="metric-top"><span>{card.label}</span><span className="metric-icon"><Icon size={20} strokeWidth={1.8} aria-hidden="true" /></span></div>
                <div className="metric-number">{hasLoaded ? metrics[card.value] : '—'}<span className="metric-number-label">{metrics[card.value] === 1 ? 'paper' : 'papers'}</span></div>
                <p className="metric-caption"><span className={`status-dot status-dot-${card.value}`} />{card.caption}</p>
              </article>;
            })}
          </section>

          <div className="dashboard-grid">
            <section className="library-panel" id="paper-library" aria-labelledby="library-heading" ref={libraryRef}>
              <div className="library-header"><div className="library-heading-group"><h2 id="library-heading">Paper library</h2><span className="library-count">{hasLoaded ? papers.length : '—'}</span></div><span className="library-header-caption">Every paper, a new perspective.</span></div>
              <div className="status-tabs" role="group" aria-label="Filter papers">
                {[{ value: 'all', label: 'All papers' }, ...STATUSES].map((status) => <button key={status.value} className={`status-tab ${filter === status.value ? 'active' : ''}`} type="button" aria-pressed={filter === status.value} onClick={() => setFilter(status.value)}>{status.label}<span>{hasLoaded ? metrics[status.value === 'all' ? 'total' : status.value] : '—'}</span></button>)}
              </div>
              <div className="library-toolbar">
                <div className="search-field"><Search size={17} aria-hidden="true" /><input ref={searchRef} type="search" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search papers" placeholder="Search by title, author, or journal…" />{search && <button className="search-clear" type="button" aria-label="Clear search" onClick={() => { setSearch(''); searchRef.current?.focus(); }}><X size={15} /></button>}</div>
                <label className="sort-field"><span>Sort:</span><select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Sort papers"><option value="newest">Newest added</option><option value="year">Publication year</option><option value="title">Title A–Z</option></select><ChevronDown size={14} aria-hidden="true" /></label>
              </div>

              {loading && !hasLoaded ? <div className="loading-state" role="status"><LoaderCircle className="spin" size={27} aria-hidden="true" /><p>Gathering your research…</p></div> : (
                <>
                  {filteredPapers.length > 0 ? <div className="paper-table-wrapper"><table className="paper-table">
                    <thead><tr><th scope="col">PAPER DETAILS</th><th scope="col">JOURNAL</th><th scope="col">YEAR</th><th scope="col">STATUS</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                    <tbody>{filteredPapers.map((paper) => <tr key={paper.id}>
                      <td><div className="paper-title-cell"><span className={`document-icon document-icon-${paper.status}`}><FileText size={22} strokeWidth={1.6} aria-hidden="true" /></span><div><span className="paper-title">{paper.title}</span><span className="paper-authors">{paper.authors}</span></div></div></td>
                      <td><span className="paper-journal">{paper.journal}</span></td><td className="paper-year">{paper.publicationYear}</td>
                      <td><div className={`status-select-wrap status-${paper.status}`}><span className={`status-dot status-dot-${paper.status}`} /><select className="status-select" value={paper.status} aria-label={`Status for ${paper.title}`} disabled={pendingIds.includes(paper.id)} onChange={(event) => changeStatus(paper, event.target.value)}>{STATUSES.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}</select><ChevronDown size={12} aria-hidden="true" /></div></td>
                      <td><div className="paper-actions"><button className="action-button" type="button" onClick={() => openEditor(paper)} disabled={pendingIds.includes(paper.id)} aria-label={`Edit ${paper.title}`} title="Edit paper"><Pencil size={16} /></button><button className="action-button action-delete" type="button" onClick={() => { setDeleteError(''); setDeleteTarget(paper); }} disabled={pendingIds.includes(paper.id)} aria-label={`Delete ${paper.title}`} title="Delete paper"><Trash2 size={16} /></button></div></td>
                    </tr>)}</tbody>
                  </table></div> : <div className="empty-state">
                    <div className="empty-illustration"><span className="empty-orbit empty-orbit-one" /><span className="empty-orbit empty-orbit-two" /><BookMarked size={43} strokeWidth={1.4} aria-hidden="true" /><Sparkles className="empty-spark" size={20} aria-hidden="true" /></div>
                    <p className="empty-eyebrow">{papers.length ? 'A LITTLE MORE DISCOVERY' : 'A FRESH START'}</p>
                    <h3>{!hasLoaded && loadError ? 'Your library is taking a moment' : papers.length ? 'No papers found' : 'Your next discovery starts here'}</h3>
                    <p>{!hasLoaded && loadError ? 'Try loading your library again to see your saved papers.' : papers.length ? 'Try another search or filter to find what you’re looking for.' : 'Add your first paper and give your research a place to grow.'}</p>
                    {papers.length ? <button className="btn btn-secondary" type="button" onClick={() => { setFilter('all'); setSearch(''); }}>Clear filters</button> : !hasLoaded && loadError ? <button className="btn btn-secondary" type="button" onClick={() => loadData({ initial: true })}><RotateCcw size={16} aria-hidden="true" />Try again</button> : <button className="btn btn-primary" type="button" onClick={() => openEditor()}><Plus size={17} aria-hidden="true" />Add your first paper</button>}
                  </div>}
                  <div className="library-footer"><span>Showing <strong>{filteredPapers.length}</strong> of <strong>{papers.length}</strong> papers</span><span className="saved-indicator"><span />Your personal collection</span></div>
                </>
              )}
            </section>

            <aside className="research-aside" aria-label="Research overview">
              <section className="progress-panel"><div className="progress-panel-heading"><h2>Research progress</h2><span className="progress-heading-icon"><Sparkles size={17} aria-hidden="true" /></span></div><p className="panel-subtitle">Small steps. Meaningful discoveries.</p>
                <div className="progress-ring" style={{ '--progress': `${progress}%` }}><div className="progress-ring-inner"><strong>{hasLoaded ? progress : 0}<span>%</span></strong><span>completed</span></div></div>
                <p className="progress-summary"><strong>{completed} of {metrics.total} papers</strong><span>read or published</span></p>
                <div className="progress-breakdown">{STATUSES.map((status) => <div className="progress-row" key={status.value}><span><span className={`status-dot status-dot-${status.value}`} />{status.label}</span><strong>{metrics[status.value]}</strong><div className="progress-track"><span className={`progress-fill progress-fill-${status.value}`} style={{ width: `${metrics.total ? metrics[status.value] / metrics.total * 100 : 0}%` }} /></div></div>)}</div>
              </section>
              <section className="discovery-card"><span className="discovery-icon"><Lightbulb size={22} strokeWidth={1.6} aria-hidden="true" /></span><p className="discovery-eyebrow">KEEP YOUR CURIOSITY ALIVE</p><h3>One paper can spark<br />your next big idea.</h3><p>Build your library, connect the dots, and see where your research takes you.</p><button type="button" onClick={() => openEditor()}>Make a new discovery <ArrowRight size={16} aria-hidden="true" /></button></section>
            </aside>
          </div>
          <footer className="workspace-footer"><span>Made for curious minds.</span><span><BookOpen size={13} aria-hidden="true" />Research Space</span></footer>
        </div>
      </main>

      {editor && <PaperForm paper={editor.paper} onSave={savePaper} onClose={() => setEditor(null)} busy={submitting} error={editorError} />}
      {deleteTarget && <Dialog title="Remove this paper?" description="This will permanently remove the paper from your library." onClose={() => setDeleteTarget(null)} busy={submitting} initialFocusRef={deleteCancelRef} className="delete-dialog"><div className="delete-paper-summary"><FileText size={23} aria-hidden="true" /><div><strong>{deleteTarget.title}</strong><span>{deleteTarget.authors}</span></div></div>{deleteError && <p className="form-error" role="alert"><AlertCircle size={16} aria-hidden="true" />{deleteError}</p>}<div className="form-actions"><button ref={deleteCancelRef} className="btn btn-secondary" type="button" onClick={() => setDeleteTarget(null)} disabled={submitting}>Keep paper</button><button className="btn btn-danger" type="button" onClick={deletePaper} disabled={submitting}>{submitting ? <LoaderCircle size={17} className="spin" aria-hidden="true" /> : <Trash2 size={17} aria-hidden="true" />}{submitting ? 'Removing…' : 'Remove paper'}</button></div></Dialog>}
      {toast && <div className={`toast toast-${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>{toast.kind === 'error' ? <AlertCircle size={18} aria-hidden="true" /> : <Check size={18} aria-hidden="true" />}<span>{toast.message}</span><button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button></div>}
    </div>
  );
}

export default App;
