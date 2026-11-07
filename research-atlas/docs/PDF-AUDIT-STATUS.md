# PDF audit implementation status — 0.6.0

This matrix maps the supplied **Research Atlas Competitive Audit and Prototype Improvement Blueprint** to the current source. It covers the PDF's feature comparison, first-five-minute design, data/security requirements, and Releases 1–5. The PDF is a product reference; external claims and suggested technical mechanisms are checked against the actual implementation and primary documentation.

**Implemented** means the described source behavior exists; it does not by itself mean all release gates or live services passed. **Partial** records narrower behavior or outstanding acceptance criteria. **Not configured** identifies a deployment/account/domain prerequisite. **Untested** means no completed verification is claimed. See [Testing](../TESTING.md) for actual commands, browser coverage, results, and production verification. This document deliberately does not supply test counts or assert that a pending deployment succeeded.

## Release 1: trustworthy beginner entry

| PDF requirement | Status | Implemented scope and remaining limit |
| --- | --- | --- |
| Three primary homepage intentions | Implemented | Home offers “I’m new to research”, “I already have a topic or question”, and “I need to find papers”. Disciplines, conferences, saved projects and the planner are secondary paths. `Atlas.tsx`. |
| Short beginner journey with worked example and visual map | Implemented | The starter shows Interest → Question → Evidence → Design → Study → Writing stages, a worked topic/question, a draft-question exercise, and the explanation that research can loop back. No detached Foundations course is restored. |
| Minimal initial project form | Implemented | Working title, broad discipline, what the user wants to understand, and experience; later profile details remain editable. Unknown choices are allowed. |
| Next useful action rather than a research-quality percentage | Implemented | The roadmap offers its next task and preserves flexible stage navigation. Recorded progress is described as a planning aid. |
| Contextual Understand / See / Do / Review lessons | Implemented, bounded editorial scope | ContextGuide supplies these four parts beside all ten project stages. This is contextual guidance rather than a course catalogue; independent disciplinary review remains pending. |
| Adaptive question framing | Partial | Question, objectives, setting/corpus and feasibility notes are editable. Richer goal/evidence/causal/ethics routing is in Methods; question creation is not a complete adaptive interview. |
| Public Privacy, Terms and Support pages | Implemented | `#privacy`, `#terms`, `#support` and repository documents explain local data, transmissions, deletion, no analytics/advertising, limitations and recovery. Support uses public GitHub issues; no private support email or invented operator address is configured. |
| Storage health, persistence request and backup reminder | Implemented | Privacy shows storage estimates, protection status and optional persistence request. Backup status records a download start, not proof that a file was saved successfully. |
| Backup v2 envelope and integrity | Implemented | Format, backup version 2, app version, timestamp, source origin, project count, validated preferences and SHA-256 checksum. Project/IndexedDB schema stays version 1 with additive fields. Checksum detects accidental changes, not authenticity. [Details](BACKUP-MIGRATION.md). |
| Legacy migration, import preview and non-destructive restore | Implemented | Valid version 1 backups remain supported; version 2 verifies schema/checksum/counts. Preview reports reference/event/claim counts; imported projects receive new IDs. Invalid input is rejected before project mutation. |
| Transactional local writes and failure recovery | Implemented | IndexedDB writes remain transactional; failed saves expose recovery export. Browser storage is not a central backup or encrypted vault. |
| Security review: imports, URLs, user text and CSV | Implemented, bounded | Typed schemas and size limits validate imports; unsafe navigation schemes are rejected; user text renders as text; CSV cells neutralize formula prefixes. This is targeted protection, not a full independent security audit. |
| Five-minute usability and accessibility release gates | Untested as a timed human study | Beginner/browser journeys and automated checks exist. No measured novice usability study, complete assistive-technology audit, or universal five-minute completion claim is made. |

## Release 2: reproducible literature workspace

