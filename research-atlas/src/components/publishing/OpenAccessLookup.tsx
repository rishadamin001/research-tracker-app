import { useState } from 'react';
import { External } from '@/components/shared/External';
import { safeUrl } from '@/lib/model';
import { resolveOa } from '@/lib/providers';

export function OpenAccessLookup({ doi }: { doi: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ url?: string; message: string }>();

  async function lookup() {
    setBusy(true);
    setResult(undefined);
    try {
      const match = await resolveOa(doi);
      const url = match.is_oa ? safeUrl(match.best_oa_location?.url) : undefined;
      const message = match.is_oa ? `${match.source} reports open access.` : `No open-access location reported by ${match.source}.`;
      setResult({ url, message: match.is_oa && !url ? `${message} A usable link is unavailable.` : message });
    } catch (error) {
      setResult({ message: error instanceof Error ? error.message : 'Open-access lookup is unavailable.' });
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="button secondary" disabled={busy} onClick={lookup}>{busy ? 'Looking up open access…' : 'Resolve open-access copy'}</button>
    {result && <p role="status">{result.message}</p>}
    {result?.url && <External href={result.url}>Open legal OA copy</External>}
  </>;
}
