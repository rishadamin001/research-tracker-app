export function ReferencePageButtons({ name, page, total, onChange }: { name: string; page: number; total: number; onChange: (page: number) => void }) {
  if (total <= 1) return null;
  return <nav className="button-row" aria-label={name}>
    <button type="button" className="button secondary small" disabled={page === 0} onClick={() => onChange(page - 1)}>Previous page</button>
    <span>Page {page + 1} of {total}</span>
    <button type="button" className="button secondary small" disabled={page + 1 >= total} onClick={() => onChange(page + 1)}>Next page</button>
  </nav>;
}
