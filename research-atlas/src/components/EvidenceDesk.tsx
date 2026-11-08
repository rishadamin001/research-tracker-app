import { useEffect, useEffectEvent, useState } from 'react';
import { ArrowRight, Download, Search } from 'lucide-react';
import { csvCell, matrixCsv, type Paper, type Project } from '@/lib/model';
import { decisionLabels, evidenceLevelLabels, findingSummary, screeningEventLimit, canSupportGap } from '@/lib/evidence-ledger';
import { download } from '@/lib/storage';
import { orderPapers, paperOrderLabels } from '@/lib/ranking';
import { EvidenceClaims, evidenceLedgerCsv, GapEvidence, PaperScreening, ScreeningCriteria } from './EvidenceLedger';
import { OrderSelect, PaperImpact, PaperOrderHelp, PublicationIdentity, usePaperOrder } from './RankingControls';
import { External } from './External';
import './evidence-desk.css';
import { replaceDeskPaper } from '@/lib/evidence-desk';

export type EvidenceDeskProps = {
  project: Project;
  update: (patch: Partial<Project>) => void;
  mode: 'screen' | 'extract';
  interfaceMode?: 'guided' | 'expert';
  initialPaperId?: string;
  onWrite?: (paperId: string, claimId?: string) => void;
  onEditingChange?: (editing: boolean) => void;
  onSelectionChange?: (paperId: string) => void;
};

const noteFields = [
  ['researchProblem', 'Research problem', 'What question does this source investigate?'],
  ['methods', 'Methods and sample', 'Which design, sample and analysis did the authors use?'],
  ['dataset', 'Dataset or evidence', 'Population, setting, corpus or dataset and period covered.'],
  ['finding', 'Extracted finding', 'Describe what the source reports, separate from your interpretation.'],
  ['limitations', 'Limitations', 'What limits the study and what could challenge its conclusions?'],
  ['locator', 'Evidence level and page / section', 'State what you read and the page, table, passage or other exact location.'],
  ['notes', 'Your notes', 'Your interpretation and questions; these are not verified source findings.'],
] as const;
const steps = [['read', '1 · Inspect source'], ['screen', '2 · Screen'], ['extract', '3 · Record evidence']] as const;
type DeskStep = typeof steps[number][0];
const pageSize = 20;

function SourceLinks({ paper }: { paper: Paper }) {
  return <div className="button-row">{paper.url && <External href={paper.url}>Open source</External>}{paper.oa && paper.oa !== paper.url && <External href={paper.oa}>Read open copy</External>}</div>;
}

