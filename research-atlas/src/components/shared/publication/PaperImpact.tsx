import { metricNumber } from '@/lib/ranking';
import type { Paper } from '@/lib/model';
import { QuartileBadge } from './QuartileBadge';
import { PaperCosts } from './PaperCosts';

export function PaperImpact({ paper }: { paper: Paper }) {
  return <div>
    <div className="paper-rank-row">
      <QuartileBadge value={paper.journalQuartile} fallback={paper.venueType && paper.venueType !== 'journal' ? 'Non-journal venue' : undefined} />
      <span className="paper-citations"><strong>{paper.citedByCount == null ? '—' : metricNumber(paper.citedByCount)}</strong> citations{paper.citedByCount == null ? ' · count unavailable' : ''}</span>
    </div>
    <div className="chips">
      <span className="tag">Citation metadata: {['OpenAlex', 'Europe PMC', 'Crossref'].includes(paper.source) ? paper.source : 'source not recorded'}{paper.metricsRetrievedAt ? ` · retrieved ${new Date(paper.metricsRetrievedAt).toLocaleDateString()}` : ' · retrieval date not recorded'}</span>
      <span className="tag">Field-adjusted citations {paper.fwci == null ? 'unavailable' : `${metricNumber(paper.fwci)}×`}</span>
      {paper.inDoaj && <span className="tag">DOAJ</span>}
      {paper.workType && <span className="tag">{paper.workType.replaceAll('-', ' ')}</span>}
    </div>
    <PaperCosts paper={paper} />
    {paper.isRetracted && <p className="error">The recorded source flags this work as retracted. Check the publisher’s notice.</p>}
  </div>;
}
