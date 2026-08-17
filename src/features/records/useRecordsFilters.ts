"use client";

import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";

import type { Status } from "./constants";
import { STATUSES } from "./constants";
import type { Edge } from "./api";

const SORT_DIRS = ["asc", "desc"] as const;
const EDGES = ["after", "before"] as const;

const parsers = {
  status: parseAsStringLiteral(STATUSES),
  from: parseAsString,
  to: parseAsString,
  sortDir: parseAsStringLiteral(SORT_DIRS).withDefault("desc"),
  cursor: parseAsString,
  edge: parseAsStringLiteral(EDGES),
};

export function useRecordsFilters() {
  const [state, setState] = useQueryStates(parsers);

  function setStatus(status: Status | null) {
    void setState({ status, cursor: null, edge: null });
  }

  function setDateRange(from: string | null, to: string | null) {
    void setState({ from, to, cursor: null, edge: null });
  }

  function toggleSortDir() {
    void setState({ sortDir: state.sortDir === "desc" ? "asc" : "desc", cursor: null, edge: null });
  }

  function goToNextPage(cursor: string) {
    void setState({ cursor, edge: "after" satisfies Edge });
  }

  function goToPreviousPage(cursor: string) {
    void setState({ cursor, edge: "before" satisfies Edge });
  }

  return {
    status: state.status,
    from: state.from,
    to: state.to,
    sortDir: state.sortDir,
    cursor: state.cursor,
    edge: state.edge,
    setStatus,
    setDateRange,
    toggleSortDir,
    goToNextPage,
    goToPreviousPage,
  };
}
