import type { UpstreamRoute } from '../types';

export function doiRoute(provider: 'crossref' | 'unpaywall', params: URLSearchParams, operatorEmail?: string): UpstreamRoute {
  const doi = params.get('doi') || '';
  if (!/^10\.\d{4,9}\/\S+$/i.test(doi) || doi.length > 300) {
    return { error: 'Invalid DOI', status: 400 };
  }
  const encodedDoi = encodeURIComponent(doi);
  if (provider === 'crossref') {
    return { upstream: new URL(`https://api.crossref.org/works/${encodedDoi}`) };
  }
  if (!operatorEmail) return { error: 'Operator contact not configured', status: 503 };

  const upstream = new URL(`https://api.unpaywall.org/v2/${encodedDoi}`);
  upstream.searchParams.set('email', operatorEmail);
  return { upstream };
}
