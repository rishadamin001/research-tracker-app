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
- [x] Exercise the responsive layouts, accessibility, recovery and end-to-end research workflow.
- [x] Record comparison screenshots, measured bundle sizes and device coverage.
- The production revision and verification run are recorded after deployment.

## Results

A synthetic undergraduate project investigated sleep quality and academic performance. A scripted Brave session took 61 seconds on this laptop. It used a fictional OpenAlex record to check reproducible source screening, locators, interpretation, citations and DOCX contents. Europe PMC returned two pages of 20 distinct real results. The user flow saved a real source and recorded a decision. Crossref also returned real titles. An encrypted backup opened for verification and restored the complete project in a fresh profile. Starting a project from beginner exploration retains its sources. Discover also offers a direct path to create a project from a paper.

The [desktop and mobile baseline](before/) and [redesigned interface](after/) show the implemented application. [Desktop spotlight](after/spotlight-1440.png) · [Mobile spotlight](after/spotlight-390.png) · [Mobile filters](after/filters-390.png) · [New project](after/new-project-1440.png)

Local production measurements used the same Brave executable, a loopback server, five fresh profiles per build and blocked service workers. The [raw results](performance-and-layout.json) include cold Discover readiness and compressed asset sizes. Median cold Discover readiness was 376 ms before and 407 ms after. Main JavaScript increased from 268,604 to 274,672 gzip bytes and CSS from 15,656 to 17,276. The bibliography bundle stayed at 121,664 bytes. These short local runs do not establish a perceptible change on mobile networks.

All seven spotlight targets and the filter drawer were exercised at 320, 360, 390, 768, 1280 and 1440 CSS pixels. These checks detected no horizontal overflow or browser errors. No participants were recruited. The [short usability script](USABILITY.md) records assistance, time and navigation errors for future sessions.

Automated WCAG A/AA scans covered the welcome dialog, tour coach, filter drawer and search tips at 390 and 1440 pixels. The full-page Learn scan found six buttons whose screen-reader names omitted visible text. The lesson cards now derive their names from their visible contents. Local tests verified lesson selection, review progress, keyboard focus and reopening unfinished project dialogs. Dark-mode testing also found low contrast on the document-type and source-collection labels. Both now use the workspace text color. Repeated [light](overlay-accessibility.json) and [dark](dark-overlay-accessibility.json) overlay scans at both sizes found no violations.

An existing 0.12.0 project with a saved question draft was upgraded in place on the same origin. All exported project fields matched, the returning user skipped the first-visit invitation, and the saved project reopened offline on 0.13.0.

On a physical OnePlus 7T running Android 12, the tour fit the 384 × 752 portrait and 829 × 283 landscape viewports. Android Back dismissed it. The software keyboard appeared for project entry and the filter drawer kept the selected year. In an isolated local profile Chrome downloaded a real backup file, Atlas previewed it and imported a separate project copy. After taking the browser offline, the original project reopened. The app uses the existing Android wrapper and this web release requires no APK update. [Phone screenshot](after/spotlight-oneplus.png) · [Device check results](oneplus.json)

The live provider monitor encountered intermittent upstream errors. In one run Crossref returned 39 distinct records over two pages after a failed browser request. The strict monitor recorded the console error. Europe PMC also timed out on individual attempts. Retrieved records remain available during retries.

The authoritative check and deployment records are linked from [the release pull request](https://github.com/rishadamin001/research-tracker-app/pull/12). After publication, the public page exposes its full Git commit in the `atlas-build-commit` metadata.
