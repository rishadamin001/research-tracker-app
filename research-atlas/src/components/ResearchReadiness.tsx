import { researchPassport, researchPassportMarkdown, researchReadiness } from '@/lib/research-readiness';
import type { Project, Stage } from '@/lib/model';
import { download } from '@/lib/storage';

export function ResearchReadiness({ project, onNavigate }: { project: Project; onNavigate: (stage: Stage) => void }) {
  const prompts = researchReadiness(project);
  return <section className="panel" aria-label="Research readiness review">
    <h2>Research readiness review</h2><p>Check missing records and explicit inconsistencies before the next milestone. This reviews completeness; it does not certify scientific quality, ethics approval, novelty or acceptance.</p>
    <p role="status">{prompts.length ? `${prompts.length} prompts to review. You can continue working in any section.` : 'The configured records are present. Independent academic and venue review are still needed.'}</p>
    <details><summary>Review project records</summary><ul className="decision-log">{prompts.map(prompt => <li key={prompt.id}><strong>{prompt.title}</strong><p>{prompt.detail}</p><button type="button" className="text-button" onClick={() => onNavigate(prompt.area)}>Open {prompt.area === 'extract' ? 'Evidence Desk' : prompt.area}</button></li>)}</ul></details>
    <details><summary>Export Research Passport</summary><p>Take a human-readable record of question versions, actual searches, criteria, source locations, methods, uncertainty and decisions to a supervisor. It may contain private notes and unpublished work. Review the file before sharing.</p><p>A passport is a review document, not a restore backup. Download a portable project backup from My projects for recovery.</p><div className="button-row"><button type="button" className="button secondary" onClick={() => download('research-passport.md', researchPassportMarkdown(project), 'text/markdown;charset=utf-8')}>Export passport Markdown</button><button type="button" className="button secondary" onClick={() => download('research-passport.json', JSON.stringify(researchPassport(project), null, 2), 'application/json')}>Export passport JSON</button></div></details>
  </section>;
}
