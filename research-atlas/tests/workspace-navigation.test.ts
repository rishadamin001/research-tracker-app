import test from 'node:test';
import assert from 'node:assert/strict';
import { createProject, paperSchema } from '../src/lib/model';
import { nextUsefulAction, primaryDestination, projectTab } from '../src/lib/workspace-navigation';
test('legacy project routes map into the coherent workspace without dropping their stage', () => {
  assert.equal(projectTab('data'), 'methods'); assert.equal(projectTab('topic'), 'question');
  assert.equal(primaryDestination('publication'), 'roadmap'); assert.equal(primaryDestination('conferences'), 'publish-hub');
});
test('next action follows actual research state and prioritizes upstream review', () => {
  const p = createProject(); assert.equal(nextUsefulAction(p).target, 'question');
  p.question = 'How do students choose a study space?'; assert.equal(nextUsefulAction(p).target, 'discover');
  p.papers.push(paperSchema.parse({ id:'a', title:'Housing', authors:'A', year:2024, doi:null, url:'', oa:null, journal:'J', source:'fixture' }));
  assert.equal(nextUsefulAction(p).target, 'screen'); p.needsReview = ['methods']; assert.equal(nextUsefulAction(p).target, 'methods');
});
