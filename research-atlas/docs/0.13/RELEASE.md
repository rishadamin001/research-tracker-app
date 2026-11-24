# Research Atlas 0.13.0 implementation record

## Baseline and scope

The working branch starts at b0e1cef, including the Android launcher fix. The public 0.12.0 build was released at e55bde8. Baseline Brave captures at 1440 × 900 and 390 × 844 cover Home, Discover, filters, Learn, and the New project dialog in [before](before/). Those flows completed without horizontal overflow or browser diagnostics. All 134 unit tests passed. The unchanged production build emitted 268.60 kB of gzipped main JavaScript, 121.66 kB of bibliography code and 15.66 kB of CSS.

| Status at intake | Scope |
| --- | --- |
| Implemented | Three scholarly providers, saved sort order, bounded pagination, project data and recovery, six exercises, citation formats, verified Android launcher |
| Needs redesign | Home hierarchy, mobile search controls, paper details, stage navigation, Learn cards, dialogs and save feedback |
| Missing | First-visit welcome, real-element spotlight, first-action guidance and accessible replay |
| Deferred by scope | Cloud accounts, conference ingestion, hosting changes |
| Requires owner action | Novice participant feedback, permanent Android identity, domain association and Play distribution |

## Implementation checklist

- [x] Capture the public baseline and measure the original bundle.
- [x] Implement and exercise visual foundations and onboarding.
- [x] Redesign Discover, beginner exploration, Learn and connected workspaces.
- [ ] Complete responsive, accessibility, recovery, user-journey and device checks.
- [ ] Record the release checks, comparison screenshots and deployment identity.

## Results

A synthetic undergraduate project investigated sleep quality and academic performance. A scripted Brave session took 61 seconds on this laptop. It used a fictional OpenAlex record to check reproducible source screening, locators, interpretation, citations and DOCX contents. Europe PMC returned two pages of 20 distinct real results. The user flow saved a real source and recorded a decision. Crossref also returned real titles. An encrypted backup opened for verification and restored the complete project in a fresh profile. Starting a project from beginner exploration retains its sources. Discover also offers a direct path to create a project from a paper.

The [desktop and mobile baseline](before/) and [redesigned interface](after/) show the implemented application. [Desktop spotlight](after/spotlight-1440.png) · [Mobile spotlight](after/spotlight-390.png) · [Mobile filters](after/filters-390.png) · [New project](after/new-project-1440.png)

Local production measurements used the same Brave executable, a loopback server, five fresh profiles per build and blocked service workers. The [raw results](performance-and-layout.json) include cold Discover readiness and compressed asset sizes. The measurements describe this laptop. They do not predict load times on a mobile connection.

All seven spotlight targets and the filter drawer were exercised at 320, 360, 390, 768, 1280 and 1440 CSS pixels. These checks detected no horizontal overflow or browser errors. No participants were recruited. The [short usability script](USABILITY.md) records assistance, time and navigation errors for future sessions.

The website delivers this interface to the existing Android wrapper. ADB listed no physical phone during the 0.13.0 check. The verified OnePlus installation and native download/restore results belong to 0.12.0. Android signing and origin association are separate owner decisions. Scholarly providers can still rate-limit or time out; existing retry and recovery behavior is preserved.

The authoritative check and deployment records are linked from [the release pull request](https://github.com/rishadamin001/research-tracker-app/pull/12). After publication, the public page exposes its full Git commit in the `atlas-build-commit` metadata.
