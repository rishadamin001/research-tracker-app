'use client';

import { useState, type ReactNode } from 'react';

export function EvidencePaperPanel({ title, detail, children }: { title: string; detail: ReactNode; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return <details className="panel matrix-paper" onToggle={event => {
    if (event.target === event.currentTarget) setExpanded(event.currentTarget.open);
  }}>
    <summary><span><strong>{title}</strong><small>{detail}</small></span></summary>
    {expanded && <div className="lesson-body">{children}</div>}
  </details>;
}
