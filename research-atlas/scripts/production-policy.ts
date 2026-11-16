function gatewayOrigin(value: string) {
  if (!value || (/^\/(?![\/\\])/.test(value) && !/[\\?#\s]/.test(value))) return '';
  let url: URL;
  try { url = new URL(value); }
  catch { throw new Error('VITE_API_URL must be an HTTPS URL or a same-origin absolute path.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error('VITE_API_URL must use HTTPS without credentials, query parameters or fragments.');
  }
  return url.origin;
}

export function productionPolicy(gateway = '') {
  const connections = ["'self'", 'https://api.openalex.org', 'https://api.crossref.org', 'https://www.ebi.ac.uk'];
  const origin = gatewayOrigin(gateway);
  if (origin && !connections.includes(origin)) connections.push(origin);
  const csp = [
    "default-src 'none'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "font-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    `connect-src ${connections.join(' ')}`,
    "base-uri 'none'",
    "object-src 'none'",
    "form-action 'self'",
  ].join('; ');
  return {
    csp,
    referrerPolicy: 'strict-origin-when-cross-origin',
    headers: {
      'Content-Security-Policy': `${csp}; frame-ancestors 'none'`,
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'DENY',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  };
}
