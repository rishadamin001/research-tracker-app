# Evidence-linked Writing Studio

Writing Studio is a local drafting and traceability layer, not a replacement for a reference manager or a scientific review. It uses the same project references and evidence notes as Literature and Evidence Desk. No manuscript text is sent to an AI or document-conversion service.

## Section drafts and earlier manuscripts

Six stable sections hold independently editable text: Abstract, Introduction, Methods, Results, Discussion and Conclusion. Their labels and short prompts adapt to the selected quantitative, qualitative, mixed-methods or literature pathway. An unspecified pathway falls back to the existing research purpose. Changing the pathway changes labels without deleting section text, source links or earlier work.

The optional `writingStudio` project field records sections, citations and located evidence links. It is additive to version 1 project data and travels through existing v1/v2 backup handling. The original `manuscript` field remains separately editable as **Earlier freeform manuscript**. It is never silently parsed, overwritten or converted into invented evidence links. An explicit copy action can add that text to a selected section while retaining the original. Exports disclose and include both when both contain text.

Each section has a 20,000-character bound, and a draft supports 300 bibliography records and 400 evidence links. Insertions that exceed a bound fail before changing either text or references. Source selection shows at most 100 matching options at a time and can be narrowed by title, author, DOI or venue.

Blank or duplicate source identifiers cannot be used for a new traceable insertion; duplicate claim identifiers are also refused. Retained bibliography records are matched to the same publication identity rather than silently redirected to an unrelated work reusing an old source identifier.

## Citations and inspectable evidence

**Insert citation** adds a stable numbered marker and a bibliography snapshot. It does not assert that an individual finding has been checked. A source with the same normalized DOI reuses its bibliography number; its project evidence notes still retain their own source record IDs.

**Insert located evidence** inserts an author-entered source summary, numbered citation and location. It also retains the claim ID, source record ID, evidence level, summary, locator, interpretation, uncertainty, review state and link time. This is a snapshot of the researcher’s record, not a verified quotation or automatic extraction from a PDF. The original source and current evidence note remain accessible.

Source changes do not silently rewrite the draft. Review prompts identify missing sources or claims, excluded/retracted sources, changed evidence notes, metadata-only notes, unreviewed notes, changed bibliographic metadata, absent citation markers and missing located evidence in substantive sections. They inspect recorded fields only. They cannot discover every unsupported assertion, establish whether the author interpreted a passage correctly, or certify scientific quality. Methods based on the author’s own work may need explanation rather than an external citation.

The bibliography preserves metadata captured at insertion. A deliberate **Refresh reference metadata** action replaces that bibliography snapshot from the current saved source and records the refresh date. A Library correction can also refresh the linked bibliography in the selected project with the Writing Studio checkbox. Draft wording, citation numbers and evidence-note snapshots are retained. Removed references retain their bibliography and claim snapshots in the draft until the author explicitly removes a draft link or changes the project.

## Exports

- Markdown includes filled sections, an earlier freeform draft when present, the numbered draft bibliography and a labelled evidence traceability appendix.
- DOCX is a locally generated Office Open XML package containing text, headings, numbered references and the same appendix. It does not convert Markdown tables, equations or arbitrary rich formatting. Review formatting, page limits and publisher requirements in a document editor.
- **Format a bibliography** uses locally bundled CSL to preview and download APA 7, IEEE or Vancouver references. The output is plain text. When name parts are unavailable, it passes the recorded author names as literals. Draft manuscript sections retain their numbered citation markers. Use cited RIS or BibTeX in a reference manager for full-document citation styling. [Styles and attribution](CSL-SOURCES.md)
- Cited RIS and BibTeX contain bibliographic metadata without private evidence interpretations.
- Evidence-links JSON preserves citation and claim snapshots separately for inspection.

The evidence appendix and JSON can contain private notes. Review the complete file before sharing. A downloaded export is not an automatic submission to a publisher.

## Verification boundary

Unit coverage checks intentional insertion, metadata gaps, source/claim changes and removal, shared DOI numbering, independent project records, legacy preservation, bounds and backup round trips. Browser coverage checks a source-to-section link, reload persistence, Markdown/DOCX/RIS downloads, scoped accessibility and reflow. Consult [Testing](../TESTING.md) for completed release runs.

The minimal DOCX builder has been checked with an independent ZIP CRC validator and XML parser across all six package parts, including Unicode and citation text. On 17 November 2026, the 0.10.4 Writing Studio browser fixture downloaded a manuscript that opened read-only in Microsoft Word 16.0. Word exposed the numbered citation, source locator, bibliography and earlier draft text. The check covered one synthetic manuscript. Independent academic, visual formatting and physical-device reviews remain separate work.

Control characters and the U+FFFE/U+FFFF noncharacters that XML 1.0 cannot represent are omitted from DOCX text. Original project and Markdown text remain unchanged.
