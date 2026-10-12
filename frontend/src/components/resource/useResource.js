import { useCallback, useEffect, useRef, useState } from "react";
import { resourceApi } from "../../services/resourceApi.js";
import { toLabel } from "../../utils/format.js";

const SEARCH_DELAY_MS = 350;
export const PAGE_SIZE = 10;

// Loads one page of a resource (PAGE_SIZE rows) + metadata, and exposes the CRUD actions.
// The list follows the search box as you type (debounced); Enter or the button searches at once.
// `filters` are extra query parameters (e.g. { year: 2026 }); changing them goes back to page 1.
export function useResource(resource, { filters = {} } = {}) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ title: toLabel(resource), columns: [] });
  const [search, setSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latestRequest = useRef(0);
  const state = useRef({ search: "", page: 1 });
  state.current = { search, page };
  const filterKey = JSON.stringify(filters);

  const load = useCallback(async (q = "", pageNumber = 1) => {
    const requestId = ++latestRequest.current; // a slower, older response must not overwrite a newer one
    setLoading(true);
    try {
      const result = await resourceApi.list(resource, { q: q.trim(), page: pageNumber, limit: PAGE_SIZE, ...JSON.parse(filterKey) });
      if (requestId !== latestRequest.current) return;
      const rows = result.data || [];
      const count = result.total ?? rows.length;
      // A page that became empty (e.g. after deleting its last row) moves back one page.
      if (!rows.length && pageNumber > 1 && count > 0) {
        setPage(Math.max(1, Math.ceil(count / PAGE_SIZE)));
        return;
      }
      setRecords(rows);
      setTotal(count);
      setMeta({ title: result.title, columns: result.columns || [] });
      setActiveSearch(q.trim());
      setError("");
    } catch (err) {
      if (requestId === latestRequest.current) setError(err.message);
      throw err;
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, [resource, filterKey]);

  // New search text or filters: back to page 1.
  useEffect(() => { setPage(1); }, [search, filterKey]);

  // Search as the user types; page changes load straight away.
  useEffect(() => {
    const timer = setTimeout(() => load(search, page).catch(() => {}), search ? SEARCH_DELAY_MS : 0);
    return () => clearTimeout(timer);
  }, [search, page, load]);

  const reload = useCallback(() => load(state.current.search, state.current.page), [load]);

  return {
    records,
    total,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    meta,
    search,
    setSearch,
    activeSearch,
    loading,
    error,
    setError,
    reload,
    searchNow: () => load(state.current.search, state.current.page).catch(() => {}),
    clearSearch: () => setSearch(""),
    async save(id, body) {
      if (id) await resourceApi.update(resource, id, body);
      else await resourceApi.create(resource, body);
      await reload().catch(() => {});
    },
    async remove(id) {
      await resourceApi.remove(resource, id);
      await reload().catch(() => {});
    },
    async setStatus(id, status) {
      await resourceApi.setStatus(resource, id, status);
      await reload().catch(() => {});
    }
  };
}
