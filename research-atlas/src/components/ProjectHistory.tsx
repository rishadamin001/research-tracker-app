import { useState } from 'react';
import { csvCell, type Project } from '@/lib/model';
import { projectEventKinds, projectEventLimit, projectHistory, type ProjectEventKind } from '@/lib/research-trail';
import { download } from '@/lib/storage';
import { External } from './External';

export function ProjectHistory({ project }: { project: Project }) {
  const [kind, setKind] = useState<'all' | ProjectEventKind>('all');
  const [showAll, setShowAll] = useState(false);
  const history = projectHistory(project);
  const filtered = history.filter(event => kind === 'all' || event.kind === kind);
  const visible = showAll ? filtered : filtered.slice(0, 30);
  const versions = [...(project.questionVersions ?? [])].reverse();
  function linkedSource(entityId?: string) { return entityId ? project.papers.find(paper => paper.id === entityId || paper.evidenceClaims?.some(claim => claim.id === entityId) || paper.screeningEvents?.some(event => event.id === entityId)) : undefined; }
  function exportCsv() {
    const rows = [['Event', 'Recorded at', 'Last updated', 'Detail', 'Linked record ID', 'Provenance'], ...filtered.map(event => [projectEventKinds[event.kind], event.at, event.updatedAt, event.detail, event.entityId ?? '', event.source])];
    download('project-history.csv', rows.map(row => row.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  }
  return <section className="panel" aria-label="Project research history">
    <h2>How your research developed</h2>
    <p>Follow the question, searches, sources, decisions, and evidence behind this project. History records actions and links to their identifiers; it is not a complete copy of every earlier draft.</p>
    <details><summary>Question versions ({versions.length})</summary>
      {!versions.length && <p>No versioned edit has been recorded yet. The current question is preserved in your project; older edit times cannot be reconstructed.</p>}
      <ol className="decision-log">{versions.map(version => <li key={version.id}><strong>Question v{version.version}</strong><p>{version.wording || '(Question cleared)'}</p><p><strong>Reason:</strong> {version.reason}</p><small><time dateTime={version.recordedAt}>{new Date(version.recordedAt).toLocaleString()}</time>{version.origin === 'legacy-baseline' && ' · Earlier wording captured when version tracking began'}</small>{version.affectedStages.length > 0 && <p>{version.affectedClaimCount} reviewed evidence claims may need another look · affected work: {version.affectedStages.join(', ')}.</p>}</li>)}</ol>
    </details>
    <label className="field"><span>Filter project history</span><select value={kind} onChange={event => { setKind(event.target.value as 'all' | ProjectEventKind); setShowAll(false); }}><option value="all">All recorded activity</option>{Object.entries(projectEventKinds).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <div className="button-row"><button type="button" className="button secondary" onClick={exportCsv}>Export history CSV</button><button type="button" className="button secondary" onClick={() => download('project-history.json', JSON.stringify({ format: 'research-atlas-project-history', exportedAt: new Date().toISOString(), projectId: project.id, questionVersions: project.questionVersions ?? [], events: history }, null, 2), 'application/json')}>Export history JSON</button></div>
    <ol className="decision-log">{visible.map(event => { const paper = linkedSource(event.entityId); return <li key={event.id}><strong>{projectEventKinds[event.kind]}</strong><time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time><p>{event.detail}</p>{paper && <p><External href={paper.url}>Source: {paper.title}</External></p>}{event.entityId && <small style={{ overflowWrap: 'anywhere' }}>Linked record: {event.entityId}</small>}{event.updatedAt !== event.at && <small> · Last draft edit {new Date(event.updatedAt).toLocaleString()}</small>}{event.source === 'existing-record' && <small> · From an existing dated record</small>}</li>; })}</ol>
    {filtered.length > 30 && <button type="button" className="text-button" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show latest 30 events' : `Show all ${filtered.length} events`}</button>}
    <p className="muted">Atlas keeps the latest {projectEventLimit.toLocaleString()} action records per project. Consecutive draft edits are grouped into 30-second editing sessions. Earlier searches, screening decisions, and claims are also shown from their saved dated records. History is local, editable through imported project data, and is not a tamper-proof audit log.</p>
  </section>;
}
