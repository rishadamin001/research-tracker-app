import { type ReactNode, useState } from 'react';
import { BookOpen, Compass, FlaskConical, Wrench, ShieldCheck, ListChecks, ArrowRight, Search, FileText } from 'lucide-react';
import { PracticeLessons } from './PracticeLessons';
import { ResearchGuide } from './ResearchGuide';
import type { OpenSection } from './ResearchPlannerTypes';
import { ResearchPlannerJourney } from './ResearchPlannerJourney';
import { ResearchPlannerDataGuide } from './ResearchPlannerDataGuide';
import { ResearchPlannerToolkit } from './ResearchPlannerToolkit';
import { ResearchPlannerPublishingChecks } from './ResearchPlannerPublishingChecks';
import './research-planner.css';

const sections = [
  { id: 'practice', label: 'Practice lessons', icon: BookOpen },
  { id: 'journey', label: 'Your research journey', icon: Compass },
  { id: 'data', label: 'Data, surveys & analysis', icon: FlaskConical },
  { id: 'toolkit', label: 'Toolkit', icon: Wrench },
  { id: 'integrity', label: 'Publishing checks', icon: ShieldCheck },
  { id: 'basics', label: 'Research basics', icon: BookOpen },
  { id: 'plan', label: 'My plan', icon: ListChecks },
] as const;

export function ResearchPlanner({ onStart, onConferences, openSection, workbench }: {
  onStart: () => void;
  onConferences: () => void;
  openSection?: OpenSection;
  workbench?: ReactNode;
}) {
  const [section, setSection] = useState<typeof sections[number]['id']>('practice');
  const [showIntroduction, setShowIntroduction] = useState(false);
  function chooseSection(id: typeof section) { setSection(id); setShowIntroduction(false); }
  return <div className="research-planner">
    <div className="page-heading"><div><h1>Research planner</h1><p>Short examples and actions that lead back into your project.</p></div><button type="button" className="text-button" aria-expanded={showIntroduction} onClick={() => setShowIntroduction(!showIntroduction)}>{showIntroduction ? 'Hide introduction' : 'Show introduction'}</button></div>
    {showIntroduction && <header className="planner-hero">
      <div>
        <h2>Plan and develop a research paper</h2>
        <p>Find your next step, see an example, and keep your plan beside the work. Start anywhere and come back as your project takes shape.</p>
        <div className="button-row">
          {workbench && <button type="button" className="button" onClick={() => chooseSection('plan')}>Open my plan <ArrowRight size={16} aria-hidden="true" /></button>}
          <button type="button" className="button secondary" onClick={onStart}>Try the starter exercise <ArrowRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
      <ol className="planner-hero-map" aria-label="Three phases of a research project">
        <li><Search size={18} aria-hidden="true" /><span><small>01 · DEFINE</small><strong>Ask a question</strong></span></li>
        <li><FlaskConical size={18} aria-hidden="true" /><span><small>02 · INVESTIGATE</small><strong>Gather evidence</strong></span></li>
        <li><FileText size={18} aria-hidden="true" /><span><small>03 · SHARE</small><strong>Write and revise</strong></span></li>
      </ol>
    </header>}
    <nav className="planner-nav" aria-label="Research planner sections">
      {sections.filter(item => item.id !== 'plan' || workbench).map(({ id, label, icon: Icon }) =>
        <button key={id} type="button" aria-pressed={section === id} onClick={() => chooseSection(id)}><Icon size={17} aria-hidden="true" />{label}</button>
      )}
    </nav>
    {section === 'practice' && <PracticeLessons openSection={openSection} />}
    {section === 'journey' && <ResearchPlannerJourney openSection={openSection} />}
    {section === 'data' && <ResearchPlannerDataGuide openSection={openSection} />}
    {section === 'toolkit' && <ResearchPlannerToolkit />}
    {section === 'integrity' && <ResearchPlannerPublishingChecks openSection={openSection} />}
    {section === 'basics' && <ResearchGuide onStart={onStart} onConferences={onConferences} embedded />}
    {section === 'plan' && workbench}
  </div>;
}
