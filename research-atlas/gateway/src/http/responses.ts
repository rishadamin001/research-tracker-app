export function gatewayResponses(allowedOrigin: string) {
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Expose-Headers': 'Retry-After',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  };
  return {
    json(body: unknown, status = 200): Response {
      return new Response(JSON.stringify(body), { status, headers });
    },
    preflight(): Response {
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Max-Age': '86400',
        },
      });
    },
    data(body: Uint8Array<ArrayBuffer>): Response {
      return new Response(body, { headers });
    },
  };
}

export type GatewayResponses = ReturnType<typeof gatewayResponses>;
