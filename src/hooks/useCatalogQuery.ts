import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { CatalogQuery } from "@/types";
import { parseCatalogQuery, toSearchParams } from "@/lib/catalog";

/**
 * Đồng bộ trạng thái filter/sort của trang danh mục với URL query string.
 * Nhờ vậy link chia sẻ được, back/forward hoạt động đúng.
 */
export function useCatalogQuery(): {
  query: CatalogQuery;
  setQuery: (patch: Partial<CatalogQuery>) => void;
  reset: () => void;
  isFiltered: boolean;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const query = useMemo(() => parseCatalogQuery(searchParams), [searchParams]);

  const setQuery = useCallback(
    (patch: Partial<CatalogQuery>) => {
      const next: CatalogQuery = { ...query, ...patch };
      setSearchParams(toSearchParams(next), { replace: false });
    },
    [query, setSearchParams],
  );

  const reset = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: false });
  }, [setSearchParams]);

  return {
    query,
    setQuery,
    reset,
    isFiltered: query.category !== "all" || query.q.trim() !== "",
  };
}
