import { BarChart3, FileText } from 'lucide-react';
import { External } from '@/components/shared/External';

const journalChecks = [
  { name: 'Confirm the journal’s identity', body: 'Match the journal’s ISSN, publisher, and official website. If it claims to be indexed, search the relevant index for that exact title and check its coverage dates.', links: [ ['ISSN Portal', 'https://portal.issn.org/'], ['Web of Science Master Journal List', 'https://mjl.clarivate.com/home'], ['Scopus Sources', 'https://www.scopus.com/sources.uri'], ['DOAJ', 'https://doaj.org/'] ] },
  { name: 'Read the submission rules', body: 'Check the journal’s scope, editors, review process, and fees. Read a few recent articles. A promise of guaranteed acceptance deserves a closer look.', links: [ ['Think. Check. Submit.', 'https://thinkchecksubmit.org/journals/'] ] },
  { name: 'Compare like with like', body: 'A quartile groups journals by rank within a subject and year. Q1 is the highest group. Record the ranking service, subject, and year because a journal can have different quartiles across categories.', links: [ ['SCImago Journal & Country Rank', 'https://www.scimagojr.com/journalrank.php'] ] },
  { name: 'Check the paper’s current record', body: 'Search the paper’s DOI, a persistent identifier, for corrections or a retraction. Open the publisher record and read any comments or notices in context.', links: [ ['Crossmark', 'https://www.crossref.org/crossmark/'], ['Retraction Watch data at Crossref', 'https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/'], ['PubPeer', 'https://pubpeer.com/'] ] },
];

export function ResearchGuideQuality() {
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
