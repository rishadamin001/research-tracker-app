# Open sources and external services

Documentation review date: **7 November 2026**. Provider terms, allowances and external access can change. See [Provider capabilities](PROVIDER_CAPABILITIES.md) for implementation limits.

| Provider/resource | Implemented purpose | Access and fallback |
| --- | --- | --- |
| [OpenAlex](https://help.openalex.org/api/authentication/) | Work discovery, citation/reference lookup, DOI open-copy lookup and ISSN journal metadata | Public anonymous requests; no key or balance configured. [Basic paging](https://help.openalex.org/api/paging/) supports the bounded app workflow. Quota/backoff failures preserve available work and offer external source links. CC0 metadata do not confer PDF redistribution rights. |
| [Crossref](https://www.crossref.org/documentation/retrieve-metadata/rest-api/) | Explicit DOI bibliographic checks | Public REST access with no mandatory key. Metadata vary by deposit; a DOI does not certify indexing, quality, journal legitimacy or publication charges. |
| [Unpaywall](https://unpaywall.org/api) | Optional DOI-to-open-copy lookup in a separately operated gateway | Requires legitimate operator contact; not configured on the public Pages app. No retired general search endpoint is called. |
| [POSI](docs/JOURNAL-QUARTILES.md) | Bundled ISSN-matched journal quartiles | Edition/category/source accompany matches. Coverage is finite; a venue metric is not an article-quality verdict. |
| [DOAJ](https://doaj.org/), Scopus and Clarivate | Manual external venue checks | Outbound links, subject to each service's conditions; Atlas does not invent an indexing result. |
| [DMP Tool](https://dmptool.org/) and [OSF Registrations](https://osf.io/registries) | Optional external planning/preregistration handoffs | Local notes are not automatically sent. Atlas creates neither an OSF Project nor a registration. Core functionality does not require either account. |
| Official design, reporting and appraisal resources | Sourced guidance links | Applicability and selected editions are recorded in [Study planning](docs/STUDY-PLANNING.md); no full third-party checklist is copied. |

The app uses bundled publisher/tool marks or text fallbacks and system fonts. It has no live Google Fonts request. Logos identify their respective publishers/tools and do not imply affiliation or endorsement. See asset/source notes with the app resources.

Search keywords, filters or identifiers leave the browser only for the lookup the user requests. Ordinary hosting/connection metadata are handled by external providers under their policies. [Privacy](PRIVACY.md)

Open-copy metadata provide links, not permission to redistribute publisher PDFs. Atlas does not download, extract, host or proxy publisher PDFs. [Search continuation and source rationale](docs/SEARCH-CONTINUATION.md)
