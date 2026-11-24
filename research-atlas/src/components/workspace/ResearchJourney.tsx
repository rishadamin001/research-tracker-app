import { BookOpen, ClipboardCheck, FilePenLine, Flag, Map, Search } from 'lucide-react';
import type { Project, Stage } from '@/lib/model';
import { taskStatus } from '@/lib/workflow';
import type { Navigate } from './project-navigation-types';
const stages = [
  {label:'Define',target:'question',icon:Flag}, {label:'Discover',target:'discover',icon:Search},
  {label:'Evaluate',target:'screen',icon:ClipboardCheck},{label:'Plan',target:'methods',icon:Map},
  {label:'Write',target:'writing',icon:FilePenLine},{label:'Publish',target:'publication',icon:BookOpen},
] as const satisfies readonly {label:string;target:Stage;icon:typeof Flag}[];
export function ResearchJourney({project,go}:{project:Project;go:Navigate}){
  return <nav className="research-pathway" aria-label="Research journey">{stages.map(({label,target,icon:Icon})=><button type="button" key={target} onClick={()=>go(target)}><Icon size={17}/><strong>{label}</strong><small>{taskStatus(project,target)}</small></button>)}</nav>;
}
