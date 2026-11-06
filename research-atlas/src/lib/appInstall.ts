type BrowserInstallEvent = Event & {
  prompt: () => Promise<unknown>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type InstallState = 'available' | 'installed' | 'manual';
const listeners = new Set<() => void>();
let pendingPrompt: BrowserInstallEvent | undefined;
let initialized = false;
let installed = false;

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeToInstall(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function getInstallState(): InstallState {
  if (installed) return 'installed';
  return pendingPrompt ? 'available' : 'manual';
}

export function initAppInstall() {
  if (initialized) return;
  initialized = true;
  installed = window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pendingPrompt = event as BrowserInstallEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    pendingPrompt = undefined;
    installed = true;
    notify();
  });

  if (import.meta.env.PROD && window.isSecureContext && 'serviceWorker' in navigator) {
    const root = new URL(import.meta.env.BASE_URL, document.baseURI);
    void navigator.serviceWorker.register(new URL('sw.js', root), { scope: root.pathname, updateViaCache: 'none' })
      .catch(() => { /* Installation and online use can continue without an offline cache. */ });
  }
}

export async function promptAppInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const prompt = pendingPrompt;
  if (!prompt) return 'unavailable';
  pendingPrompt = undefined;
  notify();
  try {
    await prompt.prompt();
    return (await prompt.userChoice).outcome;
  } catch {
    return 'unavailable';
  }
}
