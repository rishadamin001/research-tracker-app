# Reference exchange

Open **My projects**, activate a project, and choose **Import reference file** to preview a UTF-8 `.ris`, `.bib`, or `.bibtex` file. The preview reports exact matches, records without titles, and possible duplicates. An import adds the confirmed references to the current project. Each file can contain up to 2,000 references and 1 MB of text, subject to the project's remaining reference capacity.

Atlas recognizes common bibliography fields for titles, authors, dates, venues, publishers, DOI, ISSN, ISBN, URL, and reference keys. The exchange preserves recognized OpenAlex work identifiers. BibTeX support includes braced and quoted values, field concatenation, and string abbreviations declared earlier in the file. TeX commands outside supported character escapes remain literal text. Attachments, custom bibliographic fields, and formatting rules are outside the exchange's scope. [Clarivate RIS format](https://support.clarivate.com/Endnote/s/article/EndNote-Directions-for-implementing-EndNote-Direct-Export?language=en_US) · [CTAN BibTeX](https://ctan.org/pkg/bibtex)

Exact matches use the canonical DOI or OpenAlex work ID. A similar title after normalization, a shared first-author surname, and publication years within one year flag a candidate for manual review. Select **Keep as a separate reference** to include a candidate. Both records retain their own metadata.

RIS and BibTeX exports contain citation metadata. Project JSON backups also preserve notes, evidence, screening, and planning data. File handling runs in the browser and requires no account or network request.
