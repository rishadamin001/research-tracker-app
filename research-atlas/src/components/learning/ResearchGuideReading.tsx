import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { External } from '@/components/shared/External';

const paperSections = [
  { name: 'Abstract', question: 'Is this paper relevant?', note: 'Skim the question, method, and main finding. Use the summary to decide whether to read further, then check the details in the paper.', example: 'We interviewed twelve students about why they use paper or digital notes.' },
  { name: 'Introduction', question: 'What were the authors trying to answer?', note: 'Look for the problem, what other researchers have found, and the specific question or objective.', example: 'We wanted to know what makes a note-taking tool practical during lectures.' },
  { name: 'Methods', question: 'How did they do the work?', note: 'Find out who or what was studied, how evidence was collected, and how the authors analyzed it.', example: 'We invited twelve students from one course and grouped recurring ideas from their interviews.' },
  { name: 'Results', question: 'What did they find?', note: 'Read the tables, figures, and findings. Look for how large a difference was and how uncertain the estimate is, where relevant.', example: 'Some students chose paper because it was quicker for sketches. Others chose digital notes because they were easy to search.' },
  { name: 'Discussion', question: 'How far does the evidence go?', note: 'Compare the authors’ interpretation with the results. Note limits, alternate explanations, and which people or places the findings apply to.', example: 'We studied one course. A survey across courses could test how common these preferences are.' },
  { name: 'References', question: 'Where can I check the evidence?', note: 'Follow important citations to the original sources. Check the cited passage to see what it actually supports.', example: 'Open the earlier study that the authors cite for their interview approach and compare how it was used.' },
];

export function ResearchGuideReading() {
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
