import type { Status } from "./constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface RecordDto {
  id: string;
  name: string;
  amount: number;
  currency: string;
  status: Status;
  dueDate: string;
  createdAt: string;
}

export interface PageInfo {
  pageSize: number;
  startCursor: string | null;
  endCursor: string | null;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RecordsResponse {
  data: RecordDto[];
  pageInfo: PageInfo;
}

export type RecordsFilters = {
  status?: Status;
  from?: string;
  to?: string;
};

export type SortDir = "asc" | "desc";
export type Edge = "after" | "before";

export type RecordsPageParams = RecordsFilters & {
  pageSize: number;
  sortDir: SortDir;
  cursor?: string;
  edge?: Edge;
};

function buildQueryString(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value));
  }
  return query.toString();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Request failed with status ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchRecords(params: RecordsPageParams): Promise<RecordsResponse> {
  const { sortDir, ...rest } = params;
  const query = buildQueryString({ ...rest, sort: `createdAt:${sortDir}` });
  return getJson<RecordsResponse>(`/records?${query}`);
}

export function fetchRecordsCount(filters: RecordsFilters): Promise<{ total: number }> {
  const query = buildQueryString(filters);
  return getJson<{ total: number }>(`/records/count?${query}`);
}

export function recordsQueryKey(params: RecordsPageParams) {
  return ["records", params] as const;
}

export function recordsCountQueryKey(filters: RecordsFilters) {
  return ["records-count", filters] as const;
}
