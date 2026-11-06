'use client';
import { useState } from 'react';
import { ArrowUpRight, Copy } from 'lucide-react';
import { safeUrl } from '@/lib/model';

/** Native navigation works in embedded browsers that suppress new tabs. */
export function External({ href, children }: { href: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const valid = safeUrl(href);
  if (!valid) return <span>{children} <small>(link unavailable)</small></span>;
  const accessCheck = /(^|\.)(open\.edu|doaj\.org|scopus\.com|acm\.org)$/.test(new URL(valid).hostname);

  async function copy() {
    try {
      await navigator.clipboard.writeText(valid!);
      setCopied(true);
    } catch {
      setShowAddress(true);
    }
  }

  return <span className="external-link">
    <a href={valid} rel="noreferrer" title="Open external website in this tab">{children}<ArrowUpRight size={14} aria-hidden="true" /></a>
    <button type="button" className="copy-link" aria-label={`Copy link: ${typeof children === 'string' ? children : new URL(valid).hostname}`} title="Copy link to open in another browser" onClick={copy}><Copy size={13} aria-hidden="true" /></button>
    {accessCheck && <small className="link-feedback">May require a browser access check</small>}
    {copied && <span className="link-feedback" role="status">Link copied</span>}
    {showAddress && <label className="link-fallback">Copy this address<input readOnly value={valid} onFocus={e => e.currentTarget.select()} /></label>}
  </span>;
}
