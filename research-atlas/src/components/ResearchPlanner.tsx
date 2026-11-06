import { useState, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowRight, BarChart3, BookOpen, Check, CircleHelp, ClipboardCheck,
  Compass, Database, FileCheck2, FileText, FlaskConical, FolderOpen, Layers3,
  ListChecks, LockKeyhole, MessageSquareText, Search, ShieldCheck, Wrench,
} from 'lucide-react';
import { dataRoutes, dataSteps, guideTools, journeySteps, toolGroups, type PlannerTarget } from '@/lib/planner-guide';
import { External } from './External';
import { ResearchGuide } from './ResearchGuide';
import './research-planner.css';

type OpenSection = (target: PlannerTarget) => void;

const sections = [
  { id: 'journey', label: 'Your research journey', icon: Compass },
  { id: 'data', label: 'Data, surveys & analysis', icon: FlaskConical },
  { id: 'toolkit', label: 'Toolkit', icon: Wrench },
  { id: 'integrity', label: 'Publishing checks', icon: ShieldCheck },
  { id: 'basics', label: 'Research basics', icon: BookOpen },
  { id: 'plan', label: 'My plan', icon: ListChecks },
] as const;

const journeyIcons = [Search, ClipboardCheck, FlaskConical, FileText, FileCheck2, MessageSquareText];
const dataIcons = [Layers3, BarChart3, ListChecks, LockKeyhole, Database, BarChart3];
const routeIcons = [BarChart3, MessageSquareText, Layers3, Database];

function StepExplorer({ steps, icons, label, openSection }: {
  steps: typeof journeySteps;
  icons: typeof journeyIcons;
  label: string;
  openSection?: OpenSection;
}) {
  const [current, setCurrent] = useState(0);
  const step = steps[current];
  const Icon = icons[current];

  return <div className="planner-step-explorer">
    <ol className="planner-step-list" aria-label={label}>
      {steps.map(({ title, phase }, index) => {
        const StepIcon = icons[index];
        return <li key={title}>
          <button type="button" aria-pressed={index === current} onClick={() => setCurrent(index)}>
            <span className="planner-step-icon"><StepIcon size={17} aria-hidden="true" /></span>
            <span><small>Step {index + 1} · {phase}</small><strong>{title}</strong></span>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </li>;
      })}
    </ol>
    <article className="planner-step-detail" aria-live="polite">
      <div className="planner-step-heading">
        <span className="planner-step-icon"><Icon size={23} aria-hidden="true" /></span>
        <div><small>STEP {current + 1} OF {steps.length}</small><h3>{step.title}</h3></div>
      </div>
      <p>{step.summary}</p>
      <ul className="planner-task-list">{step.tasks.map(task => <li key={task}>{task}</li>)}</ul>
      <div className="planner-example"><strong>What it looks like</strong><p>{step.example}</p></div>
      <p className="planner-deliverable"><Check size={16} aria-hidden="true" /><span><strong>What you’ll have</strong><br />{step.output}</span></p>
      {openSection && <button type="button" className="button secondary small" onClick={() => openSection(step.action.target)}>
        {step.action.label}<ArrowRight size={15} aria-hidden="true" />
      </button>}
    </article>
  </div>;
}

function Journey({ openSection }: { openSection?: OpenSection }) {
  return <section className="planner-view" aria-labelledby="planner-journey">
    <h2 id="planner-journey">From a first idea to a paper</h2>
    <p className="planner-intro">Research starts with one question the evidence has yet to answer. Use this map to see what to do, what to write down, and what you’ll have at the end of each step. You can revisit a step whenever the evidence changes your plan.</p>
    <StepExplorer steps={journeySteps} icons={journeyIcons} label="Steps from idea to peer review" openSection={openSection} />
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

function DataGuide({ openSection }: { openSection?: OpenSection }) {
  const [selected, setSelected] = useState<typeof dataRoutes[number]['id']>('quantitative');
  const route = dataRoutes.find(item => item.id === selected)!;
  return <section className="planner-view" aria-labelledby="planner-data">
    <h2 id="planner-data">Data, surveys &amp; analysis</h2>
    <p className="planner-intro">Choose the kind of evidence your question needs. Then plan how to collect, protect, clean, and interpret it. A thoughtful design makes your findings easier to trust and repeat.</p>
    <div className="planner-route-chooser">
      <h3 id="planner-route-label">What do you want to find out?</h3>
      <div className="planner-route-grid" role="group" aria-labelledby="planner-route-label">
        {dataRoutes.map((item, index) => {
          const Icon = routeIcons[index];
          return <button type="button" key={item.id} aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}>
            <Icon size={20} aria-hidden="true" /><strong>{item.name}</strong><small>{item.cue}</small>
          </button>;
        })}
      </div>
      <div className="planner-route-example" aria-live="polite">
        <ArrowDownRight size={22} aria-hidden="true" />
        <div><strong>{route.name} example</strong><p>{route.example}</p><p>{route.record}</p></div>
      </div>
    </div>
    <StepExplorer steps={dataSteps} icons={dataIcons} label="Steps for data collection and analysis" openSection={openSection} />
    <div className="planner-feature-grid">
      <article className="planner-feature">
        <h3>Choose the checklist for your study</h3>
        <p>Use PRISMA for systematic reviews, CONSORT for randomized trials, and STROBE for common observational studies. Pick a relevant extension when needed and check your venue’s guidance.</p>
        <External href="https://www.equator-network.org/">Find reporting guidelines at EQUATOR</External>
      </article>
      <article className="planner-feature">
        <h3>Show how certain you are</h3>
        <p>Explain the size and practical importance of a result, the uncertainty around it, and any limits on who or what it describes. A descriptive study can be appropriate when its question is descriptive.</p>
        <External href="https://doi.org/10.1080/00031305.2016.1154108">American Statistical Association on p-values</External>
      </article>
    </div>
  </section>;
}

