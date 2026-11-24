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
- [ ] Implement and exercise visual foundations and onboarding.
- [ ] Redesign Discover, beginner exploration, Learn and connected workspaces.
- [ ] Complete responsive, accessibility, recovery, user-journey and device checks.
- [ ] Record the release checks, comparison screenshots and deployment identity.
