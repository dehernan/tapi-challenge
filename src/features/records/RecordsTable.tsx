"use client";

import { useRecordsFilters } from "./useRecordsFilters";
import { useRecordsQuery } from "./useRecordsQuery";

const LOCALE = "es-AR";

function formatAmount(amount: number, currency: string): string {
  const formatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency });
  // `amount` is stored in the currency's minor unit; minor-unit digit count
  // varies by currency (e.g. CLP has 0, ARS/USD have 2), so read it from
  // the formatter instead of assuming a fixed divisor.
  const minorUnits = formatter.resolvedOptions().maximumFractionDigits ?? 2;
  return formatter.format(amount / 10 ** minorUnits);
}

function formatCalendarDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

export function RecordsTable() {
  const query = useRecordsQuery();
  const { sortDir, toggleSortDir } = useRecordsFilters();

  if (query.isPending) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading…</p>;
  }

  if (query.isError) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
        <p>Couldn&apos;t load records: {query.error.message}</p>
        <button type="button" onClick={() => query.refetch()} className="mt-2 underline">
          Retry
        </button>
      </div>
    );
  }

  const rows = query.data.data;

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">No records match this filter.</p>;
  }

  return (
    <table className={query.isPlaceholderData ? "w-full text-left text-sm opacity-50 transition-opacity" : "w-full text-left text-sm"}>
      <thead>
        <tr className="border-b border-zinc-200 dark:border-zinc-800">
          <th className="py-2 pr-4 font-medium">Name</th>
          <th className="py-2 pr-4 font-medium">Status</th>
          <th className="py-2 pr-4 font-medium">Amount</th>
          <th className="py-2 pr-4 font-medium">Due date</th>
          <th className="py-2 pr-4 font-medium">
            <button type="button" onClick={toggleSortDir} className="flex items-center gap-1">
              Created {sortDir === "desc" ? "↓" : "↑"}
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((record) => (
          <tr key={record.id} className="border-b border-zinc-100 dark:border-zinc-900">
            <td className="py-2 pr-4">{record.name}</td>
            <td className="py-2 pr-4">{record.status}</td>
            <td className="py-2 pr-4">{formatAmount(record.amount, record.currency)}</td>
            <td className="py-2 pr-4">{formatCalendarDate(record.dueDate)}</td>
            <td className="py-2 pr-4">{formatDateTime(record.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
