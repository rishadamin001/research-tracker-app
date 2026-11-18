const publisherMarks = [
  { pattern: /\belsevier\b/i, asset: 'elsevier.svg' },
  { pattern: /^sage(?:\s|$)/i, asset: 'sage.svg' },
  { pattern: /\bspringer nature\b/i, asset: 'springer-nature.svg' },
  { pattern: /\bwiley\b/i, asset: 'wiley.svg' },
] as const;

export function PublicationIdentity({ title, publisher, type }: { title: string; publisher?: string; type?: string }) {
  const mark = publisher && publisherMarks.find(item => item.pattern.test(publisher));
  const initial = (publisher || title).trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const venueLabel = type === 'journal' ? 'Journal' : type === 'conference' ? 'Conference' : type === 'repository' ? 'Repository' : 'Publication venue';
  return <div className="publication-identity">
    <span className="publication-mark" aria-hidden="true">
      {mark ? <img src={`${import.meta.env.BASE_URL}publisher-marks/${mark.asset}`} loading="lazy" alt="" /> : initial || '•'}
    </span>
    <span><small>{venueLabel}</small><strong>{title}</strong>{publisher && <small>{publisher}</small>}</span>
  </div>;
}
