import { forwardUpstream } from './http/forward';
import { gatewayResponses } from './http/responses';
import { doiRoute } from './providers/doi';
import { openAlexRoute } from './providers/openalex';
import type { GatewayEnv, UpstreamRoute } from './types';

function routeRequest(url: URL, env: GatewayEnv): UpstreamRoute {
  switch (url.pathname) {
    case '/openalex':
      return openAlexRoute(url.searchParams);
    case '/crossref':
      return doiRoute('crossref', url.searchParams);
    case '/unpaywall':
      return doiRoute('unpaywall', url.searchParams, env.OPERATOR_EMAIL);
    default:
      return { error: 'Unknown endpoint', status: 404 };
  }
}

export async function handleRequest(request: Request, env: GatewayEnv): Promise<Response> {
  const responses = gatewayResponses(env.ALLOWED_ORIGIN);
  if (request.headers.get('Origin') !== env.ALLOWED_ORIGIN) {
    return responses.json({ error: 'Origin not allowed' }, 403);
  }
  if (request.method === 'OPTIONS') return responses.preflight();
  if (request.method !== 'GET') return responses.json({ error: 'GET only' }, 405);

  const route = routeRequest(new URL(request.url), env);
  if ('error' in route) return responses.json({ error: route.error }, route.status);
  return forwardUpstream(route.upstream, responses);
}
