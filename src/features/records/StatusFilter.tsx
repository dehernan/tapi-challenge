"use client";

import { STATUSES, type Status } from "./constants";
import { useRecordsFilters } from "./useRecordsFilters";

export function StatusFilter() {
  const { status, setStatus } = useRecordsFilters();

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-zinc-600 dark:text-zinc-400">Status</span>
      <select
        className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        value={status ?? ""}
        onChange={(e) => setStatus(e.target.value === "" ? null : (e.target.value as Status))}
      >
        <option value="">All</option>
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
