import { writeFileSync } from 'node:fs';
import { manuscriptDocx } from '../src/lib/writing-docx';
writeFileSync('docx-verification.docx', manuscriptDocx('Draft <&>', '# Draft <&>\n\n## Findings\nCafé α [1] <source> & evidence.\uFFFE\uFFFF\n\n## Draft bibliography\n[1] Example (2025).'));