const localToolMarks = new Set([
  'connected-papers', 'endnote', 'jasp', 'maxqda', 'orcid', 'osf', 'overleaf',
  'qualtrics', 'redcap', 'researchrabbit', 'semantic-scholar', 'zotero',
]);

function Toolkit() {
  const [group, setGroup] = useState<typeof toolGroups[number]['id']>('find');
  return <section className="planner-view" aria-labelledby="planner-toolkit">
    <h2 id="planner-toolkit">Pick a tool for your next task</h2>
    <p className="planner-intro">Start with the task you need to finish. Some tools are free, while others may be available through your institution. Check its data rules before uploading a manuscript or participant information.</p>
    <div className="planner-tool-filter" role="group" aria-label="Tool categories">
      {toolGroups.map(({ id, label }) => <button key={id} type="button" aria-pressed={group === id} onClick={() => setGroup(id)}>{label}</button>)}
    </div>
    <div className="planner-tool-grid">
      {guideTools.filter(tool => tool.group === group).map(tool => {
        return <article className="planner-tool" key={tool.id}>
          <div className="planner-tool-heading">
            <span className="planner-tool-mark" aria-hidden="true" style={{ color: tool.color }}>
              {localToolMarks.has(tool.id) ? <img src={`${import.meta.env.BASE_URL}research-tools/${tool.id}.png`} alt="" width="36" height="36" /> : tool.mark}
            </span>
            <div><h3>{tool.name}</h3><small>{tool.access}</small></div>
          </div>
          <p>{tool.note}</p>
          <External href={tool.href}>Open {tool.name}</External>
        </article>;
      })}
    </div>
  </section>;
}

function PublishingChecks({ openSection }: { openSection?: OpenSection }) {
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

export function ResearchPlanner({ onStart, onConferences, openSection, workbench }: {
  onStart: () => void;
  onConferences: () => void;
  openSection?: OpenSection;
  workbench?: ReactNode;
}) {
  const [section, setSection] = useState<typeof sections[number]['id']>('journey');
  return <div className="research-planner">
    <header className="planner-hero">
      <div>
        <span className="eyebrow">FROM FIRST IDEA TO PEER REVIEW</span>
        <h1>Research planner</h1>
        <p>Find your next step, see an example, and keep your plan beside the work. Start anywhere and come back as your project takes shape.</p>
        <div className="button-row">
          {workbench && <button type="button" className="button" onClick={() => setSection('plan')}>Open my plan <ArrowRight size={16} aria-hidden="true" /></button>}
          <button type="button" className="button secondary" onClick={onStart}>Try the starter exercise <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <ol className="planner-hero-map" aria-label="Three phases of a research project">
        <li><Search size={18} aria-hidden="true" /><span><small>01 · DEFINE</small><strong>Ask a question</strong></span></li>
        <li><FlaskConical size={18} aria-hidden="true" /><span><small>02 · INVESTIGATE</small><strong>Gather evidence</strong></span></li>
        <li><FileText size={18} aria-hidden="true" /><span><small>03 · SHARE</small><strong>Write and revise</strong></span></li>
      </ol>
    </header>
    <nav className="planner-nav" aria-label="Research planner sections">
      {sections.filter(item => item.id !== 'plan' || workbench).map(({ id, label, icon: Icon }) =>
        <button key={id} type="button" aria-pressed={section === id} onClick={() => setSection(id)}><Icon size={17} aria-hidden="true" />{label}</button>
      )}
    </nav>
    {section === 'journey' && <Journey openSection={openSection} />}
    {section === 'data' && <DataGuide openSection={openSection} />}
    {section === 'toolkit' && <Toolkit />}
    {section === 'integrity' && <PublishingChecks openSection={openSection} />}
    {section === 'basics' && <ResearchGuide onStart={onStart} onConferences={onConferences} embedded />}
    {section === 'plan' && workbench}
  </div>;
}
