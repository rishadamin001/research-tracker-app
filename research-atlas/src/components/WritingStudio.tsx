import { useRef, useState } from 'react';
import { ArrowRight, Download, FileText, Link2 } from 'lucide-react';
import type { Project } from '@/lib/model';
import { download } from '@/lib/storage';
import { exportReferences } from '@/lib/reference-exchange';
import { manuscriptDocx } from '@/lib/writing-docx';
import { changeWritingBody, citationSourceUrl, currentWritingStudio, draftBibliography, linkWritingEvidence, manuscriptMarkdown, manuscriptReferencePapers, refreshWritingCitation, writingBody, writingEvidenceState, writingReviewPrompts, writingSections, type WritingSelection, type WritingSectionId, type WritingTarget } from '@/lib/writing-studio';
import { External } from './External';
import './writing-studio.css';

type Props = { project: Project; update: (patch: Partial<Project>) => void; interfaceMode?: 'guided' | 'expert'; initialSelection?: WritingSelection };
const evidenceLabels = { metadata: 'Metadata only', abstract: 'Abstract', full_text: 'Full text', user_observation: 'Author observation' } as const;

export function WritingStudio({ project, update, interfaceMode = 'guided', initialSelection }: Props) {
  const [sectionId, setSectionId] = useState<WritingSectionId>('introduction');
  const [paperId, setPaperId] = useState(initialSelection?.paperId ?? '');
  const [claimId, setClaimId] = useState(initialSelection?.claimId ?? '');
  const [sourceQuery, setSourceQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [showLegacy, setShowLegacy] = useState(Boolean(project.manuscript.trim()));
  const [showAllLinks, setShowAllLinks] = useState(false);
  const [target, setTarget] = useState<WritingTarget>('introduction');
  const editor = useRef<HTMLTextAreaElement>(null), legacyEditor = useRef<HTMLTextAreaElement>(null);
  const cursor = useRef<{ target: WritingTarget; start: number; end: number } | null>(null);
  const studio = currentWritingStudio(project), sections = writingSections(project);
  const section = sections.find(item => item.id === sectionId)!;
  const paperMatches = project.papers.filter(paper => paper.id === paperId);
  const selectedPaper = paperId.trim() && paperMatches.length === 1 ? paperMatches[0] : undefined;
  const claimMatches = selectedPaper?.evidenceClaims?.filter(claim => claim.id === claimId) ?? [];
  const selectedClaim = claimMatches.length === 1 ? claimMatches[0] : undefined;
  const query = sourceQuery.trim().toLocaleLowerCase();
  const sourceMatches = project.papers.filter(paper => !query || [paper.title, paper.authors, paper.doi, paper.journal].some(value => value?.toLocaleLowerCase().includes(query)));
  const sourceOptions = sourceMatches.slice(0, 100);
  if (selectedPaper && !sourceOptions.includes(selectedPaper)) sourceOptions.unshift(selectedPaper);
  const prompts = writingReviewPrompts(project);
  const currentLinks = studio.evidenceLinks.filter(link => link.sectionId === sectionId);
  const links = showAllLinks ? currentLinks : currentLinks.slice(-20);
  const filled = sections.filter(item => writingBody(project, item.id).trim()).length;

  function save(patch: Partial<Project>) { update(patch); setNotice(''); }
  function openSection(id: WritingTarget) {
    if (id === 'legacy') { setShowLegacy(true); setTarget('legacy'); requestAnimationFrame(() => legacyEditor.current?.focus()); }
    else { setSectionId(id); setTarget(id); setShowAllLinks(false); requestAnimationFrame(() => editor.current?.focus()); }
    cursor.current = null;
  }
  function insert(withEvidence: boolean) {
    try {
      const position = cursor.current?.target === target ? cursor.current : null;
      const result = linkWritingEvidence(project, target, paperId, withEvidence ? claimId : undefined, position?.start, position?.end);
      update(result.patch);
      setNotice(withEvidence ? 'Source summary and citation inserted. The evidence location and review snapshot are linked below.' : 'Numbered citation inserted and its bibliography record saved.');
      requestAnimationFrame(() => {
        const field = target === 'legacy' ? legacyEditor.current : editor.current;
        field?.focus(); field?.setSelectionRange(result.cursor, result.cursor);
      });
      cursor.current = { target, start: result.cursor, end: result.cursor };
    } catch (error) { setNotice(error instanceof Error ? error.message : 'The insertion could not be completed.'); }
  }
  function exportDocx() {
    const bytes = manuscriptDocx(project.title, manuscriptMarkdown(project));
    const url = URL.createObjectURL(new Blob([bytes.slice().buffer], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'manuscript-draft.docx'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const hasDraft = Boolean(project.manuscript.trim() || filled);
  return <div className="writing-studio">
    <section className="panel writing-overview"><div><span className="eyebrow">EVIDENCE-LINKED DRAFT</span><h2>Writing Studio</h2><p>Build one section at a time and keep its evidence beside it.</p></div><p className="writing-counts">{filled} of {sections.length} sections contain text · {studio.citations.length} recorded references · {studio.evidenceLinks.length} evidence links</p>
      {project.question.trim() && <p className="writing-question"><strong>Committed question:</strong> {project.question}</p>}
      {!project.question.trim() && <p className="info-bar">You can draft while the question is provisional. Record the scope before finalizing the report.</p>}
      <nav className="writing-section-nav" aria-label="Manuscript sections">{sections.map(item => <button type="button" key={item.id} aria-pressed={item.id === sectionId} onClick={() => openSection(item.id)}>{item.title}{writingBody(project, item.id).trim() && <span aria-label="Contains draft text"> · Draft</span>}</button>)}</nav>
    </section>

    <div className="writing-workspace-grid">
      <div>
        <section className="panel writing-editor"><h3>{section.title}</h3><p>{section.hint}</p>
          <label className="field"><span>Section draft</span><textarea ref={editor} aria-label="Section draft" rows={17} maxLength={20000} value={writingBody(project, sectionId)} onFocus={() => setTarget(sectionId)} onSelect={event => { cursor.current = { target: sectionId, start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }; }} onChange={event => save(changeWritingBody(project, sectionId, event.target.value))} /></label>
          <p className="muted">{writingBody(project, sectionId).length.toLocaleString()} / 20,000 characters. Changing the research pathway adjusts section labels; your text stays in place.</p>
          {interfaceMode === 'guided' && <details><summary>A practical way to draft this section</summary><ol><li>Write the point you want the reader to understand.</li><li>Find the source or analysis that supports it.</li><li>Insert a citation or a located source summary using the panel beside this editor.</li><li>Explain your interpretation and acknowledge disagreements and limits.</li></ol><p>A linked note records where you looked. It does not prove that your interpretation is correct.</p></details>}
        </section>
        <section className="panel" aria-label="Evidence linked to this section"><h3><Link2 size={17} aria-hidden="true" /> Evidence linked to this section</h3>
          {!currentLinks.length && <p>No located evidence is linked yet. A bibliography-only citation does not record the passage behind an assertion. Select an evidence note to add that link.</p>}
          {links.map(link => { const state = writingEvidenceState(project, link); return <article className="writing-evidence" key={link.id}><h4>Reference {state.citation ? `[${state.citation.number}]` : '(missing)'} · {state.citation?.sourceSnapshot.title ?? 'Citation unavailable'}</h4><p><strong>Recorded source summary:</strong> {link.claimText}</p><p><strong>Location:</strong> {evidenceLabels[link.evidenceLevel]} · {link.locator}</p><p><strong>Your interpretation:</strong> {link.interpretation || 'Not recorded.'}</p><p><strong>Uncertainty:</strong> {link.uncertainty || 'Not recorded.'}</p>{state.issues.length ? <ul className="writing-warnings">{state.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <p className="muted">The current note is marked reviewed and no changed recorded field was detected. Verify the underlying source yourself.</p>}<div className="button-row">{state.citation && citationSourceUrl(state.citation) && <External href={citationSourceUrl(state.citation)!}>Return to source</External>}<a className="text-button" href={`#extract?paper=${encodeURIComponent(state.paper?.id ?? state.citation?.paperId ?? '')}`}>Review source evidence <ArrowRight size={15} /></a><button className="text-button danger" type="button" onClick={() => { update({ writingStudio: { ...studio, evidenceLinks: studio.evidenceLinks.filter(item => item.id !== link.id) } }); setNotice('Evidence link removed. Draft text, citation and original source note remain available.'); }}>Remove this draft link</button></div></article>; })}
          {currentLinks.length > 20 && <button type="button" className="text-button" onClick={() => setShowAllLinks(!showAllLinks)}>{showAllLinks ? 'Show latest 20 links' : `Show all ${currentLinks.length} links`}</button>}
        </section>
        <section className="panel"><h3>Earlier freeform manuscript</h3><p>Your existing manuscript remains separate. Copy it into a structured section when you choose; no automatic migration changes its wording.</p><button type="button" className="text-button" aria-expanded={showLegacy} onClick={() => setShowLegacy(!showLegacy)}>{showLegacy ? 'Hide earlier draft' : 'Open earlier draft'}</button>
          {showLegacy && <><label className="field"><span>Manuscript draft</span><textarea aria-label="Manuscript draft" ref={legacyEditor} rows={10} maxLength={20000} value={project.manuscript} onFocus={() => setTarget('legacy')} onSelect={event => { cursor.current = { target: 'legacy', start: event.currentTarget.selectionStart, end: event.currentTarget.selectionEnd }; }} onChange={event => save({ manuscript: event.target.value })} /></label><button type="button" className="button secondary" disabled={!project.manuscript.trim() || writingBody(project, sectionId).includes(project.manuscript)} onClick={() => { try { save(changeWritingBody(project, sectionId, [writingBody(project, sectionId), project.manuscript].filter(Boolean).join('\n\n'))); setNotice('Earlier draft copied to this section. The original is still preserved.'); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not copy the earlier draft.'); } }}>Copy earlier draft to {section.title}</button></>}
        </section>
      </div>

      <aside className="writing-source-pane">
        <section className="panel"><h3>Connect a source</h3><p>Inserting into: <strong>{target === 'legacy' ? 'Earlier freeform manuscript' : sections.find(item => item.id === target)?.title}</strong>. Click in an editor to choose the insertion point.</p>
          {!project.papers.length ? <p>Save or import a reference first. <a href="#discover">Find papers <ArrowRight size={15} /></a></p> : <>
            <label className="field"><span>Find a source to cite</span><input type="search" value={sourceQuery} onChange={event => setSourceQuery(event.target.value)} placeholder="Title, author, DOI or journal" /></label>
            <label className="field"><span>Reference from this project</span><select aria-label="Reference from this project" value={selectedPaper ? paperId : ''} onChange={event => { setPaperId(event.target.value); setClaimId(''); }}><option value="">Choose a saved source</option>{sourceOptions.map((paper, index) => { const ambiguous = !paper.id.trim() || project.papers.filter(item => item.id === paper.id).length !== 1; return <option key={`${paper.id}-${index}`} value={paper.id} disabled={ambiguous}>{paper.title} ({paper.year ?? 'date unknown'}){ambiguous ? ' · review record identifier' : ''}</option>; })}</select></label>
            {paperId && !selectedPaper && <p role="status">The requested source is unavailable or its record identifier is ambiguous. Review the source records before inserting a citation.</p>}
            {sourceMatches.length > 100 && <p className="muted">Showing the first 100 matching references. Narrow the search to find another source.</p>}
            {selectedPaper && <>
              <p><strong>{selectedPaper.title}</strong><br />{selectedPaper.authors || 'Author metadata unavailable'} · {selectedPaper.year ?? 'Date unavailable'}</p>
              <label className="field"><span>Evidence from this source</span><select aria-label="Evidence from this source" value={selectedClaim ? claimId : ''} onChange={event => setClaimId(event.target.value)}><option value="">Reference only — no evidence note</option>{selectedPaper.evidenceClaims?.map((claim, index) => <option key={`${claim.id}-${index}`} value={claim.id} disabled={selectedPaper.evidenceClaims!.filter(item => item.id === claim.id).length !== 1}>{claim.claimText.slice(0, 160)} · {claim.locator}</option>)}</select></label>
              {claimId && !selectedClaim && <p role="status">The requested evidence note is unavailable. Select another note or return to the source.</p>}
              {selectedClaim && <div className="writing-source-note"><p><strong>Recorded source summary:</strong> {selectedClaim.claimText}</p><p>{evidenceLabels[selectedClaim.evidenceLevel]} · {selectedClaim.locator} · {selectedClaim.reviewStatus === 'reviewed' ? 'Marked reviewed by author' : 'Needs author review'}</p><p><strong>Interpretation:</strong> {selectedClaim.interpretation || 'Not recorded.'}</p><p><strong>Uncertainty:</strong> {selectedClaim.uncertainty || 'Not recorded.'}</p></div>}
              {selectedPaper.decision === 'exclude' && <p className="error">This source is currently excluded. Reconcile its screening decision before relying on it.</p>}
              {selectedPaper.isRetracted && <p className="error">The scholarly provider marks this source as retracted. Investigate before using it.</p>}
              {selectedPaper.url && <External href={selectedPaper.url}>Open selected reference</External>}
              <a className="text-button" href={`#extract?paper=${encodeURIComponent(selectedPaper.id)}`}>Read and extract evidence <ArrowRight size={15} /></a>
            </>}
            <div className="button-row"><button type="button" className="button secondary" disabled={!selectedPaper} onClick={() => insert(false)}>Insert citation</button><button type="button" className="button" disabled={!selectedClaim} onClick={() => insert(true)}>Insert located evidence</button></div>
            <p className="muted">A numbered draft citation adds a bibliography record. A located evidence insertion also retains the note, location and review state. Source summaries are author-entered notes, not automatically verified quotations.</p>
          </>}
          {notice && <p role="status">{notice}</p>}
        </section>
        <section className="panel"><h3>Draft review prompts ({prompts.length})</h3><p>These checks inspect recorded links and completeness. They cannot detect every unsupported claim or assess scientific validity.</p>{prompts.length ? <ul className="writing-review-list">{prompts.slice(0, 20).map(prompt => <li key={prompt.id}><p>{prompt.detail}</p><button type="button" className="text-button" onClick={() => openSection(prompt.sectionId)}>Review {prompt.sectionId === 'legacy' ? 'earlier draft' : sections.find(item => item.id === prompt.sectionId)?.title}</button></li>)}</ul> : <p>No recorded-link issue was detected. Check every substantive assertion and the original sources before sharing.</p>}{prompts.length > 20 && <p>Showing 20 of {prompts.length} prompts. The complete traceability export retains every link.</p>}</section>
      </aside>
    </div>

    <section className="panel writing-export"><h3><FileText size={18} aria-hidden="true" /> Draft bibliography and exports</h3><p>References use a numbered draft format based on the metadata saved at insertion. Export RIS or BibTeX to a reference manager for your publisher’s required style. Missing metadata is shown explicitly.</p>
      {studio.citations.length ? <ol className="writing-bibliography">{studio.citations.slice().sort((a, b) => a.number - b.number).map(citation => <li key={citation.id} value={citation.number}><p>{citation.sourceSnapshot.authors || 'Author not supplied'} ({citation.sourceSnapshot.year ?? 'n.d.'}). <strong>{citation.sourceSnapshot.title}</strong>. {citation.sourceSnapshot.journal || 'Venue not supplied'}.</p><p className="muted">Bibliography snapshot {new Date(citation.metadataRefreshedAt ?? citation.createdAt).toLocaleString()}.</p><div className="button-row">{citationSourceUrl(citation) && <External href={citationSourceUrl(citation)!}>Reference [{citation.number}] source</External>}<button type="button" className="text-button" onClick={() => { try { update(refreshWritingCitation(project, citation.id)); setNotice(`Bibliography snapshot [${citation.number}] refreshed from the saved reference. Evidence-note snapshots were preserved.`); } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not refresh the bibliography snapshot.'); } }}>Refresh reference [{citation.number}] metadata</button></div></li>)}</ol> : <p>No bibliography record has been inserted yet.</p>}
      <details><summary>Plain-text bibliography preview</summary><pre className="writing-preview">{draftBibliography(project) || 'Insert a saved source to build the bibliography.'}</pre></details>
      <div className="button-row"><button type="button" className="button" disabled={!hasDraft} onClick={() => download('manuscript-draft.md', manuscriptMarkdown(project), 'text/markdown')}><Download size={16} />Export manuscript draft</button><button type="button" className="button secondary" disabled={!hasDraft} onClick={exportDocx}>Export DOCX draft</button><button type="button" className="button secondary" disabled={!studio.citations.length} onClick={() => download('manuscript-references.ris', exportReferences(manuscriptReferencePapers(project), 'ris'), 'application/x-research-info-systems')}>Export cited RIS</button><button type="button" className="button secondary" disabled={!studio.citations.length} onClick={() => download('manuscript-references.bib', exportReferences(manuscriptReferencePapers(project), 'bibtex'), 'application/x-bibtex')}>Export cited BibTeX</button><button type="button" className="button secondary" disabled={!studio.evidenceLinks.length} onClick={() => download('manuscript-evidence-links.json', JSON.stringify({ format: 'research-atlas-writing-traceability', exportedAt: new Date().toISOString(), projectId: project.id, citations: studio.citations, evidenceLinks: studio.evidenceLinks }, null, 2), 'application/json')}>Export evidence links</button></div>
      <p className="muted">Markdown and DOCX include filled sections, any earlier freeform draft, bibliography and the evidence traceability appendix. The appendix can contain private interpretation notes. Review it before sharing. DOCX preserves text, headings and numbered references; review tables, equations, page limits and formatting in your document editor.</p>
    </section>
  </div>;
}
