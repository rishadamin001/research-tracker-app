# Citation formatting sources

Research Atlas formats standalone, plain-text bibliography entries offline using Citeproc JS and the Citation Style Language (CSL). The formatter takes separate family and given names when the source supplies them. A name supplied as a literal stays a literal. For numeric styles, supply records in citation order. Each result retains its input ID, including when APA sorts the bibliography separately.

The preview covers text and punctuation. It omits typography such as italics and hanging indents. It does not rewrite manuscript markers or resolve journal-specific formatting requirements. Author name parts, dates, journal abbreviations, volume, issue, and page ranges are retained where the source supplies them. Older citations can use Refresh reference metadata to use details already present in their saved source. Review missing details against the publisher's record before submission.

## Citeproc JS

Copyright (c) Frank Bennett. citeproc-js implements the Citation Style Language. [Citation Style Language](https://citationstyles.org/)

Atlas uses the unmodified `citeproc` npm package at `2.4.63` under the Common Public Attribution License 1.0 (CPAL). The package's published source header offers CPAL and AGPLv3 alternatives. The npm registry license field uses a different AGPL version label. Atlas uses the CPAL option. [Upstream source revision](https://github.com/Juris-M/citeproc-js/tree/73bc1b44bc7d54d0bfec4e070fd27f5efe024ff9) · [Exact npm source package](https://registry.npmjs.org/citeproc/-/citeproc-2.4.63.tgz) · [CPAL license and attribution notice](../src/assets/csl/CITEPROC-CPAL.txt)

The license's Exhibit B requires visible credit in the interface that uses the formatter. Keep the Frank Bennett credit, the phrase above, and the Citation Style Language link available where bibliographies are generated. Keep this notice and access to the exact library source with distributed builds.

## CSL styles and locale

The pinned files include their individual CSL contributor credits and rights notices. The XML in `src/assets/csl/sources.json` retains the upstream content, stored line by line so the same data can be read offline by browsers and tests. These files are shared under [Creative Commons Attribution-ShareAlike 3.0](https://creativecommons.org/licenses/by-sa/3.0/).

| Label | Pinned upstream file | SHA-256 of XML |
| --- | --- | --- |
| APA 7 | [APA Style 7th edition](https://github.com/citation-style-language/styles/blob/bcae404e9f8130cc2b94b0749d53514212a15a4a/apa.csl) | `3917def5fc951b104d64216c3373096042368b9704ba269ca83c14ebaba889fc` |
| IEEE | [IEEE Reference Guide version 11.29.2023](https://github.com/citation-style-language/styles/blob/bcae404e9f8130cc2b94b0749d53514212a15a4a/ieee.csl) | `b4c7619fc16c45a31e4cc3271eab94ffe83192d3b4c7fc729470a3b459448de3` |
| Vancouver | [NLM/Vancouver Citing Medicine, citation-sequence](https://github.com/citation-style-language/styles/blob/bcae404e9f8130cc2b94b0749d53514212a15a4a/nlm-citation-sequence.csl) | `492f7935df42054b33d515f7275122f419780df990ea35925dcbbff0fecf1137` |
| US English | [CSL en-US locale](https://github.com/citation-style-language/locales/blob/14940e56f7c783e4173cafbd92e0f5856f2caa14/locales-en-US.xml) | `ac864c7c21166b4390d82c31792cdc509400727fa0060b43d8aa17e07f9cb079` |

## Fixture references

The unit tests compare the APA 7 and IEEE journal-article patterns on synthetic records with known metadata. The Vancouver test uses NLM's standard journal example and checks the pinned style's numeric prefix and typographic page-range dash. The fixtures cover representative journal entries, order, missing data, and literal names. [APA reference examples](https://apastyle.apa.org/style-grammar-guidelines/references/examples/journal-article-references) · [IEEE Reference Guide](https://journals.ieeeauthorcenter.ieee.org/create-your-ieee-journal-article/create-the-text-of-your-article/ieee-editorial-style-manual/) · [NLM sample references](https://www.nlm.nih.gov/bsd/uniform_requirements.html)

The NLM journal example also travels through the app's Crossref parser, a saved citation, a restored portable backup, and the same data conversion used by the bibliography preview. This fixture checks that those steps preserve the author initials, journal abbreviation, date, volume, issue, and pagination. [NLM journal guidance](https://www.ncbi.nlm.nih.gov/books/NBK7282/)
