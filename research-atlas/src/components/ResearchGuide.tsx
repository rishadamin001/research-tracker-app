import { useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, CalendarDays, FileText, ListChecks, Presentation, Search, ShieldCheck } from 'lucide-react';
import { External } from './External';
import './research-guide.css';

const chapters = [
  { id: 'formats', label: 'Know the formats', icon: BookOpen },
  { id: 'read', label: 'Read a paper', icon: FileText },
  { id: 'quality', label: 'Check quality', icon: ShieldCheck },
  { id: 'conferences', label: 'Check a conference', icon: CalendarDays },
] as const;

const formats = [
  { label: 'Research paper', type: 'A piece of work', icon: FileText, description: 'A written report that explains a research question, the evidence, and what the authors found. A paper can also synthesize evidence from earlier studies.' },
  { label: 'Academic journal', type: 'A place to publish', icon: BookOpen, description: 'An ongoing publication that collects articles on a topic. Its editors may ask experts to review submissions before publication.' },
  { label: 'Conference', type: 'An event', icon: Presentation, description: 'A scheduled gathering where researchers present work, discuss ideas, and meet others. A talk or poster may be accepted from a short abstract.' },
  { label: 'Conference paper', type: 'A written contribution', icon: ListChecks, description: 'A paper submitted to an event. Some conferences publish accepted papers in a collection called proceedings. The review process varies by event and submission type.' },
];

const paperSections = [
  { name: 'Abstract', question: 'Is this paper relevant?', note: 'Skim the question, method, and main finding. Use the summary to decide whether to read further, then check the details in the paper.', example: 'We interviewed twelve students about why they use paper or digital notes.' },
  { name: 'Introduction', question: 'What were the authors trying to answer?', note: 'Look for the problem, what other researchers have found, and the specific question or objective.', example: 'We wanted to know what makes a note-taking tool practical during lectures.' },
  { name: 'Methods', question: 'How did they do the work?', note: 'Find out who or what was studied, how evidence was collected, and how the authors analyzed it.', example: 'We invited twelve students from one course and grouped recurring ideas from their interviews.' },
  { name: 'Results', question: 'What did they find?', note: 'Read the tables, figures, and findings. Look for how large a difference was and how uncertain the estimate is, where relevant.', example: 'Some students chose paper because it was quicker for sketches. Others chose digital notes because they were easy to search.' },
  { name: 'Discussion', question: 'How far does the evidence go?', note: 'Compare the authors’ interpretation with the results. Note limits, alternate explanations, and which people or places the findings apply to.', example: 'We studied one course. A survey across courses could test how common these preferences are.' },
  { name: 'References', question: 'Where can I check the evidence?', note: 'Follow important citations to the original sources. Check the cited passage to see what it actually supports.', example: 'Open the earlier study that the authors cite for their interview approach and compare how it was used.' },
];

const journalChecks = [
  { name: 'Confirm the journal’s identity', body: 'Match the journal’s ISSN, publisher, and official website. If it claims to be indexed, search the relevant index for that exact title and check its coverage dates.', links: [ ['ISSN Portal', 'https://portal.issn.org/'], ['Web of Science Master Journal List', 'https://mjl.clarivate.com/home'], ['Scopus Sources', 'https://www.scopus.com/sources.uri'], ['DOAJ', 'https://doaj.org/'] ] },
  { name: 'Read the submission rules', body: 'Check the journal’s scope, editors, review process, and fees. Read a few recent articles. A promise of guaranteed acceptance deserves a closer look.', links: [ ['Think. Check. Submit.', 'https://thinkchecksubmit.org/journals/'] ] },
  { name: 'Compare like with like', body: 'A quartile groups journals by rank within a subject and year. Q1 is the highest group. Record the ranking service, subject, and year because a journal can have different quartiles across categories.', links: [ ['SCImago Journal & Country Rank', 'https://www.scimagojr.com/journalrank.php'] ] },
  { name: 'Check the paper’s current record', body: 'Search the paper’s DOI, a persistent identifier, for corrections or a retraction. Open the publisher record and read any comments or notices in context.', links: [ ['Crossmark', 'https://www.crossref.org/crossmark/'], ['Retraction Watch data at Crossref', 'https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/'], ['PubPeer', 'https://pubpeer.com/'] ] },
];

