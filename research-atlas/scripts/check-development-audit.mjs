import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const picomatchAdvisory = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
const severities = ['info', 'low', 'moderate', 'high', 'critical'];

export function checkDevelopmentAudit(report, lock) {
  const findings = report?.vulnerabilities;
  const counts = report?.metadata?.vulnerabilities;
  if (report?.auditReportVersion !== 2 || report.error || !findings || Array.isArray(findings) || typeof findings !== 'object' || !counts || !lock?.packages) {
    throw new Error('npm did not return a complete dependency audit.');
  }
  const entries = Object.entries(findings);
  if (entries.some(([name, item]) => item?.name !== name || !severities.includes(item.severity) ||
      !Array.isArray(item.nodes) || !item.nodes.length || !Array.isArray(item.via) || !item.via.length ||
      item.via.some(cause => typeof cause === 'string' ? !Object.hasOwn(findings, cause) :
        !severities.includes(cause?.severity) || typeof cause.url !== 'string')) ||
      counts.total !== entries.length || severities.some(level => counts[level] !== entries.filter(([, item]) => item.severity === level).length)) {
    throw new Error('npm returned inconsistent dependency audit details.');
  }

  // The only temporary exception is this published advisory in the build toolchain.
  // Require every path leading to it to be marked development-only in the exact lockfile.
  function isKnownDevelopmentFinding(name, chain = []) {
    if (chain.includes(name)) return false;
    const finding = findings[name];
    return finding.nodes.every(node => lock.packages[node]?.dev === true) &&
      finding.via.every(cause => typeof cause === 'string' ? isKnownDevelopmentFinding(cause, [...chain, name]) :
        name === 'picomatch' && cause.name === name && cause.severity === 'high' && cause.url === picomatchAdvisory);
  }

  const high = entries.filter(([, item]) => item.severity === 'high');
  if (counts.critical || high.some(([name]) => !isKnownDevelopmentFinding(name))) {
    throw new Error('The dependency audit found a high or critical issue outside the reviewed development-only advisory.');
  }
  return high.length > 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const report = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
    for (const item of Object.values(report.vulnerabilities ?? {})) {
      console.log(`[${item.severity}] ${item.name}: ${item.via.map(cause => typeof cause === 'string' ? cause : cause.url).join(', ')}`);
    }
    const exceptionUsed = checkDevelopmentAudit(report, lock);
    console.log(exceptionUsed
      ? `Temporary development-only exception for ${picomatchAdvisory}. The advisory remains unresolved upstream.`
      : 'No high or critical advisories in the complete dependency audit.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