| PDF requirement | Status | Implemented scope and remaining limit |
| --- | --- | --- |
| Multi-page search with visible progress and intentional stop | Implemented with bounded basic paging | Manual Load next page retrieves at most 5 × 20 records (100 per run). Stop/resume and provider-end/app-limit states are explicit. No owner key or balance is attached. [Provider rationale](SEARCH-CONTINUATION.md). |
| Cursor pagination and stable exhaustive search | Partial | The public app uses documented basic pages, not cursor pagination. Relevance results can change between pages; display IDs are deduplicated. Exhaustive/comprehensive coverage is not claimed. Free-key cursor/account setup remains unconfigured. |
| Source-specific query and page provenance | Implemented | Entered/executed query, filters, provider/default relevance, parser version, timestamps, page attempts/counts, result IDs, reported total, errors and available quota headers are recorded. The provider supplies no response-schema version; Atlas does not fabricate one. |
| Query transparency / unsupported Boolean operators | Implemented | Unsupported Boolean/operator syntax is rejected with an explanation rather than silently translated or removed. Keyword search goes to OpenAlex only on user action. |
| Search history and CSV/JSON exports | Implemented | Project logs travel with backups. Standalone search keeps the latest 50 runs in browser localStorage, with export and clear-history controls. Standalone history is not part of project backups. CSV summarizes; JSON preserves structured runs. |
| Manual refresh and newly discovered records | Partial | Refresh compares retrieved IDs against the last successful matching-query/filter snapshot. New-to-snapshot records can be old publications. No background monitoring or guaranteed new-publication alerts run. |
| Free quota, Retry-After, timeout/offline/provider failure | Implemented, provider-dependent | No automatic retry loop; known backoff blocks premature requests, pages are user requested, and earlier visible results survive a failed page. Anonymous shared quota/availability remain external limits. |
| Cached results with age | Partial | Retrieval times are shown. Prior results remain in the open search view on failure; persisted query history does not restore full result cards. No persistent result cache is claimed. |
| Exact DOI and conservative fuzzy duplicate detection | Implemented | Normalized DOI is exact evidence; normalized title/year/first-author similarity produces review candidates only. Import previews and in-project duplicate review never silently merge near matches. |
| Side-by-side keep A / keep B / keep both / merge and undo | Implemented, bounded | Screening includes a duplicate review workspace. Actions keep provenance and archive removed records; merges retain supported notes/events/claims. Undo preserves subsequent edits. Review history is capped at 50 per project. |
| Shared reference entity and version relationships across projects | Not implemented | References remain project records. Duplicate archives are an audit/recovery mechanism, not a global reference library or formal preprint/published-version graph. |
| RIS/BibTeX interoperability and citation keys | Implemented, recognized-field scope | Existing exchange retains recognized bibliographic fields, DOI, author lists and citation keys, with round-trip fixtures. Arbitrary custom fields, attachments and complete TeX parsing are outside scope. [Exchange guide](REFERENCE-EXCHANGE.md). |
| Zotero handoff | Partial | Export RIS/BibTeX for import into Zotero. Atlas has no Zotero account, synchronization or live word-processor citation integration. |

## Release 3: evidence and synthesis

| PDF requirement | Status | Implemented scope and remaining limit |
| --- | --- | --- |
| Title/abstract versus full-text screening and reasons | Implemented | Screening events retain stage, reviewer, criterion, decision and reason; history remains visible. The current paper decision is the latest working decision. Separate collaborative/blind review queues are not implemented. |
| Counts derived from screening records | Partial | Existing library summary follows recorded current decisions; dated stage events retain the audit trail. A complete PRISMA flow, stage-by-stage review adjudication and multi-reviewer reconciliation are not supplied. |
| Evidence level, source locator, interpretation and review status | Implemented | Claims distinguish metadata, abstract, full text and user observation; locator and review status are explicit. Exports preserve source, evidence level and location. Human authors supply and verify claims. |
| Field templates by study type and quotations as proof | Partial | Common extraction fields and typed claim categories exist. A comprehensive study-type extraction-template catalogue and automatic quotation/full-text verification do not. |
| Gap candidate states and supporting/conflicting evidence | Implemented, scoped | Idea, search underway, evidence-supported candidate, human-reviewed candidate, contradicted and needs-update states exist. Supported states require a reviewed supporting non-metadata claim. Supporting/challenging evidence is visible; the user still judges adequacy. |
| Empty search cannot prove a gap | Implemented | Empty-search guidance explicitly says it cannot establish a gap. No global novelty or universally verified-gap claim is generated. |
| Revised question preserves work and flags review | Implemented | Question revisions keep references and notes; affected stages and reviewed claims are marked for review. |
| Accessible related-paper discovery | Implemented, bounded | Explicit OpenAlex reference/citation lookups return at most 20 suggestions at a time with ranking/citations. The UI distinguishes suggestions from saved/screened evidence. This is separate from the local saved-library citation view. |
| Interactive discovery graph, topic clusters and continuous alerts | Not implemented | Existing saved-citation/timeline views remain. Live related-paper discovery is a list; no broad interactive graph or background monitor is added. |

