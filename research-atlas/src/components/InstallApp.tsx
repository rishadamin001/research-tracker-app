import { useState, useSyncExternalStore } from 'react';
import { Download } from 'lucide-react';
import { getInstallState, promptAppInstall, subscribeToInstall } from '@/lib/appInstall';

export function InstallApp() {
  const state = useSyncExternalStore(subscribeToInstall, getInstallState);
  const [notice, setNotice] = useState('');

  async function install() {
    const result = await promptAppInstall();
    setNotice(result === 'unavailable' ? 'Use your browser’s installation menu to continue.' : '');
  }

  return <section className="panel" aria-labelledby="install-atlas-title">
    <h2 id="install-atlas-title">Install Research Atlas</h2>
    <p>Open the workspace from your home screen or desktop. Live literature searches and external links need an internet connection.</p>
    {state === 'available' && <button type="button" className="button secondary" onClick={install}><Download size={16} />Install app</button>}
    {state === 'installed' && <p role="status">Research Atlas is installed in this browser.</p>}
    {state === 'manual' && <p>Look for <strong>Install app</strong> or <strong>Add to Home Screen</strong> in your browser menu. On iPhone or iPad, use Safari’s <strong>Share → Add to Home Screen</strong>.</p>}
    {notice && <p role="status">{notice}</p>}
  </section>;
}
