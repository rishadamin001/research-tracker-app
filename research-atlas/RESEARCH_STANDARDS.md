# Research standards

Atlas separates **study-design guidance**, **reporting guidance** and **critical appraisal**. Registry **1.0** in `src/lib/study-planning.ts` records each selected resource's source URL, scope, edition and check date. It is a starting collection, not a comprehensive or independently reviewed multidisciplinary catalogue. The app neither performs risk-of-bias appraisal nor converts checklist completion into a quality score.

The methods router asks about knowledge goal, unit of analysis, evidence access, measurement/interpretation, causal intent, intervention feasibility, ethics and resources. Missing or unresolved essentials produce **More information is needed** with no candidate design. Other outcomes remain conditional and require human review; a topic alone never selects methodology. A user explicitly chooses any draft starting point, and an existing design is not automatically overwritten.

## Applicability

- Design resources include the CDC Field Epidemiology Manual (health-specific) and JBI's living evidence-synthesis manual.
- Reporting resources include PRISMA 2020 for systematic reviews, STROBE for appropriate observational epidemiology, CONSORT/SPIRIT 2025 for randomized trial results/protocols, and EQUATOR's directory for other designs and extensions.
- Appraisal resources include RoB 2 and design-specific JBI tools. Users must choose the appropriate variant and current version.
- Earlier conditional links to COREQ/SRQR, PRISMA-ScR, TRIPOD+AI, ARRIVE, CHEERS, CARE and STARD remain references where applicable. They are not implemented item-by-item reporting audits.
- Legal/textual interpretation, artifact design and general surveys have no universal health-reporting checklist assigned.

The local structured DMP supports thirteen planning areas and exports a draft. DMP Tool provides an optional external route for funder-specific requirements; OSF Registrations is an optional preregistration handoff. Atlas does not upload a plan, create a registration or depend on OSF Projects.

Ethics approval, suitable design, sampling/power, inference and publication require appropriate disciplinary and institutional oversight. Completing an Atlas form supplies neither approval nor a guarantee of validity, novelty or acceptance. Source/version details and coverage limits are recorded in [Study planning](docs/STUDY-PLANNING.md). No third-party full checklist text is reproduced.