const conferenceChecks = [
  'I found the event on an official organizer or host website.',
  'I checked that the organizer, committee, and venue can be independently confirmed.',
  'I confirmed the submission deadline, time zone, event dates, and fees.',
  'I checked how submissions are reviewed and what an acceptance includes.',
  'I verified the proceedings publisher and checked any indexing claim for this event edition.',
];

function Formats() {
  return <section className="guide-chapter" aria-labelledby="guide-formats">
    <h2 id="guide-formats">The paper, the journal, and the event</h2>
    <p className="guide-intro">Imagine a team studies how students take notes. Their study could become a paper in a journal, or they might present the work at a conference. The paper is the written account. The venue is where people can find or hear about it.</p>
    <div className="guide-formats">
      {formats.map(({ label, type, icon: Icon, description }) => <article className="guide-card" key={label}>
        <span className="guide-icon"><Icon size={23} aria-hidden="true" /></span>
        <small>{type}</small>
        <h3>{label}</h3>
        <p>{description}</p>
      </article>)}
    </div>
    <div className="guide-callout">
      <h3>Two ways to share the work</h3>
      <div className="guide-route"><span>Research paper</span><ArrowRight size={16} aria-hidden="true" /><span>Journal submission</span><ArrowRight size={16} aria-hidden="true" /><span>Published article if accepted</span></div>
      <div className="guide-route"><span>Abstract or paper</span><ArrowRight size={16} aria-hidden="true" /><span>Conference submission</span><ArrowRight size={16} aria-hidden="true" /><span>Talk, poster, or proceedings if accepted</span></div>
      <p>Before submitting, read the venue’s rules on prior publication and sending the same work elsewhere.</p>
      <div className="guide-links"><External href="https://libguides.mit.edu/c.php?g=176260&p=1158899">MIT Libraries on research articles</External><External href="https://thinkcheckattend.org/check/">Conference proceedings checklist</External></div>
    </div>
  </section>;
}

function Reading() {
  const [selected, setSelected] = useState(0);
  const section = paperSections[selected];
  return <section className="guide-chapter" aria-labelledby="guide-read">
    <h2 id="guide-read">Read with a question in mind</h2>
    <p className="guide-intro">Choose a section in the sample paper to see what to look for. This layout is common in empirical studies. Other disciplines and review articles may organize their evidence differently.</p>
    <div className="guide-anatomy">
      <div className="guide-paper" role="group" aria-label="Explore parts of an example paper">
        <span className="eyebrow">FICTIONAL EXAMPLE</span>
        <h3>How do students take notes during lectures?</h3>
        {paperSections.map(({ name }, index) => <button key={name} type="button" className="guide-paper-part" aria-pressed={selected === index} onClick={() => setSelected(index)}>
          <span className="guide-paper-step" aria-hidden="true">{index + 1}</span>{name}<ArrowRight size={15} aria-hidden="true" />
        </button>)}
      </div>
      <div className="guide-card guide-reading-note" aria-live="polite">
        <span className="guide-icon"><Search size={23} aria-hidden="true" /></span>
        <small>{section.name}</small>
        <h3>{section.question}</h3>
        <p>{section.note}</p>
        <div className="guide-note"><strong>In the example paper</strong><span>{section.example}</span></div>
        <div className="guide-note"><strong>Try a one-line note</strong><span>“The authors studied …, found …, and the main limitation was …” Add the page, table, or section so you can find it again.</span></div>
      </div>
    </div>
    <div className="guide-links"><External href="https://libguides.mit.edu/c.php?g=176260&p=1158899">MIT Libraries on reading scholarly articles</External></div>
  </section>;
}

