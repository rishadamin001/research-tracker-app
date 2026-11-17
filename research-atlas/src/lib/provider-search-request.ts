import type { Paper } from './model';
import { PaperSearchError, readSearchQuota, type SearchProvider, type SearchQuota, type SearchRun } from './search-provenance';

type SearchPage = SearchRun['pages'][number];
type ErrorKind = NonNullable<SearchRun['error']>['kind'];
type PageData = { papers: Paper[]; count?: number; nextCursor?: string };
type PageResponse = { data: PageData; retrievedAt: string; status: number; requestId?: string; quota?: SearchQuota };
type PageRequest = { signal?: AbortSignal; run?: SearchRun; page?: SearchPage; previousQuota?: SearchQuota };
type ProviderState = { turn: Promise<void>; nextRequestAt: number; quota?: SearchQuota; lastStatus?: number };

const requestPolicies = {
  OpenAlex: { timeoutMs: 8_000, spacingMs: 110 },
  'Europe PMC': { timeoutMs: 12_000, spacingMs: 150 },
  // The public pool permits one list request per second and one in flight.
  Crossref: { timeoutMs: 10_000, spacingMs: 1_000 },
} satisfies Record<SearchProvider, { timeoutMs: number; spacingMs: number }>;
const providerStates = new Map<SearchProvider, ProviderState>();
const totalDeadlineMs = 18_000;
const maxRetryWaitMs = 2_000;
const cachedPageLifetimeMs = 5 * 60_000;
const cachedPages = new Map<string, { expiresAt: number; response: PageResponse }>();
const maxCachedPages = 12;
const maxCachedPageCharacters = 250_000;
const transientStatuses = new Set([408, 429, 500, 502, 503, 504]);

const offlineMessage = 'Your project is available offline. Online literature search resumes when you reconnect.';

class RequestFailure extends Error {
  constructor(readonly kind: ErrorKind, message: string, readonly status?: number) { super(message); }
}

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function rateLimitMessage(provider: SearchProvider, waitUntil?: string) {
  const description = provider === 'OpenAlex' ? 'The free research service is at its limit (OpenAlex).' : `${provider} is temporarily at its free request limit.`;
  return waitUntil
    ? `${description} ${provider} asks you to wait until ${new Date(waitUntil).toLocaleString()} before trying again. Earlier papers are preserved.`
    : `${description} Try again later or choose another source. Earlier papers are preserved.`;
}

function cooldownUntil(quota: SearchQuota | undefined) {
  const retryTime = Date.parse(quota?.retryAfterUntil ?? '');
  const resetTime = quota?.remainingCredits === 0 ? Date.parse(quota.resetsAt ?? '') : NaN;
  return Math.max(retryTime || 0, resetTime || 0);
}

function responseQuota(provider: SearchProvider, headers: Headers, receivedAt: number, status: number) {
  const acceptRetryAfter = transientStatuses.has(status);
  if (provider === 'OpenAlex') return readSearchQuota(headers, receivedAt, acceptRetryAfter);
  const retry = headers.get('Retry-After');
  return retry ? readSearchQuota(new Headers({ 'Retry-After': retry }), receivedAt, acceptRetryAfter) : undefined;
}

function readFailure(provider: SearchProvider, response: Response, quota?: SearchQuota) {
  const { status } = response;
  if (status === 429) {
    const after = cooldownUntil(quota);
    return new RequestFailure('rate-limit', rateLimitMessage(provider, after > Date.now() ? new Date(after).toISOString() : undefined), status);
  }
  if (status === 400 || status === 422) return new RequestFailure('http', `${provider} could not use these search terms or filters (${status}). Try changing the search. Earlier papers are preserved.`, status);
  if (status === 403) return new RequestFailure('http', `${provider} denied access to this request (403). Try its official site or choose another source. Earlier papers are preserved.`, status);
  const retryMessage = quota?.retryAfterUntil ? ` Try again after ${new Date(quota.retryAfterUntil).toLocaleString()}.` : ' Try again later or use its official website.';
  return new RequestFailure('http', `${provider} is unavailable (${status}).${retryMessage} Earlier papers are preserved.`, status);
}

function waitFor<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => { signal.removeEventListener('abort', abort); reject(signal.reason); };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    void promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