## Release 4: study and publication planning

| PDF requirement | Status | Implemented scope and remaining limit |
| --- | --- | --- |
| Conditional methods router with abstention | Implemented | Goal, unit, evidence access, measurement/interpretation, causal intent, intervention feasibility, ethics and resources are explicit. Missing/unknown essentials produce no candidate. Suggestions carry rationale and conditions; existing chosen designs are preserved. [Study-planning guide](STUDY-PLANNING.md). |
| Distinct design/reporting/appraisal registries | Implemented, selected resources | Registry 1.0 records source, scope, edition and check date. Health/review-specific resources are labelled for scope; it is not a comprehensive independently reviewed multidisciplinary library. Reporting checklists do not become quality scores. |
| Generic structured DMP | Implemented | Thirteen prompts cover types, source, formats, volume, sensitivity, storage, backup, naming/versioning, documentation, access, retention, sharing and repository/licence. Markdown/protocol exports preserve original freeform notes. No raw confidential dataset is uploaded. |
| DMP Tool and OSF Registrations handoff | Implemented as outbound links | Optional official services open only on user action. Atlas does not create registrations, upload protocols or create an OSF Project. Completing an Atlas plan does not preregister a study or grant ethics approval. |
| Venue facts, warning signals and unknowns | Implemented, metadata/manual scope | Shortlist assessment distinguishes matched provider identity/provenance, concrete URL/title mismatch signals and unfinished checks. Indexing, fee waivers, legitimacy and acceptance are not automatically verified. |
| Quartile provenance and publisher identity | Implemented | POSI source, edition/year, subject and source link remain visible, with publisher marks where supported. Tooltip distinguishes venue metric from article quality; no proxy is called Scopus/SJR/JCR Q1. |
| Access status versus author publication fee | Implemented | Open copies/reading prices are separate from author APC estimates. Unknown fees stay unknown and price sorts place missing values last. |
| Current verified publisher fee/waiver workflow | Partial | OpenAlex list values retain source URL; ISSN metric lookups have retrieval dates. Manual notes record official checks. New lookup estimates carry retrieval timestamps; older imported estimates can lack dates. Structured verified publisher/waiver decisions remain incomplete. |
| Backward timeline, budgets, submission pack and reviewer responses | Implemented, user-authored | Existing project planner retains deadlines, budget, preflight, venue requirements, declarations and reviewer-reply exports. Templates are drafts, not institution/journal approval or submission services. |
| Academic content governance and expert review | Partial | Source links, dates, applicability notes and coverage limits are recorded. Independent disciplinary review and a comprehensive versioned content-governance process remain pending. |

## Release 5: domain and Android / Play readiness

