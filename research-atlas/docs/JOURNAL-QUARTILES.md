# Journal quartile data

The literature and journal lists use the Panorama Open Scholarly Index (POSI) 2026 Citation Quartile release `ranking-2026-r1`, snapshot 2026-09-28. POSI assigns quartiles from a normalized citation indicator within its own subject categories. Q1 is the highest group in that category. A paper carries the quartile of its matched journal, together with the category and edition year. Provisional quartiles retain that label. Papers without an exact match can still be compared by their OpenAlex citation counts.

POSI's Citation Quartiles use a different dataset and method from SCImago SJR and Clarivate JCR. They describe the journal's citation profile in the stated edition. For formal academic evaluation, check the ranking system and year your institution requests. Read the [POSI methodology](https://posi.panorama-sg.com/methodology/) and [2026 ranking guide](https://posi.panorama-sg.com/rankings/).

## Attribution and processing

Panorama Open Scholarly Index (2026), *Journal Citation Rankings, `ranking-2026-r1`*, Panorama Scholarly Group Ltd. [Data downloads](https://posi.panorama-sg.com/datasets/) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Research Atlas compacts the provider's ranked rows and official subject taxonomy into eight static files in `public/data/`. It keeps the ISSNs, Citation Quartile, subject, and provisional status, and drops unrelated columns. The index validates ISSN check digits and leaves out identifiers assigned to conflicting journal records. Lookup uses the journal's ISSN-L first, then print or electronic aliases. The resulting release contains 84,750 ISSN aliases in 30 subject categories. Browser requests retrieve static files from the same origin and share the downloaded files across paper results.

To refresh, download the ranked CSV, subject taxonomy and corresponding manifest from [POSI datasets](https://posi.panorama-sg.com/datasets/), then run from `research-atlas/`:

```sh
python scripts/build-journal-quartiles.py citation-2026.csv psc.json citation-2026.json
```
