"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchRecords, recordsQueryKey } from "./api";
import { useRecordsFilters } from "./useRecordsFilters";

const PAGE_SIZE = 25;

export function useRecordsQuery() {
  const { status, from, to, sortDir, cursor, edge } = useRecordsFilters();

  const params = {
    pageSize: PAGE_SIZE,
    sortDir,
    status: status ?? undefined,
    from: from ?? undefined,
    to: to ?? undefined,
    cursor: cursor ?? undefined,
    edge: edge ?? undefined,
  };

  return useQuery({
    queryKey: recordsQueryKey(params),
    queryFn: () => fetchRecords(params),
    placeholderData: keepPreviousData,
  });
}
