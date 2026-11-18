import { ShieldCheck, FileCheck2, Search, CircleHelp, FolderOpen, ClipboardCheck, ArrowRight } from 'lucide-react';
import { External } from '@/components/shared/External';
import type { OpenSection } from './ResearchPlannerTypes';

export function ResearchPlannerPublishingChecks({ openSection }: { openSection?: OpenSection }) {
  return <section className="planner-view" aria-labelledby="planner-publishing">
    <h2 id="planner-publishing">Before you submit or pay</h2>
    <p className="planner-intro">Check the venue, prepare the review copy, and document how you produced the work. Open My plan to put these checks alongside your own timeline and budget.</p>
    <div className="planner-feature-grid">
      <article className="planner-feature">
        <span className="planner-step-icon"><ShieldCheck size={20} aria-hidden="true" /></span>
        <h3>Verify the venue and total fees</h3>
        <p>Some computing fields value peer-reviewed conferences highly. Other fields commonly publish in journals. Ask your supervisor what counts in your field and check the venue’s scope, peer review, fees, and organizer.</p>
        <p>Match the journal’s ISSN and publisher to the official site and any index it claims. Check coverage dates and review charges, waivers, and refund terms before submitting.</p>
        <div className="planner-source-links">
          <External href="https://thinkchecksubmit.org/journals/">Think. Check. Submit.</External>
          <External href="https://mjl.clarivate.com/home">Web of Science Master Journal List</External>
          <External href="https://www.scopus.com/sources.uri">Scopus Sources</External>
          <External href="https://doaj.org/">DOAJ</External>
        </div>
      </article>
      <article className="planner-feature">
        <span className="planner-step-icon"><FileCheck2 size={20} aria-hidden="true" /></span>
        <h3>Prepare the exact review copy</h3>
        <p>Use the venue’s current template, page and abstract limits, caption rules, and figure specifications. Use labels or patterns as well as color. Check whether it requires vector figures or a specific raster resolution.</p>
        <p>If review is double-anonymous, follow the venue’s rules for author names, affiliations, acknowledgments, identifying file names, metadata, repository links, and self-citations.</p>
        <External href="https://www.acm.org/publications/policies/roles-and-responsibilities">ACM peer-review policies</External>
      </article>
      <article className="planner-feature">
        <span className="planner-step-icon"><Search size={20} aria-hidden="true" /></span>
        <h3>Review text matches in context</h3>
        <p>A similarity report highlights matching text. Read each match to decide whether the source is credited and whether quotation, paraphrase, or permission is needed.</p>
        <div className="planner-example"><strong>Two reports can tell different stories</strong><p>A small overlap may contain an uncredited passage. A larger overlap may come from properly cited quotes, references, or standard methods language.</p></div>
        <External href="https://helpcenter.turnitin.com/hc/en-us/articles/27811925295501-Does-Turnitin-check-for-plagiarism-and-what-is-a-good-Similarity-score">Turnitin on similarity scores</External>
      </article>
      <article className="planner-feature">
        <span className="planner-step-icon"><CircleHelp size={20} aria-hidden="true" /></span>
        <h3>Document any AI use</h3>
        <p>Keep version history, verify every reference and claim, and check the venue’s disclosure rules. Authors remain accountable for the manuscript. ICMJE and COPE exclude AI tools from authorship.</p>
        <p>Where disclosure is required, record the tool and its purpose, how you checked the output, and any extra detail the venue requests. A detector score alone is insufficient evidence of who wrote a passage.</p>
        <div className="planner-source-links">
          <External href="https://www.icmje.org/recommendations/browse/artificial-intelligence/">ICMJE AI guidance</External>
          <External href="https://publicationethics.org/guidance/cope-position/authorship-and-ai-tools">COPE on authorship and AI</External>
        </div>
      </article>
      <article className="planner-feature">
        <span className="planner-step-icon"><FolderOpen size={20} aria-hidden="true" /></span>
        <h3>Assemble the submission pack</h3>
        <p>Confirm author order and the corresponding author with the team. Record contributions, required ethics and consent statements, funding, competing interests, and the terms for accessing data and code.</p>
        <p>Write a short cover letter about fit and contribution. When revision feedback arrives, pair each comment with your response and the page and line that changed.</p>
        <External href="https://credit.niso.org/">CRediT contribution roles</External>
      </article>
      <article className="planner-feature">
        <span className="planner-step-icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
        <h3>Budget and plan backward</h3>
        <p>Check author charges separately from what readers pay. Budget for any submission, open-access, page, or color charges. For conferences include registration, travel, visas, and posters.</p>
        <p>Work backward from the exact deadline and time zone. Leave time for co-author feedback, approval, and the upload. A journal’s review schedule varies, so use its published guidance when available.</p>
        {openSection && <button type="button" className="text-button planner-link-button" onClick={() => openSection('publish')}>Open venue shortlist <ArrowRight size={15} aria-hidden="true" /></button>}
      </article>
    </div>
  </section>;
}
