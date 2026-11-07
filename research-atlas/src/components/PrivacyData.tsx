import { useState } from 'react';
import { Database, Download, LockKeyhole } from 'lucide-react';
import { External } from './External';

export const backupDateKey = 'atlas-last-backup';

export function lastBackupDate() {
  try {
    const value = localStorage.getItem(backupDateKey);
    return value && Number.isFinite(Date.parse(value)) ? value : '';
  } catch { return ''; }
}

export function BackupStatus({ date }: { date: string }) {
  const [now] = useState(Date.now);
  const overdue = !date || now - Date.parse(date) > 30 * 86_400_000;
  return <p className="muted">{date ? <>Last backup download started <time dateTime={date}>{new Date(date).toLocaleDateString()}</time>.</> : 'No backup download is recorded in this browser.'} {overdue && 'Download a current copy before clearing browser data or switching devices.'}</p>;
}

export function PrivacyData({ backupDate, onBackup }: { backupDate: string; onBackup: () => void }) {
  const [storage, setStorage] = useState('');
  const [busy, setBusy] = useState(false);

  async function checkStorage(protect: boolean) {
    setBusy(true);
    try {
      const manager = navigator.storage;
      const estimate = await manager?.estimate?.();
      const persistent = protect ? await manager?.persist?.() : await manager?.persisted?.();
      const usage = estimate?.usage == null ? '' : ` Browser estimate for this site: ${(estimate.usage / 1048576).toFixed(2)} MB used${estimate.quota ? ` of ${(estimate.quota / 1048576).toFixed(0)} MB available (${(estimate.usage / estimate.quota * 100).toFixed(1)}%)` : ''}.`;
      const status = persistent === true ? 'The browser reports persistent storage.' : persistent === false
        ? 'The browser can reclaim this site’s storage. Keep a downloaded backup.'
        : 'Storage protection status is unavailable in this browser.';
      setStorage(`${status}${usage}`);
    } catch { setStorage('Storage details are unavailable. Download a backup to keep a separate copy.'); }
    finally { setBusy(false); }
  }

  return <>
    <div className="page-heading"><div><span className="eyebrow">YOUR WORKSPACE</span><h1>Privacy &amp; data</h1><p>See what stays in your browser and what is shared when you use a scholarly lookup.</p></div></div>
    <section className="panel"><h2><LockKeyhole size={18} aria-hidden="true" /> Stored on this device</h2>
      <p>Projects, screening decisions, evidence notes, drafts, budgets, and preferences are stored in this browser. Atlas has no required sign-in or app analytics. Opening the published site contacts its host, GitHub Pages.</p>
      <p>Paper search without a project keeps the last 50 search records in this browser, including entered terms, filters, and provider response details. Use Clear search history in Paper search to remove them. Project search logs stay with the project and its backup.</p>
      <p>Question drafts, committed revisions, and bounded project history stay on this device. Atlas Library groups project references locally. Recovery snapshots retain up to eight earlier workspaces within a shared 10 MB limit; they can contain deleted projects and earlier private notes until rotated out or cleared. Review or clear snapshots under My projects. Clearing this site’s browser data also removes them. They are not off-device backups.</p>
      <h3>Sent when you use a lookup</h3>
      <ul>
        <li>Literature keywords and filters, work identifiers, and journal ISSNs go to OpenAlex.</li>
        <li>DOIs go to Crossref for bibliographic checks. The default public app uses OpenAlex for open-access lookups.</li>
        <li>External links open the provider’s site. Calendar links send the event details you choose to add.</li>
      </ul>
      <p>Keep private notes, participant identifiers, and manuscript text out of scholarly searches. Downloaded backups and exports can contain your private project notes.</p>
      <p>Atlas does not use product analytics, advertising trackers, or marketing cookies in this release. External services receive ordinary connection information such as IP address and browser details. Their processing may take place outside your country.</p>
      <h3>Third-party policies</h3><div className="button-row"><External href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub privacy</External><External href="https://openalex.org/OpenAlex_privacy_policy.pdf">OpenAlex privacy</External><External href="https://www.crossref.org/privacy/">Crossref privacy</External></div>
      <h3>Deletion and retention</h3><p>Use My projects to delete a project. Browser site-data controls remove this origin’s workspace and preferences; downloaded backups remain on your device until you delete them. Atlas has no central copy of your research to recover. This public deployment has no Atlas-operated logging server; hosting and lookup providers apply their own policies.</p>
    </section>
    <section className="panel"><h2><Database size={18} aria-hidden="true" /> Backups and browser storage</h2>
      <BackupStatus date={backupDate} />
      <div className="button-row"><button type="button" className="button" onClick={onBackup}><Download size={16} aria-hidden="true" /> Download backup</button>
        <button type="button" className="button secondary" onClick={() => void checkStorage(false)} disabled={busy}>Check storage</button>
        <button type="button" className="button secondary" onClick={() => void checkStorage(true)} disabled={busy || !navigator.storage?.persist}>Ask browser to protect storage</button></div>
      {storage && <p role="status">{storage}</p>}
      <p>The estimate covers this site’s browser storage, including cached files. Storage protection is a browser decision and does not replace a downloaded backup. There is no application-level encryption.</p>
      <h3>Moving to another device or website address?</h3><ol><li>Download a backup here before you leave.</li><li>Open Research Atlas at your destination and choose My projects → Import backup.</li><li>Review the source, project and reference counts, then import as new copies.</li></ol><p>Each website origin has separate storage. A new domain cannot read projects saved at the old address. No domain move is currently configured.</p>
    </section>
    <section className="panel"><h2>About this release</h2><p>Effective 7 November 2026. Research Atlas is maintained through the <External href="https://github.com/rishadamin001/research-tracker-app">rishadamin001/research-tracker-app repository</External>. Policy changes are recorded there.</p><p><a href="#terms">Terms &amp; limitations</a> · <a href="#support">Support &amp; recovery</a></p><p>For support or privacy questions, use the repository’s public support channel with a general description only. Do not post participant data, private backups, manuscripts, or identifying details.</p></section>
  </>;
}
