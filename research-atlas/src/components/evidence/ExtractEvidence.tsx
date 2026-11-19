'use client';

import { Download } from 'lucide-react';
import { matrixCsv, type Project } from '@/lib/model';
import { orderPapers, paperOrderLabels } from '@/lib/ranking';
import { download } from '@/lib/storage';
import { EvidenceClaims, evidenceLedgerCsv, GapEvidence } from './EvidenceLedger';
import { canSupportGap, decisionLabels, findingSummary } from '@/lib/evidence-ledger';
import { OrderSelect, PaperImpact, PublicationIdentity, usePaperOrder } from '@/components/shared/publication/RankingControls';
import type { EvidenceWorkspaceProps } from './evidence-workspace-types';
import { EvidencePaperPanel } from './EvidencePaperPanel';
import { PaperPublished } from '@/components/discovery/PaperPublished';
import { DiscoverySourceLinks } from '@/components/discovery/DiscoverySourceLinks';

const extractionFields = [
  { key: 'researchProblem', label: 'Research problem', hint: 'What question or problem is this study trying to solve?' },
  { key: 'methods', label: 'Methods and sample', hint: 'Record the design, sample, and analysis used.' },
  { key: 'dataset', label: 'Dataset or evidence', hint: 'Name the source, population or setting, and the period covered.' },
  { key: 'finding', label: 'Extracted finding', hint: 'Summarize what the authors reported in your own words.' },
  { key: 'limitations', label: 'Limitations', hint: 'Record weaknesses or limits the authors identify.' },
  { key: 'locator', label: 'Evidence level and page / section', hint: 'For example, full text, page 8, Table 2.' },
  { key: 'notes', label: 'Your notes', hint: 'Keep your interpretation separate from the authors’ finding.' },
] as const;

export function ExtractEvidence({ project, update, onNote }: Pick<EvidenceWorkspaceProps, 'project' | 'update' | 'onNote'>) {
  const [order, setOrder] = usePaperOrder();
  const ordered = orderPapers(project.papers, order);
  const active = ordered.filter(paper => paper.decision !== 'exclude');
  const supported = canSupportGap(project);

  return (
    <>
      <section className="panel">
        <div className="section-heading">
          <h2>Evidence matrix</h2>
          <div className="button-row">
            <button type="button" className="button secondary" disabled={!project.papers.length} onClick={() => download('literature-matrix.csv', matrixCsv({ ...project, papers: ordered }), 'text/csv;charset=utf-8')}>
              <Download size={16} aria-hidden="true" /> Export CSV
            </button>
            {ordered.some(paper => paper.evidenceClaims?.length) && <button type="button" className="button secondary" onClick={() => download('evidence-ledger.csv', evidenceLedgerCsv({ ...project, papers: ordered }), 'text/csv;charset=utf-8')}>Export evidence claims</button>}
          </div>
        </div>
        <details>
          <summary>How to extract comparable evidence</summary>
          <p>Compare papers that ask similar questions. Look for patterns across methods and datasets, and note disagreements or gaps. Record the page or section you checked, or indicate if you only read the abstract.</p>
        </details>
        {project.papers.length > 0 && <OrderSelect label="Sort evidence" labels={paperOrderLabels} order={order} onChange={setOrder} />}
        <p className="muted">The matrix displays included, maybe and unreviewed sources. The export includes every saved record and its screening decision.</p>
        {active.length === 0 ? <p>Save or include a source to populate the matrix.</p> : (
          <div style={{ overflowX: 'auto' }} role="region" aria-label="Evidence comparison table" tabIndex={0}>
            <table style={{ width: '100%', textAlign: 'left', borderSpacing: '12px', tableLayout: 'fixed', minWidth: '56rem', overflowWrap: 'anywhere' }}>
              <caption>Compare {active.length} sources</caption>
              <thead><tr><th scope="col">Source</th><th scope="col">Problem</th><th scope="col">Methods</th><th scope="col">Dataset</th><th scope="col">Finding</th><th scope="col">Limitations</th><th scope="col">Locator</th></tr></thead>
              <tbody>
                {active.map(paper => {
                  const finding = findingSummary(paper);
                  return <tr key={paper.id}>
                    <th scope="row">{paper.title}<br /><small>{decisionLabels[paper.decision]}</small></th>
                    <td>{paper.researchProblem || '—'}</td>
                    <td>{paper.methods || '—'}</td>
                    <td>{paper.dataset || '—'}</td>
                    <td>{finding.text || '—'}</td>
                    <td>{paper.limitations || '—'}</td>
                    <td>{finding.locator || '—'}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {active.map(paper => (
        <EvidencePaperPanel key={paper.id} title={`Edit notes for ${paper.title}`} detail={<><PaperPublished paper={paper} /> · {decisionLabels[paper.decision]}</>}>
          {onNote && <button type="button" className="button secondary small" onClick={() => onNote(paper.id)}>Add my note</button>}
            <PublicationIdentity title={paper.journal} publisher={paper.publisher} type={paper.venueType} />
            <PaperImpact paper={paper} />
            <DiscoverySourceLinks paper={paper} />
            {extractionFields.map(({ key, label, hint }) => (
              <label className="field" key={key}>
                <span>{label}</span>
                <textarea
                  rows={3}
                  maxLength={20000}
                  value={paper[key] ?? ''}
                  placeholder={hint}
                  onChange={event => update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, [key]: event.target.value } : item) })}
                />
              </label>
            ))}
            <EvidenceClaims paper={paper} onChange={evidenceClaims => update({ papers: project.papers.map(item => item.id === paper.id ? { ...item, evidenceClaims } : item) })} />
        </EvidencePaperPanel>
      ))}
      <section className="panel">
        <h2>Document a possible research gap</h2>
        <p>Compare the evidence you have reviewed. State where findings agree, differ, or leave a question unresolved. Describe the limits of your search and the records that support or challenge the claim.</p>
        <label className="field">
          <span>Candidate gap and supporting / conflicting evidence</span>
          <textarea rows={5} maxLength={20000} value={project.gap} onChange={event => update({ gap: event.target.value })} placeholder="Within the searches I ran, these sources agree on … but leave … unclear." />
        </label>
        <GapEvidence papers={project.papers} />
        <h3>What have you searched?</h3>
        <p>{project.searches.length ? `${project.searches.length} recorded search attempts. Open the search audit trail in Discover literature to inspect terms, filters and outcomes.` : 'Completed search attempts will appear in the Discover literature audit trail.'}</p>
        <label className="field"><span>What has not been searched?</span><textarea maxLength={20000} rows={3} value={project.gapSearchLimits ?? ''} onChange={event => update({ gapSearchLimits: event.target.value })} placeholder="For example, other languages, years, databases, or conference proceedings." /></label>
        <label className="field">
          <span>Review state</span>
          <select value={project.gapStatus} onChange={event => update({ gapStatus: event.target.value as Project['gapStatus'] })}>
            <option value="idea">Provisional idea</option>
            <option value="search underway">Search underway</option>
            <option value="evidence-supported candidate" disabled={!supported}>Evidence-supported candidate</option>
            <option value="human-reviewed candidate" disabled={!supported}>Human-reviewed candidate</option>
            <option value="contradicted">Contradicted by evidence</option>
            <option value="needs-update">Needs review</option>
          </select>
        </label>
        {!supported && <p className="muted">Write a candidate gap and link at least one reviewed supporting claim from a source you kept. Use evidence beyond bibliographic metadata.</p>}
        <p className="muted">This records your review state. A claim of novelty requires a thorough search and human judgment.</p>
      </section>
    </>
  );
}
