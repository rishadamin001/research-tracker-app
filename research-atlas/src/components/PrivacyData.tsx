import { useState } from 'react';
import { Database, Download, LockKeyhole } from 'lucide-react';

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
      const usage = estimate?.usage == null ? '' : ` Browser estimate for this site: ${(estimate.usage / 1048576).toFixed(2)} MB used.`;
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
      <h3>Sent when you use a lookup</h3>
      <ul>
        <li>Literature keywords and filters, work identifiers, and journal ISSNs go to OpenAlex.</li>
        <li>DOIs go to Crossref for bibliographic checks. The default public app uses OpenAlex for open-access lookups.</li>
        <li>External links open the provider’s site. Calendar links send the event details you choose to add.</li>
      </ul>
      <p>Keep private notes, participant identifiers, and manuscript text out of scholarly searches. Downloaded backups and exports can contain your private project notes.</p>
    </section>
    <section className="panel"><h2><Database size={18} aria-hidden="true" /> Backups and browser storage</h2>
      <BackupStatus date={backupDate} />
      <div className="button-row"><button type="button" className="button" onClick={onBackup}><Download size={16} aria-hidden="true" /> Download backup</button>
        <button type="button" className="button secondary" onClick={() => void checkStorage(false)} disabled={busy}>Check storage</button>
        <button type="button" className="button secondary" onClick={() => void checkStorage(true)} disabled={busy || !navigator.storage?.persist}>Ask browser to protect storage</button></div>
      {storage && <p role="status">{storage}</p>}
    </section>
  </>;
}
