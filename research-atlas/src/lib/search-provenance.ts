import { z } from 'zod';

export const openAlexSearch = {
  docsDate: '2026-11-07',
  docsUrl: 'https://help.openalex.org/api/searching/',
  pageSize: 20,
  unsupportedOperators: ['AND', 'OR', 'NOT', 'parentheses', 'wildcards'],
};

const timestamp = z.iso.datetime();
const count = z.number().int().nonnegative();
const quotaSchema = z.object({
  dailyCredits: count.optional(),
  remainingCredits: count.optional(),
  requestCredits: count.optional(),
  resetsAt: timestamp.optional(),
  retryAfterUntil: timestamp.optional(),
});

export const searchRunSchema = z.object({
  id: z.string().uuid(),
  provider: z.literal('OpenAlex'),
  mode: z.enum(['anonymous-first-page', 'gateway-first-page']),
  userQuery: z.string().max(300),
  executedQuery: z.string().min(3).max(300),
  filters: z.array(z.string().max(60)).max(2),
  supportedOperators: z.array(z.string().max(40)).max(8),
  unsupportedOperators: z.array(z.string().max(40)).max(8),
  startedAt: timestamp,
  completedAt: timestamp,
  resultCountReported: count.optional(),
  pageSize: count.max(100),
  cursorState: z.literal('not-requested'),
  pages: z.array(z.object({
    page: z.literal(1),
    requestedAt: timestamp,
    returnedCount: count.max(100).optional(),
    requestId: z.string().max(160).optional(),
  })).length(1),
  providerDocsDate: z.iso.date(),
  quota: quotaSchema.optional(),
  error: z.object({
    kind: z.enum(['rate-limit', 'http', 'network', 'offline', 'timeout', 'cancelled', 'invalid-response']),
    status: z.number().int().min(400).max(599).optional(),
    message: z.string().max(500),
  }).optional(),
});

export type SearchRun = z.infer<typeof searchRunSchema>;
export type SearchQuota = z.infer<typeof quotaSchema>;

function integerHeader(headers: Headers, name: string) {
  const value = headers.get(name);
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : undefined;
}

function timestampAt(ms: number) {
  const time = new Date(ms);
  return Number.isFinite(time.getTime()) ? time.toISOString() : undefined;
}

export function readSearchQuota(headers: Headers, receivedAt: number, allowRetryAfter: boolean): SearchQuota | undefined {
  const resetSeconds = integerHeader(headers, 'X-RateLimit-Reset');
  const retrySeconds = integerHeader(headers, 'Retry-After');
  const retryHeader = headers.get('Retry-After');
  const retryTime = retrySeconds !== undefined ? receivedAt + retrySeconds * 1000 : Date.parse(retryHeader ?? '');
  const quota: SearchQuota = {
    dailyCredits: integerHeader(headers, 'X-RateLimit-Limit'),
    remainingCredits: integerHeader(headers, 'X-RateLimit-Remaining'),
    requestCredits: integerHeader(headers, 'X-RateLimit-Credits-Used'),
    resetsAt: resetSeconds === undefined ? undefined : timestampAt(receivedAt + resetSeconds * 1000),
    retryAfterUntil: allowRetryAfter && retryTime > receivedAt ? timestampAt(retryTime) : undefined,
  };
  return Object.values(quota).some(value => value !== undefined) ? quota : undefined;
}
