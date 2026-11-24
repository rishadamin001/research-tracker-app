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

Local production measurements used the same Brave executable, a loopback server, five fresh profiles per build and blocked service workers. The [raw results](performance-and-layout.json) include cold Discover readiness and compressed asset sizes. Median cold Discover readiness was 474 ms before and 483 ms after. Main JavaScript increased from 268,604 to 274,672 gzip bytes and CSS from 15,656 to 17,269. The bibliography bundle stayed at 121,664 bytes. These short local runs do not establish a perceptible change on mobile networks.

All seven spotlight targets and the filter drawer were exercised at 320, 360, 390, 768, 1280 and 1440 CSS pixels. These checks detected no horizontal overflow or browser errors. No participants were recruited. The [short usability script](USABILITY.md) records assistance, time and navigation errors for future sessions.

Automated WCAG A/AA scans covered the welcome dialog, tour coach, filter drawer and search tips at 390 and 1440 pixels. The full-page Learn scan found six buttons whose screen-reader names omitted visible text. The lesson cards now derive their names from their visible contents. Local tests verified lesson selection, review progress, keyboard focus and reopening unfinished project dialogs.

The connected OnePlus 7T on Android 12 loaded the USB-hosted 0.13.0 candidate. The welcome and first tour stop rendered at 384 × 752 CSS pixels without horizontal overflow. The screen lock interrupted the first attempt before visual rotation, Android Back, downloads and restore could be confirmed. Results from the earlier 0.12.0 native test are documented separately. The Android wrapper uses the existing hosted website. This update does not require a new APK.

The live provider monitor encountered intermittent upstream errors. In one run Crossref returned 39 distinct records over two pages after a failed browser request. The strict monitor recorded the console error. Europe PMC also timed out on individual attempts. Retrieved records remain available during retries.

The authoritative check and deployment records are linked from [the release pull request](https://github.com/rishadamin001/research-tracker-app/pull/12). After publication, the public page exposes its full Git commit in the `atlas-build-commit` metadata.
