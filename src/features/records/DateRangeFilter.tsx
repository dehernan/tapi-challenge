"use client";

import { useRecordsFilters } from "./useRecordsFilters";

export function DateRangeFilter() {
  const { from, to, setDateRange } = useRecordsFilters();

  return (
    <div className="flex gap-2 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-zinc-600 dark:text-zinc-400">From</span>
        <input
          type="date"
          className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={from ?? ""}
          onChange={(e) => setDateRange(e.target.value || null, to)}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-zinc-600 dark:text-zinc-400">To</span>
        <input
          type="date"
          className="rounded border border-zinc-300 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
          value={to ?? ""}
          onChange={(e) => setDateRange(from, e.target.value || null)}
        />
      </label>
    </div>
  );
}
