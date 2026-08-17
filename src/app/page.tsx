import { Suspense } from "react";

import { ClearFiltersButton } from "@/features/records/ClearFiltersButton";
import { DateRangeFilter } from "@/features/records/DateRangeFilter";
import { Pagination } from "@/features/records/Pagination";
import { RecordsCount } from "@/features/records/RecordsCount";
import { RecordsTable } from "@/features/records/RecordsTable";
import { StatusFilter } from "@/features/records/StatusFilter";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold">Records</h1>
      {/* useRecordsFilters reads URL search params (via nuqs), which Next.js requires a Suspense boundary for during static prerendering. */}
      <Suspense fallback={<p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>}>
        <div className="flex flex-wrap items-end gap-4">
          <StatusFilter />
          <DateRangeFilter />
          <ClearFiltersButton />
        </div>
        <div className="flex items-center justify-between">
          <RecordsCount />
          <Pagination />
        </div>
        <RecordsTable />
      </Suspense>
    </div>
  );
}