function pause(ms: number, signal: AbortSignal) {
  signal.throwIfAborted();
  if (ms <= 0) return Promise.resolve();
  let timer: ReturnType<typeof setTimeout>;
  const paused = new Promise<void>(resolve => { timer = setTimeout(resolve, Math.ceil(ms)); });
  return waitFor(paused, signal).finally(() => clearTimeout(timer));
}

function retryDelay(provider: SearchProvider, failure: RequestFailure, response?: Response, quota?: SearchQuota) {
  if (failure.kind === 'network' || failure.kind === 'timeout') return 300 + Math.random() * 150;
  if (!transientStatuses.has(failure.status ?? 0)) return undefined;
  if (quota?.remainingCredits === 0) return undefined;
  const retryHeader = response?.headers.get('Retry-After');
  const wait = quota?.retryAfterUntil ? Math.max(0, Date.parse(quota.retryAfterUntil) - Date.now()) : 0;
  if (wait > maxRetryWaitMs) return undefined;
  if (provider === 'OpenAlex' && failure.kind === 'rate-limit' && !quota?.retryAfterUntil && !/^0+$/.test(retryHeader ?? '')) return undefined;
  return Math.max(wait, failure.kind === 'rate-limit' ? 750 : 300) + Math.random() * 150;
}

function applyPageResponse(request: PageRequest, response: PageResponse, fromCache = false) {
  if (request.page) {
    request.page.responseStatus = response.status;
    request.page.requestId = response.requestId;
    request.page.retrievedAt = response.retrievedAt;
    if (fromCache) {
      request.page.servedFromCache = true;
      request.page.requestAttempts = 0;
    }
  }
  if (request.run) request.run.quota = response.quota;
}

