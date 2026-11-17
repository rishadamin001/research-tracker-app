import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import sourceData from '../src/assets/csl/sources.json';
import { formatCslBibliography, type CslReference } from '../src/lib/csl-bibliography';

const article: CslReference = {
  id: 'airflow', type: 'article-journal', title: 'Measured airflow in small laboratories',
  authors: [{ family: 'Karim', given: 'Mina A.' }, { family: 'Chen', given: 'Li' }],
  issued: [2024, 5], containerTitle: 'Journal of Laboratory Design', containerTitleShort: 'J. Lab. Des.',
  volume: '12', issue: '3', pages: '120-128', doi: '10.1000/example',
};

const nlmExample: CslReference = {
  id: 'nlm-example', type: 'article-journal', title: 'Solid-organ transplantation in HIV-infected patients',
  authors: [{ family: 'Halpern', given: 'Scott D.' }, { family: 'Ubel', given: 'Peter A.' }, { family: 'Caplan', given: 'Arthur L.' }],
  issued: [2002, 7, 25], containerTitle: 'New England Journal of Medicine', containerTitleShort: 'N Engl J Med',
  volume: '347', issue: '4', pages: '284-287',
};

test('APA 7 follows the journal article pattern and sorts by author without losing reference IDs', () => {
  const entries = formatCslBibliography('apa', [article, nlmExample]);
  assert.deepEqual(entries.map(entry => entry.id), [nlmExample.id, article.id]);
  assert.equal(entries[1].text, 'Karim, M. A., & Chen, L. (2024). Measured airflow in small laboratories. Journal of Laboratory Design, 12(3), 120–128. https://doi.org/10.1000/example');
});

test('IEEE follows the journal article pattern and numbers the supplied citation order', () => {
  const entries = formatCslBibliography('ieee', [article, nlmExample]);
  assert.deepEqual(entries.map(entry => entry.id), [article.id, nlmExample.id]);
  assert.equal(entries[0].text, '[1] M. A. Karim and L. Chen, “Measured airflow in small laboratories,” J. Lab. Des., vol. 12, no. 3, pp. 120–128, May 2024, doi: 10.1000/example.');
  assert.match(entries[1].text, /^\[2\] S\. D\. Halpern/);
});

test('Vancouver matches the NLM standard journal example with a numbered prefix and typographic range', () => {
  const entries = formatCslBibliography('vancouver', [nlmExample, article]);
  assert.deepEqual(entries.map(entry => entry.id), [nlmExample.id, article.id]);
  assert.equal(entries[0].text, '1. Halpern SD, Ubel PA, Caplan AL. Solid-organ transplantation in HIV-infected patients. N Engl J Med. 2002 Jul 25;347(4):284–7.');
  assert.match(entries[1].text, /^2\. Karim MA, Chen L\./);
});

test('preserves literal author strings and missing dates in plain-text output', () => {
  const organization: CslReference = {
    id: '__proto__', type: 'report', title: 'Archive of daylight data',
    authors: [{ literal: 'North Research Center, Data Office' }], publisher: 'Test Publisher',
  };
  const missingAuthor: CslReference = { id: 'none', type: 'article-journal', title: 'Missing byline', containerTitle: 'Study Notes' };
  assert.deepEqual(formatCslBibliography('apa', [organization, missingAuthor]), [
    { id: 'none', text: 'Missing byline. (n.d.). Study Notes.' },
    { id: '__proto__', text: 'North Research Center, Data Office. (n.d.). Archive of daylight data. Test Publisher.' },
  ]);
  assert.deepEqual(formatCslBibliography('apa', []), []);
  assert.throws(() => formatCslBibliography('apa', [organization, organization]), /distinct identifier/);
});

test('the bundled data reproduces the pinned upstream XML bytes', () => {
  const hashes = {
    apa: '3917def5fc951b104d64216c3373096042368b9704ba269ca83c14ebaba889fc',
    ieee: 'b4c7619fc16c45a31e4cc3271eab94ffe83192d3b4c7fc729470a3b459448de3',
    vancouver: '492f7935df42054b33d515f7275122f419780df990ea35925dcbbff0fecf1137',
    locale: 'ac864c7c21166b4390d82c31792cdc509400727fa0060b43d8aa17e07f9cb079',
  };
  for (const name of Object.keys(sourceData) as (keyof typeof sourceData)[]) {
    assert.equal(createHash('sha256').update(sourceData[name].join('\n')).digest('hex'), hashes[name], name);
  }
});
