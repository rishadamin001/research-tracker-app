import { FileText, BookOpen, Presentation, ListChecks, ArrowRight } from 'lucide-react';
import { External } from '@/components/shared/External';

const formats = [
  { label: 'Research paper', type: 'A piece of work', icon: FileText, description: 'A written report that explains a research question, the evidence, and what the authors found. A paper can also synthesize evidence from earlier studies.' },
  { label: 'Academic journal', type: 'A place to publish', icon: BookOpen, description: 'An ongoing publication that collects articles on a topic. Its editors may ask experts to review submissions before publication.' },
  { label: 'Conference', type: 'An event', icon: Presentation, description: 'A scheduled gathering where researchers present work, discuss ideas, and meet others. A talk or poster may be accepted from a short abstract.' },
  { label: 'Conference paper', type: 'A written contribution', icon: ListChecks, description: 'A paper submitted to an event. Some conferences publish accepted papers in a collection called proceedings. The review process varies by event and submission type.' },
];

export function ResearchGuideFormats() {
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