function Quality() {
  return <section className="guide-chapter" aria-labelledby="guide-quality">
    <h2 id="guide-quality">Use rankings to shortlist, then check the evidence</h2>
    <p className="guide-intro">Rankings summarize a venue’s citation patterns or standing in a field. When choosing a paper, start with relevance and check whether its methods and results support the claim you want to cite.</p>
    <div className="guide-metric-grid">
      <article className="guide-card"><span className="guide-icon"><BarChart3 size={23} aria-hidden="true" /></span><h3>Venue signals</h3><p>Look at subject fit, indexing, editorial policies, and the source and year of any rank. An ISSN identifies a publication. Indexing tells you where it is listed.</p></article>
      <article className="guide-card"><span className="guide-icon"><FileText size={23} aria-hidden="true" /></span><h3>Paper evidence</h3><p>Look for clear methods, suitable comparisons, enough detail to inspect the work, and open data or code where appropriate. Check limitations, funding, and ethics disclosures.</p></article>
    </div>
    <ol className="guide-check-steps">
      {journalChecks.map(({ name, body, links }) => <li key={name}>
        <div><h3>{name}</h3><p>{body}</p><div className="guide-links">{links.map(([label, url]) => <External key={url} href={url}>{label}</External>)}</div></div>
      </li>)}
    </ol>
    <div className="guide-callout">
      <h3>Look at what each citation says</h3>
      <p>A cited paper may have been supported, questioned, or mentioned in passing. Read the surrounding text and look for independent corroboration. An empty notice or comments search leaves the paper’s reliability open.</p>
      <External href="https://sfdora.org/read/">DORA guidance on assessing research</External>
    </div>
  </section>;
}

function ConferenceCheck({ onConferences, checked, onToggle, onReset }: { onConferences: () => void; checked: string[]; onToggle: (item: string) => void; onReset: () => void }) {
  return <section className="guide-chapter" aria-labelledby="guide-conferences">
    <h2 id="guide-conferences">Before you submit, register, or travel</h2>
    <p className="guide-intro">A call for papers (CFP) is an invitation to send work. It lists what to submit and when. Use alert directories to find leads, then confirm the details with the university, society, or publisher that runs the event.</p>
    <div className="guide-metric-grid">
      <article className="guide-card"><span className="guide-icon"><CalendarDays size={23} aria-hidden="true" /></span><h3>Submission deadline</h3><p>The last date to send the requested abstract or paper. Check the exact time and time zone before adding a reminder.</p></article>
      <article className="guide-card"><span className="guide-icon"><Presentation size={23} aria-hidden="true" /></span><h3>Conference dates</h3><p>The days the event takes place. Registration and final manuscript deadlines may fall on separate dates.</p></article>
    </div>
    <fieldset className="guide-checklist">
      <legend>Check one event</legend>
      <p role="status">{checked.length} of {conferenceChecks.length} checks complete.</p>
      {conferenceChecks.map(item => <label key={item} className="guide-check-row">
        <input type="checkbox" checked={checked.includes(item)} onChange={() => onToggle(item)} /><span>{item}</span>
      </label>)}
      <p>For an indexing claim, check the exact edition and proceedings title. A previous edition or a promise to submit proceedings to an index leaves coverage for the new edition uncertain.</p>
      <External href="https://thinkcheckattend.org/check/">Think. Check. Attend. full checklist</External>
      {checked.length > 0 && <button type="button" className="button secondary small" onClick={onReset}>Reset checklist</button>}
    </fieldset>
    <button type="button" className="button" onClick={onConferences}>Explore upcoming conferences <ArrowRight size={16} aria-hidden="true" /></button>
  </section>;
}

export function ResearchGuide({ onStart, onConferences, embedded = false }: { onStart: () => void; onConferences: () => void; embedded?: boolean }) {
  const [chapter, setChapter] = useState<typeof chapters[number]['id']>('formats');
  const [checked, setChecked] = useState<string[]>([]);

  function toggleCheck(item: string) {
    setChecked(previous => previous.includes(item) ? previous.filter(value => value !== item) : [...previous, item]);
  }

  return <div className="research-guide">
    {!embedded && <header className="guide-hero">
      <div><span className="eyebrow">RESEARCH GUIDE</span><h1>Make sense of scholarly research</h1><p>Learn what you’re looking at, what to read first, and how to decide whether a paper or conference belongs in your plans.</p></div>
      <button type="button" className="button secondary" onClick={onStart}>Try the starter exercise <ArrowRight size={16} aria-hidden="true" /></button>
    </header>}
    <nav className="guide-nav" aria-label="Research guide chapters">
      {chapters.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-pressed={chapter === id} onClick={() => setChapter(id)}><Icon size={17} aria-hidden="true" />{label}</button>)}
    </nav>
    {chapter === 'formats' && <Formats />}
    {chapter === 'read' && <Reading />}
    {chapter === 'quality' && <Quality />}
    {chapter === 'conferences' && <ConferenceCheck onConferences={onConferences} checked={checked} onToggle={toggleCheck} onReset={() => setChecked([])} />}
  </div>;
}
