# Architecture

Static Next.js App Router root renders a client workspace. Domain records and safe import/export helpers live in src/lib/model.ts; IndexedDB access in storage.ts; provider normalization in providers.ts; editable curriculum/taxonomy/design rules in content.ts. Atlas.tsx composes overview, guided forms, literature, and contribution panels.

No server-rendered private data, central research-data database, commercial LLM, or authentication service. The optional gateway uses a fixed endpoint allowlist, origin checking, bounded queries/responses, a 12-second fetch timeout, no arbitrary URL proxy, no paid fallback, and no query logging in code. Origin checks do not constitute authentication or prevent quota abuse. Upstream free limits remain the enforcement boundary.

UI state is per-tab; IndexedDB contains a versioned workspace. Save writes are serialized. Corrupt/unreadable storage disables overwriting for that session and asks for backup. The app is not a multi-tab or collaborative editor. A future refactor can split Atlas panels into separate files without changing the domain model.

Static export was chosen deliberately over a full server framework runtime to minimize infrastructure and CPU requirements. D1/R2 are not used.