| PDF requirement | Status | Implemented scope and remaining limit |
| --- | --- | --- |
| Keep GitHub source and the existing free public origin | Implemented | Existing GitHub Pages deployment workflow remains the target. No additional paid hosting or domain is provisioned. Consult deployment records for the actual released revision. |
| Versioned migration guide and origin-aware preview | Implemented | Backup v2 plus [migration instructions](BACKUP-MIGRATION.md) explain origin isolation and non-destructive transfer. Automated origin-transfer simulation is distinct from moving a real domain. |
| Old-origin announcement, destination-specific import and grace period | Not configured | There is no chosen new domain or migration schedule. The existing origin stays available; no immediate redirect is introduced. A real move needs destination verification and an announced recovery period. |
| New custom domain, DNS and HTTPS validation | Not configured | No domain registration, paid domain, DNS change or new-origin production verification is claimed. |
| Installable PWA and offline local shell | Implemented, bounded | Existing manifest, install controls and service worker remain. Previously loaded app/local projects can reopen offline; live scholarly lookup requires a connection. See actual browser verification in Testing. |
| Android Trusted Web Activity, package ID, signing key and asset links | Not configured | No permanent package ID, signing key, Digital Asset Links or signed Android bundle is created. These require a permanent origin and account/device decisions. |
| Physical Android/iPhone installation and full-screen launch | Untested | Pixel emulation is not a physical device. No physical-device or iPhone Safari/PWA verification is claimed. |
| Play listing, Data Safety, testers and approval | Not configured | No store publication, paid developer-account enrolment, store approval or billing step is performed. The app remains available through the free web/PWA route. |

## Cross-cutting constraints and verification

| PDF requirement | Status | Scope / evidence |
| --- | --- | --- |
| Zero required paid infrastructure / no paid AI APIs | Implemented | Core is deterministic React/TypeScript/Vite with local IndexedDB and public scholarly endpoints. No card, API balance, billing fallback, paid LLM, analytics or advertising is introduced. Provider policies can change; availability is not guaranteed. |
| No automatic disclosure of project/private data | Implemented, explicit feature scope | Searches send entered keywords/filters; DOI, ISSN and related-work actions send their needed identifiers. UI privacy text describes these transmissions. Local notes, manuscripts and DMP contents are not automatically uploaded. |
| Optional gateway bounds and safe upstreams | Implemented but unconfigured publicly | Gateway code uses fixed supported endpoints, bounded query/filter/page parameters, timeout and response-size limit. The public Pages app does not configure this gateway, an operator key, Unpaywall contact or paid service. |
| Crossref / Unpaywall integration | Partial by deployment | Public Crossref DOI checks and OpenAlex open-copy lookup work without a gateway. Unpaywall DOI resolution is optional gateway code and is not configured on the public app. No retired search endpoint or redistributed publisher PDF is used. |
| Fixture versus live checks | Implemented as separate workflows | Deterministic fixtures test behavior; live checks are recorded separately. Their results and time-sensitive limits belong in Testing and smoke reports. |
| Chrome, Firefox, WebKit and mobile engine coverage | Verification in Testing | Playwright configuration includes desktop Chromium, Pixel 7, optional Firefox and optional WebKit. Configuration alone is not evidence that any engine completed successfully. |
| axe scans and keyboard/dialog checks | Automated coverage, bounded | Specs cover top-level screens, keyboard focus and modal behavior. Automated success cannot replace a full WCAG conformance or screen-reader audit. Actual results belong in Testing. |
| 200%/400% zoom, NVDA, TalkBack, VoiceOver and physical devices | Untested / incomplete manual coverage | No full assistive-technology or physical-device sign-off is claimed. Responsive/emulated checks are narrower. |
| Large/empty/legacy/corrupted backup and cross-origin restore | Implemented test coverage | Unit/browser fixtures exist for integrity, malformed/oversize input, old fields, empty envelope, non-destructive import and origin transfer. See Testing for runs actually completed. No actual new-domain migration is claimed. |
| Offline, quota, provider failure and failed local writes | Implemented test coverage | Fixtures and recovery/offline journeys exist. Long-term provider reliability, browser eviction behavior and all real devices remain external limits. |
| Complete five-release commit/deployment sequence | Partial | This work is one coherent 0.6.0 improvement release. The PDF's proposed five-release programme is not described as five completed launches. The actual commit, deployment state and checks must be reported from verified release evidence. |
| Accounts, real-time collaboration, cloud sync, automatic PDF extraction and AI summaries | Deferred by design | No accounts or automatic cloud migration are added. No collaborative blind screening, automatic full-text extraction, AI generation, paid bibliometric data or paid model dependency is claimed. |

The remaining items are recorded explicitly rather than treating a feature label, checklist, configured test or successful build as proof of the full product claim.
