"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchRecordsCount, recordsCountQueryKey } from "./api";
import { useRecordsFilters } from "./useRecordsFilters";

export function useRecordsCountQuery() {
  const { status, from, to } = useRecordsFilters();

  const filters = {
    status: status ?? undefined,
    from: from ?? undefined,
    to: to ?? undefined,
  };

  return useQuery({
    queryKey: recordsCountQueryKey(filters),
    queryFn: () => fetchRecordsCount(filters),
  });
}
