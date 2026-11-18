'use client';

import { openAlexSearch, type SearchRun } from '@/lib/search-provenance';
import { External } from '@/components/shared/External';

export function SearchRunDetails({ run }: { run: SearchRun }) {
  return <details>
    <summary>Search details</summary>
    {run.userQuery !== run.executedQuery && <p>Entered query <code>{run.userQuery}</code></p>}
    <p>Executed query <code>{run.executedQuery}</code></p>
    <p>Provider filters {run.filters.length ? <code>{run.filters.join(', ')}</code> : 'None'}</p>
    <p>{run.provider} · {run.mode === 'gateway-first-page' ? 'Configured gateway' : 'Public API, no key required'} · {run.pageSize} records per page · {run.pagingMode === 'cursor' ? 'Provider cursor continuation' : 'Basic page continuation'}, bounded to {openAlexSearch.maxPages} pages</p>
    {run.pages.map((page, index) => <div key={`${page.page}-${index}`}><p>Page {page.page} requested <time dateTime={page.requestedAt}>{new Date(page.requestedAt).toLocaleString()}</time>{page.returnedCount === undefined ? ' · no readable response' : ` · ${page.returnedCount} records returned`}{page.requestAttempts !== undefined && ` · ${page.requestAttempts} network requests`}{page.servedFromCache && ' · reused this run’s stored response'}{page.retrievedAt && <> · provider response <time dateTime={page.retrievedAt}>{new Date(page.retrievedAt).toLocaleString()}</time></>}{page.requestId && ` · Request ID ${page.requestId}`}{page.failure && ` · ${page.failure}`}</p>{page.requestUrl && <details><summary>Request diagnostics for page {page.page}, attempt {index + 1}</summary><p>HTTP status: {page.responseStatus ?? page.status ?? 'not exposed by the browser'}{page.networkFailure && ' · network or cross-origin access failure; Atlas cannot distinguish these from browser fetch alone.'}</p>{page.requestOrigin && <p>App origin: {page.requestOrigin}</p>}<External href={page.requestUrl}>Open recorded provider request</External></details>}</div>)}
    {run.stopReason && <p>Continuation state · {run.stopReason === 'provider-end' ? 'End of provider results reached at retrieval time' : run.stopReason === 'app-limit' ? '100-record app limit reached' : 'Stopped by you; you may resume'}</p>}
    <p>{run.error ? 'Ended' : 'Completed'} <time dateTime={run.completedAt}>{new Date(run.completedAt).toLocaleString()}</time>{run.resultCountReported !== undefined && ` · ${run.resultCountReported.toLocaleString()} matches reported by the provider`}</p>
    {run.error && <p>Outcome · {run.error.message}</p>}
    {run.quota?.remainingCredits !== undefined && <p>Provider credits remaining when checked · {run.quota.remainingCredits.toLocaleString()}{run.quota.dailyCredits !== undefined && ` of ${run.quota.dailyCredits.toLocaleString()}`}</p>}
    {run.quota?.resetsAt && <p>Daily allowance resets <time dateTime={run.quota.resetsAt}>{new Date(run.quota.resetsAt).toLocaleString()}</time></p>}
    {run.quota?.retryAfterUntil && <p>Provider asks you to wait until <time dateTime={run.quota.retryAfterUntil}>{new Date(run.quota.retryAfterUntil).toLocaleString()}</time></p>}
    <p>This is a bounded discovery search, not an exhaustive review. {run.provider === 'OpenAlex' ? 'OpenAlex cursor continuation requires a key; Atlas uses documented basic paging without one.' : run.provider === 'Europe PMC' ? 'Europe PMC provides public cursor continuation without an API key.' : 'Crossref results here are journal article DOI metadata, using public offset paging.'}</p>
    {run.parserVersion && <p>Atlas parser {run.parserVersion} · provider default relevance order.</p>}
    {run.unsupportedOperators.length > 0 && <p>Atlas rejects {run.unsupportedOperators.join(', ')} for this provider.</p>}
    <p>Provider documentation checked <time dateTime={run.providerDocsDate}>{run.providerDocsDate}</time>.</p>
  </details>;
}
