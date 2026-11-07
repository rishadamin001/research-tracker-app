# Conditional methods and data planning

The methods planner is deterministic and runs locally. It uses user-entered knowledge goal, unit of analysis, evidence access, measurement/interpretation, causal intent, intervention feasibility, ethics assessment and resource limits. It does not infer a methodology from a topic or discipline.

Missing or unresolved essential inputs return **More information is needed**, with no candidate design. When enough context is recorded, Atlas offers conditional starting points, rationale and unresolved requirements. The user must explicitly choose a draft or write their own justification. Existing chosen designs are never replaced automatically. A causal question without a feasible intervention requires identification review; a simple association is not relabelled as a causal result. Ethics consultation does not become approval.

`Project.methodContext` and `Project.structuredDmp` are optional additive fields. Older backups retain their original `dataPlan` notes. Structured DMP exports include those notes and all 13 prompts, with unanswered fields shown as **Not yet specified**. Protocol exports include the structured plan when present. Filling prompts records planning activity and does not certify compliance or methodological validity.

## Guidance registry

Registry 1.0 separates study design, reporting and critical appraisal. Each record includes scope, source URL, edition/version description and check date. These are selected starting resources, not an exhaustive multidisciplinary standard catalogue. Living sources must be rechecked when used. No checklist text or third-party PDF is copied into Atlas.

Sources checked 7 November 2026:

- [CDC Field Epidemiology Manual: designing and conducting analytic studies](https://www.cdc.gov/field-epi-manual/php/chapters/design-conduct-analyze-field-studies.html), chapter dated 8 August 2024. Scope is field epidemiology, not all academic designs.
- [JBI Manual for Evidence Synthesis](https://jbi-global.atlassian.net/wiki/spaces/MANUAL/overview), a living manual with design-specific synthesis guidance.
- [EQUATOR reporting library](https://www.equator-network.org/reporting-guidelines/) and [PRISMA 2020](https://www.prisma-statement.org/prisma-2020). EQUATOR explicitly distinguishes reporting guidance from design and quality appraisal.
- [STROBE](https://www.strobe-statement.org/), for observational epidemiology, explicitly not a study-design prescription or quality instrument.
- [SPIRIT / CONSORT](https://www.consort-spirit.org/), 2025 protocol/results reporting guidance for randomized trials.
- [RoB 2](https://www.riskofbias.info/welcome/rob-2-0-tool), 22 August 2019 parallel-trial version with separate cluster/crossover variants.
- [JBI critical appraisal tools](https://jbi.global/critical-appraisal-tools), design-specific tools; versions vary. Direct automated access was restricted, while the official search index exposed the scope and current design-specific collection.
- [DMP Tool](https://dmptool.org/), free community-supported data-management and sharing plans with funder templates.
- [COS preregistration guidance](https://www.cos.io/initiatives/prereg), a plan submitted to a registry before the relevant study activities. [OSF Registrations](https://osf.io/registries) is an optional external handoff; direct automated access was restricted. Atlas does not call an OSF API, create an OSF Project, upload data, or submit a registration.

These external services are links only. Using an external service is separate from saving local Atlas notes. The core workflow requires neither an account with those services nor paid software.

## Verification

`tests/study-planning.test.ts` covers abstention, causal identification conditions, noncausal and qualitative routing, DMP export, old-backup preservation, and distinct sourced registries. `tests/e2e/study-planning.spec.ts` covers the user-visible route, explicit draft choice, local persistence, export and mobile overflow. See `TESTING.md` for the actual release check results.
