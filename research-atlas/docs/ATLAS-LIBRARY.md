# Atlas Library — 0.7 foundation

The Library presents one searchable view over all references saved in local projects. It groups exact normalized DOI identities; when a usable DOI is absent, it uses the record identifier. Similar titles alone never combine records. An empty identifier does not combine otherwise unidentifiable records.

Each group shows its project relationships, available venue quartile with provenance, publisher mark, citations, date, reading access and author publication fee. Existing sorting rules apply to the displayed references. Search includes title, author, DOI, venue and tags; filters narrow by project or reading status. The UI mounts 20 groups per page.

One project copy supplies the displayed bibliography. If grouped project copies contain different bibliographic values, their original values remain inspectable under **Organize this reference**. Atlas does not silently reconcile bibliographic conflicts.

**Link reference** adds bibliographic metadata to another existing project. The destination starts unreviewed with empty project notes, extraction fields, screening events and evidence claims. The origin project title and link time are retained as local provenance. Existing target records are reused; identifier collisions with a different identity and full project libraries block the action.

Reading status and comma-separated tags explicitly apply across the currently linked copies. Notes, screening decisions and evidence interpretations remain project-specific. RIS/BibTeX exchange operates on the active project, so its preview and exports retain the existing reference-manager interoperability boundary.

The existing related-discovery control provides explicit earlier-reference and later-citation lookup. It sends only the needed OpenAlex identifiers after user action, keeps the 20-record limit and marks results as discovery suggestions. It does not convert related records into screened evidence automatically.

This is an evolutionary shared view, not a canonical independent reference store. Project records still contain compatible reference copies. A final copy can disappear when its project is deleted; export a backup before deleting work. Independent Library records, metadata reconciliation, attachments, cross-project note ownership and normalized ProjectReference storage remain later architectural work.

Unit fixtures cover normalized identities, title-only separation, link independence, collisions, limits, tag/status updates, filtering and rank ordering. The browser fixture covers link, reload, organization and project relationships. Actual completed verification is recorded in `TESTING.md`.
