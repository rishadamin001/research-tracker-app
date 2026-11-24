import { BookOpenText, CalendarDays, ScanText, Users } from 'lucide-react';
const parts = [
  {title:'Title', text:'What question is this about?', icon:BookOpenText},
  {title:'Authors', text:'Who carried out the work?', icon:Users},
  {title:'Date', text:'When was it published?', icon:CalendarDays},
  {title:'Abstract', text:'What did they study and find?', icon:ScanText},
];
export function PaperAnatomy() {
  return <details className="paper-anatomy"><summary>How to read a paper card</summary><dl>{parts.map(({title,text,icon:Icon})=><div key={title}><dt><Icon size={16}/>{title}</dt><dd>{text}</dd></div>)}</dl></details>;
}
