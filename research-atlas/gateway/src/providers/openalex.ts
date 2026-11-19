import type { UpstreamRoute } from '../types';

export function openAlexRoute(params: URLSearchParams): UpstreamRoute {
  const query = params.get('search') || '';
  if (query.length < 3 || query.length > 300 || /\b(AND|OR|NOT)\b|[()*]/.test(query)) {
    return { error: 'Unsupported keyword query', status: 400 };
  }
  const page = params.get('page') || '1';
  if (!/^[1-5]$/.test(page)) {
    return { error: 'Page must be between 1 and 5', status: 400 };
  }
  const filter = params.get('filter');
  if (filter && !/^(from_publication_date:\d{4}-01-01(,is_oa:true)?|is_oa:true)$/.test(filter)) {
    return { error: 'Unsupported filter', status: 400 };
  }

  const upstream = new URL('https://api.openalex.org/works');
  upstream.searchParams.set('search', query);
  upstream.searchParams.set('per_page', '20');
  if (page !== '1') upstream.searchParams.set('page', page);
  if (filter) upstream.searchParams.set('filter', filter);
  return { upstream };
}
