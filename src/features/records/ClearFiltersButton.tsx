"use client";

import { useEffect } from "react";

import { Kbd } from "./Kbd";
import { useRecordsFilters } from "./useRecordsFilters";

const FOCUSABLE_TAGS = new Set(["INPUT", "SELECT", "TEXTAREA"]);

export function ClearFiltersButton() {
  const { status, from, to, clearFilters } = useRecordsFilters();
  const hasActiveFilters = status !== null || from !== null || to !== null;

  // Escape is the one shortcut for "clear" that's recognizable without
  // knowing any app-specific convention, unlike the N/P vs J/K vs [/]
  // debate we had over pagination.
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target instanceof HTMLElement && FOCUSABLE_TAGS.has(event.target.tagName)) return;
      if (event.key === "Escape" && hasActiveFilters) clearFilters();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  return (
    <button
      type="button"
      disabled={!hasActiveFilters}
      onClick={clearFilters}
      className="flex items-center gap-1.5 rounded border border-zinc-300 px-3 py-1 text-sm disabled:opacity-40 dark:border-zinc-700"
    >
      Clear filters <Kbd>Esc</Kbd>
    </button>
  );
}
