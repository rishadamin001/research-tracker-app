import { useSyncExternalStore } from 'react';
import { backupCheckDateKey, readBackupDate, subscribeToBackupFileCheck } from '@/lib/backup-status-storage';

export function BackupFileCheckStatus({ showEmpty = true }: { showEmpty?: boolean } = {}) {
  const date = useSyncExternalStore(subscribeToBackupFileCheck, () => readBackupDate(backupCheckDateKey), () => '');
  if (!date && !showEmpty) return null;
  return <p className="muted">{date ? <>Last successful backup file check <time dateTime={date}>{new Date(date).toLocaleDateString()}</time>.</> : 'No backup file check is recorded in this browser.'}</p>;
}
