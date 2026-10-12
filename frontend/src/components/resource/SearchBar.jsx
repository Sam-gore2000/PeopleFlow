// Live search box: results update as you type; Enter or the button searches immediately.
export function SearchBar({ value, onChange, onSearch, onClear, loading = false, activeSearch = "", total = 0, placeholder = "Search" }) {
  return (
    <>
      <div className="table-toolbar">
        <div className="search-input-wrap">
          <input
            className="form-control"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSearch();
              if (event.key === "Escape" && value) onClear();
            }}
            aria-label="Search records"
          />
          {value && (
            <button type="button" className="search-clear" onClick={onClear} title="Clear search" aria-label="Clear search">
              <i className="bi bi-x-lg" />
            </button>
          )}
        </div>
        <button className="btn btn-success" onClick={onSearch} title="Search" aria-label="Search">
          <i className={`bi ${loading ? "bi-arrow-repeat spin" : "bi-search"}`} />
        </button>
      </div>
      {activeSearch && (
        <p className="search-summary">
          {total} {total === 1 ? "result" : "results"} for <strong>"{activeSearch}"</strong>
          <button type="button" className="search-summary-clear" onClick={onClear}>Clear</button>
        </p>
      )}
    </>
  );
}
