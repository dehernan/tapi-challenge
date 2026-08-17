"use client";

import { useRecordsCountQuery } from "./useRecordsCountQuery";

const LOCALE = "es-AR";

export function RecordsCount() {
  const countQuery = useRecordsCountQuery();

  return (
    <p className="text-sm text-zinc-600 dark:text-zinc-400">
      {countQuery.isPending && "Counting…"}
      {countQuery.isError && "Count unavailable"}
      {countQuery.data && `${countQuery.data.total.toLocaleString(LOCALE)} records`}
    </p>
  );
}
