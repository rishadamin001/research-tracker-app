import { External } from '@/components/shared/External';

export function PaperOrderHelp() {
  return <details>
    <summary>What does this order measure?</summary>
    <p>Quartile order matches the journal’s ISSN to the POSI citation ranking. Q1 comes first, then Q2–Q4, then venues without a match. Ties use the recorded citation count. Counts from different providers cover different indexes. Citation frequency does not measure a study’s methodological quality. Each badge gives the POSI subject and edition. SJR and JCR use separate ranking systems. Use venue rank alongside the paper’s relevance and methods.</p>
    <p>Field-adjusted citations compare a work with similar OpenAlex records. A value of 1× means the expected citation count.</p>
    <p>Date sorting uses the recorded publication date when available, then the year. Price sorting puts unknown amounts last. Journal publishing fees are compared using available USD equivalents.</p>
    <External href="https://posi.panorama-sg.com/rankings/">POSI journal citation rankings</External>
    <External href="https://help.openalex.org/data/works/citations/">OpenAlex citation metrics</External>
  </details>;
}
