import type { GatewayResponses } from './responses';

const upstreamTimeoutMs = 12_000;
const maxUpstreamBytes = 2_000_000;

export async function forwardUpstream(upstream: URL, responses: GatewayResponses): Promise<Response> {
  try {
    const result = await fetch(upstream, {
      signal: AbortSignal.timeout(upstreamTimeoutMs),
      headers: { Accept: 'application/json' },
    });
    if (result.status === 429) {
      const response = responses.json({ error: 'Free quota reached' }, 429);
      const retryAfter = result.headers.get('Retry-After');
      if (retryAfter) response.headers.set('Retry-After', retryAfter);
      return response;
    }
    if (!result.ok) {
      return responses.json({ error: 'Upstream unavailable' }, result.status === 404 ? 404 : 502);
    }

    const reader = result.body?.getReader();
    if (!reader) return responses.json({ error: 'Empty upstream response' }, 502);

    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxUpstreamBytes) {
        await reader.cancel();
        return responses.json({ error: 'Response too large' }, 502);
      }
      chunks.push(value);
    }

    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.length;
    }
    return responses.data(body);
  } catch {
    return responses.json({ error: 'Research provider unavailable. Try its official website.' }, 503);
  }
}