export function EvidenceDesk({ project, update, mode, interfaceMode = 'guided', initialPaperId, onWrite, onEditingChange, onSelectionChange }: EvidenceDeskProps) {
  const [query, setQuery] = useState('');
  const [decision, setDecision] = useState<Paper['decision'] | 'all'>('all');
  const [order, setOrder] = usePaperOrder();
  const [page, setPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(() => Math.max(0, project.papers.findIndex(paper => paper.id === initialPaperId)));
  const [step, setStep] = useState<DeskStep>(mode === 'extract' ? 'extract' : 'read');
  const [claimEditing, setClaimEditing] = useState(false);
  const [comparisonPage, setComparisonPage] = useState(0);
  const selectIncomingSource = useEffectEvent((paperId: string | undefined) => {
    if (claimEditing || !paperId) return;
    const matches = project.papers.flatMap((paper, index) => paper.id === paperId ? [index] : []);
    if (matches.length === 1 && matches[0] !== selectedIndex) setSelectedIndex(matches[0]);
  });
  useEffect(() => { selectIncomingSource(initialPaperId); }, [initialPaperId]);
  const guided = interfaceMode !== 'expert';
  const terms = query.trim().toLocaleLowerCase();
  const indexed = new Map(project.papers.map((paper, index) => [paper, index]));
  const rows = orderPapers(project.papers.filter(paper => (decision === 'all' || decision === paper.decision) && (!terms || [paper.title, paper.authors, paper.journal, paper.doi ?? '', ...(paper.tags ?? [])].join(' ').toLocaleLowerCase().includes(terms))), order);
  const pageCount = Math.ceil(rows.length / pageSize);
  const shownPage = Math.min(page, Math.max(0, pageCount - 1));
  const visible = rows.slice(shownPage * pageSize, (shownPage + 1) * pageSize);
  const selected = project.papers[selectedIndex] ?? project.papers[0];
  const actualIndex = selected ? indexed.get(selected)! : -1;
  const selectedHasUniqueId = Boolean(selected?.id && project.papers.filter(paper => paper.id === selected.id).length === 1);
  const activeStep = guided && claimEditing ? 'extract' : step;
  const ordered = orderPapers(project.papers, order);
  const compareCount = Math.ceil(ordered.length / pageSize);
  const shownComparison = Math.min(comparisonPage, Math.max(0, compareCount - 1));
  const supported = canSupportGap(project);
  function patchPaper(patch: Partial<Paper>) { update({ papers: replaceDeskPaper(project, actualIndex, patch) }); }
  function record(event: NonNullable<Paper['screeningEvents']>[number]) {
    if (!selected || (selected.screeningEvents?.length ?? 0) >= screeningEventLimit) return;
    update({ papers: replaceDeskPaper(project, actualIndex, { decision: event.decision, reason: event.reason, screeningDraft: undefined, screeningEvents: [...(selected.screeningEvents ?? []), event] }), decisions: [...project.decisions.slice(-299), { at: event.at, note: `${decisionLabels[event.decision]} “${selected.title.slice(0, 500)}”. Reason: ${event.reason.slice(0, 18000)}` }] });
  }
  function choose(index: number) { if (claimEditing) return; setSelectedIndex(index); const paper = project.papers[index]; if (paper) onSelectionChange?.(paper.id); }
  function editingChanged(editing: boolean) { setClaimEditing(editing); onEditingChange?.(editing); }
  const writingHref = selected ? `#writing?${new URLSearchParams({ paper: selected.id })}` : '#writing';
  return <section className={`evidence-desk ${guided ? 'guided-desk' : 'focus-desk'}`} aria-label="Evidence Desk">
    <div className="panel desk-intro"><div><span className="eyebrow">READ → JUDGE → RECORD → USE</span><h2>Evidence Desk</h2><p>{guided ? 'Work through one source at a time. Inspect what you can read, record your selection decision, then capture a finding with its exact location.' : 'Select a source and work directly with its metadata, screening and evidence notes.'}</p></div><a className="button secondary" href="#discover"><Search size={15} aria-hidden="true" />Find more sources</a></div>
    {!project.papers.length ? <section className="panel"><h3>Start with one saved source</h3><p>Search literature or import references into this project. You can explore before your question is final.</p><a className="button secondary" href="#discover">Search literature</a></section> : <>
      <div className="desk-grid">
        <aside className="panel desk-sources" aria-label="Source selection">
          <h3>Your sources</h3><p>{project.papers.length} saved · {project.papers.filter(paper => paper.decision === 'unreviewed' || paper.decision === 'maybe').length} decisions to resolve</p>
          <label className="field"><span>Find in saved literature</span><input type="search" value={query} disabled={claimEditing} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
          <label className="field"><span>Show sources</span><select value={decision} disabled={claimEditing} onChange={event => { setDecision(event.target.value as typeof decision); setPage(0); }}><option value="all">All saved sources</option>{Object.entries(decisionLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
          <OrderSelect label="Sort saved papers" labels={paperOrderLabels} order={order} onChange={value => { setOrder(value); setPage(0); }} />
          <p role="status">{rows.length} matching sources · showing {visible.length}</p>
          {claimEditing && <p className="workspace-note" role="status">Save or cancel your evidence claim before switching sources. Changing workspace mode keeps the form.</p>}
          <ul className="desk-source-list">{visible.map(paper => { const index = indexed.get(paper)!; return <li key={`${index}:${paper.id}`}><button type="button" aria-pressed={actualIndex === index} disabled={claimEditing && actualIndex !== index} onClick={() => choose(index)}><strong>{paper.title || 'Untitled source'}</strong><small>{paper.authors || 'Authors unavailable'} · {paper.year ?? 'Year unavailable'}</small><span>{paper.journalQuartile ? `${paper.journalQuartile.source} ${paper.journalQuartile.quartile} · ${paper.journalQuartile.year}` : 'Quartile unavailable'} · {paper.citedByCount == null ? 'Citations unavailable' : `${paper.citedByCount.toLocaleString()} citations`}</span><small>{decisionLabels[paper.decision]} · {(paper.evidenceClaims?.length ?? 0)} evidence claims</small></button></li>; })}</ul>
          {!rows.length && <p>No sources match these filters. Your selected source remains open.</p>}
          {pageCount > 1 && <nav className="button-row" aria-label="Source list pages"><button type="button" className="button secondary small" disabled={shownPage === 0 || claimEditing} onClick={() => setPage(shownPage - 1)}>Previous sources</button><span>{shownPage + 1} / {pageCount}</span><button type="button" className="button secondary small" disabled={shownPage + 1 === pageCount || claimEditing} onClick={() => setPage(shownPage + 1)}>Next sources</button></nav>}
          <PaperOrderHelp />
        </aside>
        {selected && <div className="desk-detail" key={`${actualIndex}:${selected.id}`}>
          <section className="panel desk-source-heading" aria-label="Selected source"><span className="eyebrow">SOURCE CONTEXT</span><h3>{selected.title || 'Untitled source'}</h3><p>{selected.authors || 'Author metadata unavailable'} · {selected.publicationDate || selected.year || 'Date unavailable'}</p><PublicationIdentity title={selected.journal || 'Publication venue unavailable'} publisher={selected.publisher} type={selected.venueType} /><div className="chips"><span className="tag">{selected.journalQuartile ? `${selected.journalQuartile.source} ${selected.journalQuartile.quartile} · ${selected.journalQuartile.year}` : 'Quartile unavailable'}</span><span className="tag">{selected.citedByCount == null ? 'Citation count unavailable' : `${selected.citedByCount.toLocaleString()} citations`}</span></div><SourceLinks paper={selected} /><label className="field"><span>Reading status for this project</span><select value={selected.readingStatus ?? 'unread'} onChange={event => patchPaper({ readingStatus: event.target.value as Paper['readingStatus'] })}><option value="unread">Unread</option><option value="reading">Reading</option><option value="read">Read</option></select></label></section>
          {guided && <nav className="desk-task-nav" aria-label="Evidence Desk tasks">{steps.map(([id, label]) => <button type="button" className="button secondary" key={id} aria-pressed={activeStep === id} disabled={claimEditing && id !== 'extract'} onClick={() => setStep(id)}>{label}</button>)}</nav>}
          <section className="panel" hidden={guided && activeStep !== 'read'} aria-label="Inspect selected source">
            <h3>Inspect the source</h3><PaperImpact paper={selected} /><p>Metadata identifies this record; it does not establish what the study found. Atlas does not download full text automatically. Open an available source or legal open copy and record what you actually read.</p>{selected.abstract ? <details open={guided}><summary>Supplied abstract · {selected.source}</summary><p className="desk-abstract">{selected.abstract}</p><small>This is supplied source metadata, not an Atlas or AI summary. Check it against the publication and distinguish abstract-only impressions from full-text findings.</small></details> : <p className="muted">No abstract was supplied with this record.</p>}{selected.doi && <p className="desk-identifier">DOI: {selected.doi}</p>}{!selected.url && !selected.oa && <p className="workspace-note">No source link was supplied. Locate and verify the work by its DOI or title before treating it as evidence.</p>}{guided && <button type="button" className="button" onClick={() => setStep('screen')}>Continue to screen this source <ArrowRight size={15} aria-hidden="true" /></button>}
          </section>
          <section className="panel" hidden={guided && activeStep !== 'screen'} aria-label="Screen selected source">
            <h3>Decide whether it fits</h3><PaperScreening paper={selected} criteria={project.screeningCriteria ?? []} quickActions compact={!guided} onDraft={screeningDraft => patchPaper({ screeningDraft })} onRecord={record} />{guided && <button type="button" className="button" onClick={() => setStep('extract')}>Continue to record evidence <ArrowRight size={15} aria-hidden="true" /></button>}
          </section>
          <section className="panel" hidden={guided && activeStep !== 'extract'} aria-label="Extract selected source">
            <h3>Record evidence you can check</h3><p>Source findings, your interpretation and uncertainty belong in separate fields. A claim needs the passage, page, table or other location you inspected.</p>
            <EvidenceClaims paper={selected} onChange={evidenceClaims => patchPaper({ evidenceClaims })} onEditingChange={editingChanged} />
            <details className="desk-working-notes"><summary>Study context and working notes</summary>{noteFields.map(([key, label, hint]) => <label className="field" key={key}><span>{label}</span><textarea rows={3} maxLength={20000} value={selected[key] ?? ''} placeholder={hint} onChange={event => patchPaper({ [key]: event.target.value })} /></label>)}</details>
            <div className="desk-writing-links"><h4>Use checked evidence in writing</h4>{selectedHasUniqueId ? <>{onWrite ? <button type="button" className="text-button" disabled={claimEditing} onClick={() => onWrite(selected.id)}>Open this source in Writing Studio <ArrowRight size={15} aria-hidden="true" /></button> : <a href={writingHref}>Open this source in Writing Studio <ArrowRight size={15} aria-hidden="true" /></a>}{selected.evidenceClaims?.map(claim => { const label = `Use ${claim.claimType}: ${claim.claimText.slice(0, 120)}${claim.claimText.length > 120 ? '…' : ''}`; return <p key={claim.id}>{onWrite ? <button type="button" className="text-button" disabled={claimEditing} onClick={() => onWrite(selected.id, claim.id)}>{label}</button> : <a href={`#writing?${new URLSearchParams({ paper: selected.id, claim: claim.id })}`}>{label}</a>}<small>{evidenceLevelLabels[claim.evidenceLevel]} · {claim.locator} · {claim.reviewStatus.replaceAll('_', ' ')}</small></p>; })}</> : <p>This record needs a unique source identifier before a traceable writing link can be created. Its notes and decisions remain saved.</p>}</div>
          </section>
        </div>}
      </div>
      <ScreeningCriteria criteria={project.screeningCriteria ?? []} onChange={screeningCriteria => update({ screeningCriteria })} />
      <details className="panel"><summary>Compare sources and export evidence</summary><p>The view below shows up to 20 saved sources at a time. Exports include all records, including excluded sources and their decisions.</p><div className="button-row"><button type="button" className="button secondary" onClick={() => download('literature-matrix.csv', matrixCsv({ ...project, papers: ordered }), 'text/csv;charset=utf-8')}><Download size={15} aria-hidden="true" />Export matrix CSV</button><button type="button" className="button secondary" onClick={() => download('evidence-ledger.csv', evidenceLedgerCsv(project), 'text/csv;charset=utf-8')}>Export evidence claims</button><button type="button" className="button secondary" onClick={() => download('screening-history.csv', [['Source', 'Source ID', 'Recorded at', 'Stage', 'Decision', 'Reason', 'Criterion', 'Reviewer'], ...project.papers.flatMap(paper => (paper.screeningEvents ?? []).map(event => [paper.title, paper.id, event.at, event.stage, event.decision, event.reason, event.criterion?.rule, event.reviewer]))].map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8')}>Export screening history</button></div><div className="desk-comparison" role="region" tabIndex={0} aria-label="Evidence comparison table"><table><caption>Evidence comparison · {ordered.length} saved sources</caption><thead><tr>{['Source', 'Selection', 'Methods', 'Finding', 'Locator', 'Limitations'].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{ordered.slice(shownComparison * pageSize, (shownComparison + 1) * pageSize).map((paper, index) => { const finding = findingSummary(paper); return <tr key={`${shownComparison}:${index}`}><th scope="row">{paper.title}</th><td>{decisionLabels[paper.decision]}</td><td>{paper.methods || 'Not recorded'}</td><td>{finding.text || 'Not recorded'}</td><td>{finding.locator || 'Not recorded'}</td><td>{paper.limitations || 'Not recorded'}</td></tr>; })}</tbody></table></div>{compareCount > 1 && <nav className="button-row" aria-label="Evidence comparison pages"><button type="button" className="button secondary" disabled={!shownComparison} onClick={() => setComparisonPage(shownComparison - 1)}>Previous comparison</button><span>{shownComparison + 1} / {compareCount}</span><button type="button" className="button secondary" disabled={shownComparison + 1 === compareCount} onClick={() => setComparisonPage(shownComparison + 1)}>Next comparison</button></nav>}</details>
      <details className="panel" open={mode === 'extract'}><summary>Candidate gap and conflicting evidence</summary><p>A limited or unsuccessful search cannot establish that a gap exists. State a scoped possibility and connect records that support and challenge it.</p><label className="field"><span>Candidate gap and supporting / conflicting evidence</span><textarea rows={4} maxLength={20000} value={project.gap} onChange={event => update({ gap: event.target.value })} /></label><GapEvidence papers={project.papers} /><label className="field"><span>What has not been searched?</span><textarea rows={3} maxLength={20000} value={project.gapSearchLimits} onChange={event => update({ gapSearchLimits: event.target.value })} /></label><label className="field"><span>Review state</span><select value={project.gapStatus} onChange={event => update({ gapStatus: event.target.value as Project['gapStatus'] })}><option value="idea">Provisional idea</option><option value="search underway">Search underway</option><option value="evidence-supported candidate" disabled={!supported}>Evidence-supported candidate</option><option value="human-reviewed candidate" disabled={!supported}>Human-reviewed candidate</option><option value="contradicted">Contradicted by evidence</option><option value="needs-update">Needs review</option></select></label><p className="muted">States describe your review record, not a verified claim of novelty. Supporting states require a kept source and a reviewed claim beyond metadata.</p></details>
    </>}
  </section>;
}
