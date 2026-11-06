# Data model

A version 1 backup contains an array of projects. Existing records remain readable through schema defaults. Projects store profile, topic, question, objectives, design and ethics notes, analysis plans and records, manuscript, and publication candidates. Each project keeps its own reference library, search sessions, review flags, and timestamped decisions.

A reference has a provider ID, optional DOI, title, authors, year, source, and access URLs. The same reference holds its screening decision and reason, extracted methods, findings, limitations, evidence locator, and notes. Optional OpenAlex reference IDs support a directed view of links between saved works. Saving a matching ID or DOI does not create a new row.

Task status derives from recorded artifacts. Revising a question flags started downstream tasks and logs the prior wording when flags are added. Existing evidence remains available for review. Import makes new project copies, retaining their reference relationships. Legacy lesson IDs remain accepted for compatibility.
