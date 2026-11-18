import { Search, ClipboardCheck, FlaskConical, FileText, FileCheck2, MessageSquareText, BookOpen, ArrowRight } from 'lucide-react';
import { journeySteps } from '@/lib/planner-guide';
import { External } from '@/components/shared/External';
import type { OpenSection } from './ResearchPlannerTypes';
import { ResearchPlannerStepExplorer } from './ResearchPlannerStepExplorer';

const journeyIcons = [Search, ClipboardCheck, FlaskConical, FileText, FileCheck2, MessageSquareText];

export function ResearchPlannerJourney({ openSection }: { openSection?: OpenSection }) {
  return <section className="planner-view" aria-labelledby="planner-journey">
    <h2 id="planner-journey">Plan and develop a research paper</h2>
    <p className="planner-intro">Research starts with one question the evidence has yet to answer. Use this map to see what to do, what to write down, and what you’ll have at the end of each step. You can revisit a step whenever the evidence changes your plan.</p>
    <ResearchPlannerStepExplorer steps={journeySteps} icons={journeyIcons} label="Steps from idea to peer review" openSection={openSection} />
    <div className="planner-feature-grid">
      <article className="planner-feature">
        <span className="planner-step-icon"><BookOpen size={20} aria-hidden="true" /></span>
        <h3>Compare papers by theme</h3>
        <p>Keep one row per source. Compare which methods and datasets tell a similar story and where the evidence disagrees.</p>
        <div className="planner-matrix" role="region" aria-label="Example synthesis grid" tabIndex={0}>
          <table>
            <caption>Example row from a synthesis grid</caption>
            <thead><tr><th scope="col">Problem</th><th scope="col">Method</th><th scope="col">Dataset</th><th scope="col">Result</th><th scope="col">Gap</th></tr></thead>
            <tbody><tr><td>Choice of study space</td><td>Interviews</td><td>One class</td><td>Quiet space mattered</td><td>Commuters were underrepresented</td></tr></tbody>
          </table>
        </div>
        {openSection && <button type="button" className="text-button planner-link-button" onClick={() => openSection('extract')}>Open evidence matrix <ArrowRight size={15} aria-hidden="true" /></button>}
      </article>
      <article className="planner-feature">
        <span className="planner-step-icon"><FileText size={20} aria-hidden="true" /></span>
        <h3>Give the draft a clear structure</h3>
        <p>IMRaD is a common structure for empirical papers. Check the venue’s instructions for your article type.</p>
        <dl className="planner-imrad">
          <div><dt><b>I</b> Introduction</dt><dd>Why does the question matter?</dd></div>
          <div><dt><b>M</b> Methods</dt><dd>What did you do?</dd></div>
          <div><dt><b>R</b> Results</dt><dd>What did you find?</dd></div>
          <div><dt><b>D</b> Discussion</dt><dd>What does it mean, and where are the limits?</dd></div>
        </dl>
        <External href="https://www.icmje.org/recommendations/browse/manuscript-preparation/preparing-for-submission.html">ICMJE manuscript structure</External>
      </article>
    </div>
  </section>;
}
