"""Independent ZIP/OOXML validation of the synthetic export from check-docx.ts."""
import pathlib
import xml.etree.ElementTree as ET
import zipfile

with zipfile.ZipFile('docx-verification.docx') as doc:
    assert doc.testzip() is None
    for name in doc.namelist():
        ET.fromstring(doc.read(name))
    body = ET.fromstring(doc.read('word/document.xml'))
    text = ''.join(body.itertext())
    assert 'Café α [1] <source> & evidence.' in text
    assert 'Example (2025)' in text
    assert '\ufffe' not in text and '\uffff' not in text
    ns = {'r': 'http://schemas.openxmlformats.org/package/2006/relationships'}
    for name in ['_rels/.rels', 'word/_rels/document.xml.rels']:
        rels = ET.fromstring(doc.read(name))
        prefix = pathlib.PurePosixPath(name).parent.parent
        for rel in rels.findall('r:Relationship', ns):
            assert str(prefix / rel.attrib['Target']) in doc.namelist()
print('DOCX ZIP, XML, relationships, Unicode and citations verified (no Word layout claim).')
