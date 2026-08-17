"use client";

import { useEffect } from "react";

import { Kbd } from "./Kbd";
import { useRecordsFilters } from "./useRecordsFilters";
import { useRecordsQuery } from "./useRecordsQuery";

const FOCUSABLE_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

export function Pagination() {
  const recordsQuery = useRecordsQuery();
  const { goToNextPage, goToPreviousPage } = useRecordsFilters();

  const pageInfo = recordsQuery.data?.pageInfo;

  function next() {
    if (pageInfo?.hasNextPage && pageInfo.endCursor) goToNextPage(pageInfo.endCursor);
  }

  function previous() {
    if (pageInfo?.hasPreviousPage && pageInfo.startCursor) goToPreviousPage(pageInfo.startCursor);
  }

  // N/P paging is the one keyboard shortcut cheap enough to build now for the
  // "operators use this for hours, mostly on the keyboard" requirement —
  // mnemonic and discoverable without prior convention knowledge, unlike
  // arrow keys (reserved for a future row-by-row focus scheme) or vim-style
  // j/k (which conventionally means row focus, not fetching a new page — see
  // Gmail). The fuller shortcut scheme (row focus, a command palette) is
  // designed, not built, in ARCHITECTURE.md.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && FOCUSABLE_TAGS.has(event.target.tagName)) return;
      const key = event.key.toLowerCase();
      if (key === "n") next();
      else if (key === "p") previous();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!pageInfo?.hasPreviousPage}
          onClick={previous}
          className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
        >
          Prev
        </button>
        <button
          type="button"
          disabled={!pageInfo?.hasNextPage}
          onClick={next}
          className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-40 dark:border-zinc-700"
        >
          Next
        </button>
      </div>
      <span className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
        <Kbd>P</Kbd> / <Kbd>N</Kbd> to navigate
      </span>
    </div>
  );
}
