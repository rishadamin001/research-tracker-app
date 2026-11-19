export const backupDateKey = 'atlas-last-backup';

export const backupCheckDateKey = 'atlas-last-backup-check';

export function readBackupDate(key: string) {
  try {
    const value = localStorage.getItem(key);
    return value && Number.isFinite(Date.parse(value)) ? value : '';
  } catch { return ''; }
}

export function lastBackupDate() {
  return readBackupDate(backupDateKey);
}

export function recordBackupFileCheck() {
  try { localStorage.setItem(backupCheckDateKey, new Date().toISOString()); }
  catch { /* Checking a file does not require browser storage. */ }
}

export function subscribeToBackupFileCheck(update: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === backupCheckDateKey || event.key === null) update();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
