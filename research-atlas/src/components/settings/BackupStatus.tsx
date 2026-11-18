import { useState } from 'react';

export function BackupStatus({ date }: { date: string }) {
  const [now] = useState(Date.now);
  const overdue = !date || now - Date.parse(date) > 30 * 86_400_000;
  return <p className="muted">{date ? <>Last backup download started <time dateTime={date}>{new Date(date).toLocaleDateString()}</time>.</> : 'No backup download is recorded in this browser.'} {overdue && 'Download a current copy before clearing browser data or switching devices.'}</p>;
}
