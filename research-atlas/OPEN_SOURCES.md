# Open sources and external services

Implementation verification date: 2026-11-06. Provider policies can change.

| Provider | Purpose | Authentication / free access | Fallback |
|---|---|---|---|
| OpenAlex | Public work search | Basic keyless access; free key increases allowance. Official docs describe $1/day free usage for a key. CC0 metadata. | Stop on 429; official search link |
| Crossref | DOI bibliographic metadata | Public REST access, no mandatory key. Metadata availability varies; do not infer content licenses. | Error + DOI/source links |
| Unpaywall | DOI OA resolution | Free API with legitimate email contact; optional gateway only. Official ceiling 100,000 calls/day; not a capacity promise. | Feature reports unconfigured; existing OpenAlex OA links remain |
| Google Fonts | DM Sans/Manrope typography | Public stylesheet/font download; external request reveals normal connection metadata | System sans-serif fallback |
| DOAJ, Scopus, Clarivate | Manual journal checks | Outbound websites; access conditions vary | No inferred indexing result |
| Official guideline sites | Educational references | Outbound links; reuse terms apply to original material | No copied full checklist |

Official URLs: https://help.openalex.org/api/authentication/ ; https://help.openalex.org/access/pricing/ ; https://www.crossref.org/documentation/retrieve-metadata/rest-api/ ; https://data.unpaywall.org/products/api ; https://doaj.org/ .

Unpaywall general search was retired 18 September 2026; no code calls it. Legal OA links are supplied metadata, not permission to redistribute publisher PDFs. This application does not download or proxy PDFs.
