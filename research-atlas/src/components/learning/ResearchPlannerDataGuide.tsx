import { useState } from 'react';
import { Layers3, BarChart3, ListChecks, LockKeyhole, Database, MessageSquareText, ArrowDownRight } from 'lucide-react';
import { dataRoutes, dataSteps } from '@/lib/planner-guide';
import { External } from '@/components/shared/External';
import type { OpenSection } from './ResearchPlannerTypes';
import { ResearchPlannerStepExplorer } from './ResearchPlannerStepExplorer';

const dataIcons = [Layers3, BarChart3, ListChecks, LockKeyhole, Database, BarChart3];

const routeIcons = [BarChart3, MessageSquareText, Layers3, Database];

export function ResearchPlannerDataGuide({ openSection }: { openSection?: OpenSection }) {
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
    <ResearchPlannerStepExplorer steps={dataSteps} icons={dataIcons} label="Steps for data collection and analysis" openSection={openSection} />
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
