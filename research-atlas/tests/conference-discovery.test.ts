import test from 'node:test';
import assert from 'node:assert/strict';
import { conferenceBriefError, conferenceDiscoverySources, conferenceSearchBrief, officialConferenceDirectories } from '../src/lib/conference-discovery';

test('conference discovery keeps official source scope separate from event matches and query transmission', () => {
  const international = conferenceDiscoverySources('international');
  assert.ok(international.some(source => source.id === 'who'));
  assert.ok(international.some(source => source.id === 'ieee'));
  assert.ok(!international.some(source => source.id === 'du'));
  assert.deepEqual(conferenceDiscoverySources('international', 'who').map(source => source.id), ['who']);
  assert.equal(conferenceDiscoverySources('bangladesh', 'who').length, 0);
  assert.ok(conferenceDiscoverySources('bangladesh', 'bangladesh').every(source => source.regions.some(region => region === 'bangladesh')));
  for (const source of officialConferenceDirectories) {
    const url = new URL(source.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.search, '');
    assert.equal(url.hash, '');
  }
});

test('search brief retains optional event dates and organizer without claiming remote filtering or verification', () => {
  const brief = { region: 'international' as const, topic: ' public health & climate ', location: ' Online ', organizer: ' WHO ', from: '2027-01-01', until: '2027-12-31' };
  assert.equal(conferenceBriefError(brief), '');
  const text = conferenceSearchBrief(brief);
  for (const phrase of ['Topic or keywords: public health & climate', 'Country, city or online format: Online', 'Organizer or society: WHO', 'Earliest conference date: 2027-01-01', 'Latest conference date: 2027-12-31', 'Atlas has not searched or filtered its event records', 'Verify the actual organizer']) assert.ok(text.includes(phrase), phrase);
  assert.match(conferenceBriefError({ ...brief, until: '2026-12-31' }), /on or after/);
  assert.match(conferenceBriefError({ ...brief, from: '2027-02-30' }), /valid conference dates/);
});
