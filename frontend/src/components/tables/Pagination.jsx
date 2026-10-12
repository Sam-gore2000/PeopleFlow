// "Showing 11-20 of 47" + Previous / page numbers / Next. Hidden when everything fits on one page.
function pageList(page, pages) {
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const sorted = [...set].sort((a, b) => a - b);
  const items = [];
  sorted.forEach((n, index) => {
    if (index && n - sorted[index - 1] > 1) items.push(`gap${n}`);
    items.push(n);
  });
  return items;
}

export function Pagination({ page, pageSize, total, onChange, label = "records" }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize) {
    return total ? <div className="pager"><span className="pager-info">Showing {total} {label}</span></div> : null;
  }
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const go = (next) => {
    if (next < 1 || next > pages || next === page) return;
    onChange(next);
  };

  return (
    <nav className="pager" aria-label="Pagination">
      <span className="pager-info">Showing {from}-{to} of {total} {label}</span>
      <div className="pager-buttons">
        <button type="button" onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page"><i className="bi bi-chevron-left" /> Prev</button>
        {pageList(page, pages).map((item) => (typeof item === "string" ? (
          <span key={item} className="pager-gap">...</span>
        ) : (
          <button type="button" key={item} className={item === page ? "active" : ""} aria-current={item === page ? "page" : undefined} onClick={() => go(item)}>{item}</button>
        )))}
        <button type="button" onClick={() => go(page + 1)} disabled={page === pages} aria-label="Next page">Next <i className="bi bi-chevron-right" /></button>
      </div>
    </nav>
  );
}
