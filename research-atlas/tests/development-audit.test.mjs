import assert from 'node:assert/strict';
import test from 'node:test';
import { checkDevelopmentAudit } from '../scripts/check-development-audit.mjs';

const advisory = { name: 'picomatch', severity: 'high', url: 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf' };
const risk = (name, via, severity = 'high') => ({ name, via, severity, nodes: [`node_modules/${name}`] });
const report = (findings = []) => ({
  auditReportVersion: 2,
  vulnerabilities: Object.fromEntries(findings.map(item => [item.name, item])),
  metadata: { vulnerabilities: {
    total: findings.length, info: 0, low: 0, moderate: 0,
    high: findings.filter(item => item.severity === 'high').length,
    critical: findings.filter(item => item.severity === 'critical').length,
  } },
});
const findings = [risk('picomatch', [advisory]), risk('tinyglobby', ['picomatch'])];
const devLock = { packages: {
  'node_modules/picomatch': { dev: true },
  'node_modules/tinyglobby': { dev: true },
} };

test('the development audit accepts a clean report and only the known advisory through complete development paths', () => {
  assert.equal(checkDevelopmentAudit(report(), devLock), false);
  assert.equal(checkDevelopmentAudit(report(findings), devLock), true);
});

test('the audit blocks production paths, additional high advisories and critical findings', () => {
  const mixedLock = { packages: { ...devLock.packages, 'node_modules/tinyglobby': {} } };
  assert.throws(() => checkDevelopmentAudit(report(findings), mixedLock), /outside the reviewed/);
  const extra = risk('picomatch', [advisory, { ...advisory, url: 'https://example.org/another' }]);
  assert.throws(() => checkDevelopmentAudit(report([extra]), devLock), /outside the reviewed/);
  const critical = risk('picomatch', [{ ...advisory, severity: 'critical' }], 'critical');
  assert.throws(() => checkDevelopmentAudit(report([critical]), devLock), /outside the reviewed/);
});

test('the development audit refuses inconsistent details and an unavailable registry result', () => {
  assert.throws(() => checkDevelopmentAudit(report([risk('tinyglobby', ['missing-cause'])]), devLock), /inconsistent/);
  assert.throws(() => checkDevelopmentAudit({ error: { code: 'EAUDIT' } }, devLock), /complete/);
});
