import { useState } from 'react';
import { useSearchParams } from 'react-router';

/** List filters: page, page size, search and any filter, by name. */
export type ListParams = { page: number; pageSize: number } & Record<string, string | number | undefined>;
export type SetParams = (patch: Partial<ListParams>, options?: { keepPage?: boolean }) => void;

const NUMERIC = new Set(['page', 'pageSize']);

function merge(current: ListParams, patch: Partial<ListParams>, keepPage?: boolean): ListParams {
  const next = { ...current, ...patch } as ListParams;
  // Changing a filter goes back to page 1, unless only the page itself changed.
  const onlyPaging = Object.keys(patch).every((key) => NUMERIC.has(key));
  if (!onlyPaging && !keepPage) next.page = 1;
  return next;
}

/** List state kept in the URL, so a filtered list survives refresh, sharing and the back button. */
export function useUrlParams(defaults: Partial<ListParams> = {}): [ListParams, SetParams] {
  const [search, setSearch] = useSearchParams();
  const params: ListParams = { page: 1, pageSize: 20, ...defaults } as ListParams;
  search.forEach((value, key) => {
    params[key] = NUMERIC.has(key) ? Number(value) || params[key] : value;
  });

  const set: SetParams = (patch, options) => {
    const next = merge(params, patch, options?.keepPage);
    const out = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value === undefined || value === '' || value === null) continue;
      if (key === 'page' && value === 1) continue;
      if (key === 'pageSize' && value === 20) continue;
      out.set(key, String(value));
    }
    setSearch(out, { replace: true });
  };
  return [params, set];
}

/** Same API, kept in memory — for lists inside a detail page tab. */
export function useLocalParams(defaults: Partial<ListParams> = {}): [ListParams, SetParams] {
  const [params, setState] = useState<ListParams>({ page: 1, pageSize: 10, ...defaults } as ListParams);
  const set: SetParams = (patch, options) => setState((current) => merge(current, patch, options?.keepPage));
  return [params, set];
}

/** Drops empty values so they aren't sent to the API. */
export function clean(params: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== '' && value !== null));
}
