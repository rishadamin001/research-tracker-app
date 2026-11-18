import { useState } from 'react';
import { BookOpen, FileText, ShieldCheck, CalendarDays, ArrowRight } from 'lucide-react';
import { ResearchGuideFormats } from './ResearchGuideFormats';
import { ResearchGuideReading } from './ResearchGuideReading';
import { ResearchGuideQuality } from './ResearchGuideQuality';
import { ResearchGuideConferenceCheck } from './ResearchGuideConferenceCheck';
import './research-guide.css';

const chapters = [
  { id: 'formats', label: 'Know the formats', icon: BookOpen },
  { id: 'read', label: 'Read a paper', icon: FileText },
  { id: 'quality', label: 'Check quality', icon: ShieldCheck },
  { id: 'conferences', label: 'Check a conference', icon: CalendarDays },
] as const;

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
    {chapter === 'formats' && <ResearchGuideFormats />}
    {chapter === 'read' && <ResearchGuideReading />}
    {chapter === 'quality' && <ResearchGuideQuality />}
    {chapter === 'conferences' && <ResearchGuideConferenceCheck onConferences={onConferences} checked={checked} onToggle={toggleCheck} onReset={() => setChecked([])} />}
  </div>;
}