export async function requestProviderPage(
  provider: SearchProvider, url: string, parse: (raw: unknown) => PageData | Promise<PageData>, request: PageRequest = {},
): Promise<PageData> {
  if (request.signal?.aborted) throw new PaperSearchError('Search cancelled. Earlier papers are preserved.');
  // Only reuse pages inside the same search run. A new query or deliberate refresh makes a fresh request.
  const cacheKey = request.run && request.page && request.page.page > 1 ? `${request.run.id}|${url}` : undefined;
  function readCachedPage() {
    if (!cacheKey) return undefined;
    const cached = cachedPages.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      applyPageResponse(request, cached.response, true);
      return structuredClone(cached.response.data);
    }
    cachedPages.delete(cacheKey);
  }
  const cached = readCachedPage();
  if (cached) return cached;
  if (isOffline()) throw new PaperSearchError(offlineMessage);

  let state = providerStates.get(provider);
  if (!state) {
    state = { turn: Promise.resolve(), nextRequestAt: 0 };
    providerStates.set(provider, state);
  }
  const previousTurn = state.turn;
  let release = () => {};
  const currentTurn = new Promise<void>(resolve => { release = resolve; });
  state.turn = previousTurn.then(() => currentTurn);
  const deadline = AbortSignal.timeout(totalDeadlineMs);
  const queueSignal = request.signal ? AbortSignal.any([request.signal, deadline]) : deadline;
  const queuedAt = performance.now();
  let attempts = 0;
  const { timeoutMs, spacingMs } = requestPolicies[provider];
  try {
    await waitFor(previousTurn, queueSignal);
    queueSignal.throwIfAborted();
    const filledWhileQueued = readCachedPage();
    if (filledWhileQueued) return filledWhileQueued;
    const waitUntil = Math.max(cooldownUntil(state.quota), cooldownUntil(request.previousQuota));
    if (waitUntil > Date.now()) {
      const retryAt = new Date(waitUntil);
      const message = state.lastStatus === 503 && state.quota?.remainingCredits !== 0
        ? `${provider} asks you to wait until ${retryAt.toLocaleString()} before trying again. Earlier papers are preserved.`
        : rateLimitMessage(provider, retryAt.toISOString());
      throw new PaperSearchError(message);
    }
    await pause(state.nextRequestAt - performance.now(), queueSignal);
    while (attempts < 2) {
      queueSignal.throwIfAborted();
      if (isOffline()) throw new RequestFailure('offline', offlineMessage);
      attempts++;
      state.nextRequestAt = performance.now() + spacingMs;
      if (request.page) {
        request.page.responseStatus = undefined;
        request.page.requestId = undefined;
      }
      const timeout = AbortSignal.timeout(timeoutMs);
      const requestSignal = AbortSignal.any([queueSignal, timeout]);
      let response: Response | undefined;
      let quota: SearchQuota | undefined;
      try {
        response = await waitFor(fetch(url, { signal: requestSignal, credentials: 'omit', cache: 'no-store' }), requestSignal);
        const receivedAt = Date.now();
        quota = responseQuota(provider, response.headers, receivedAt, response.status);
        state.quota = quota;
        state.lastStatus = response.status;
        if (request.run) request.run.quota = quota;
        const requestIdHeader = response.headers.get('X-Request-ID');
        const requestId = requestIdHeader && /^[\w:-]{1,160}$/.test(requestIdHeader) ? requestIdHeader : undefined;
        if (request.page) {
          request.page.responseStatus = response.status >= 200 ? response.status : undefined;
          request.page.requestId = requestId;
        }
        if (!response.ok) {
          void response.body?.cancel().catch(() => {});
          throw readFailure(provider, response, quota);
        }
        const raw: unknown = await waitFor(response.json(), requestSignal);
        const data = await waitFor(Promise.resolve(parse(raw)), queueSignal);
        const pageResponse = { data, retrievedAt: new Date(receivedAt).toISOString(), status: response.status, requestId, quota };
        applyPageResponse(request, pageResponse);
        if (cacheKey && JSON.stringify(data).length <= maxCachedPageCharacters) {
          if (cachedPages.size >= maxCachedPages) {
            const oldest = cachedPages.keys().next().value;
            if (oldest) cachedPages.delete(oldest);
          }
          cachedPages.set(cacheKey, { expiresAt: receivedAt + cachedPageLifetimeMs, response: structuredClone(pageResponse) });
        }
        return data;
      } catch (failure) {
        queueSignal.throwIfAborted();
        if (failure instanceof PaperSearchError) throw failure;
        const outcome = failure instanceof RequestFailure ? failure : toRequestFailure(provider, failure, timeout.aborted);
        const delay = attempts < 2 ? retryDelay(provider, outcome, response, quota) : undefined;
        if (delay === undefined || performance.now() - queuedAt + delay + 1_000 >= totalDeadlineMs) throw outcome;
        await pause(Math.max(delay, state.nextRequestAt - performance.now()), queueSignal);
      }
    }
    throw new RequestFailure('invalid-response', `${provider} returned records the app could not read. Earlier papers are preserved.`);
  } catch (failure) {
    if (failure instanceof PaperSearchError) throw failure;
    const outcome = request.signal?.aborted
      ? new RequestFailure('cancelled', 'Search cancelled. Earlier papers are preserved.')
      : failure instanceof RequestFailure ? failure : toRequestFailure(provider, failure, deadline.aborted);
    if (request.page) {
      request.page.failure = outcome.message;
      request.page.status = outcome.status;
      if (outcome.kind === 'network') request.page.networkFailure = 'network-or-cors';
    }
    throw new PaperSearchError(outcome.message, request.run && {
      ...request.run, completedAt: new Date(Date.now()).toISOString(), error: { kind: outcome.kind, message: outcome.message, status: outcome.status },
    });
  } finally {
    if (request.page && attempts !== 1) request.page.requestAttempts = attempts;
    release();
  }
}

function toRequestFailure(provider: SearchProvider, failure: unknown, timedOut: boolean) {
  if (timedOut) return new RequestFailure('timeout', `${provider} search timed out. Earlier papers are preserved; retry when ready.`);
  if (isOffline()) return new RequestFailure('offline', offlineMessage);
  if (failure instanceof TypeError) return new RequestFailure('network', `Could not reach ${provider} or read its response. A network interruption or browser cross-origin restriction (CORS) may be responsible; the HTTP status is not exposed to Atlas. Retry or open the official source. Earlier papers are preserved.`);
  return new RequestFailure('invalid-response', `${provider} returned records the app could not read. Earlier papers are preserved. Try again or use its official website.`);
}
