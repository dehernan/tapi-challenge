import { act, renderHook, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

import { useRecordsFilters } from "./useRecordsFilters";

function lastUrlUpdate(spy: ReturnType<typeof vi.fn>): URLSearchParams {
  const call = spy.mock.calls.at(-1) as [{ searchParams: URLSearchParams }];
  return call[0].searchParams;
}

describe("useRecordsFilters", () => {
  it("reads filters and sort out of the URL", () => {
    const { result } = renderHook(() => useRecordsFilters(), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?status=paid&sortDir=asc" }),
    });

    expect(result.current.status).toBe("paid");
    expect(result.current.sortDir).toBe("asc");
  });

  it("defaults sortDir to desc when absent", () => {
    const { result } = renderHook(() => useRecordsFilters(), {
      wrapper: withNuqsTestingAdapter(),
    });

    expect(result.current.sortDir).toBe("desc");
  });

  it("clears cursor/edge when the status filter changes", async () => {
    const onUrlUpdate = vi.fn();
    const { result } = renderHook(() => useRecordsFilters(), {
      wrapper: withNuqsTestingAdapter({ searchParams: "?cursor=abc&edge=after", onUrlUpdate }),
    });

    act(() => result.current.setStatus("failed"));
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());

    const params = lastUrlUpdate(onUrlUpdate);
    expect(params.get("status")).toBe("failed");
    expect(params.has("cursor")).toBe(false);
    expect(params.has("edge")).toBe(false);
  });

  it("clearFilters resets filters and pagination but keeps sortDir", async () => {
    const onUrlUpdate = vi.fn();
    const { result } = renderHook(() => useRecordsFilters(), {
      wrapper: withNuqsTestingAdapter({
        searchParams: "?status=paid&from=2026-01-01&to=2026-02-01&sortDir=asc&cursor=abc&edge=after",
        onUrlUpdate,
      }),
    });

    act(() => result.current.clearFilters());
    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled());

    const params = lastUrlUpdate(onUrlUpdate);
    expect(params.has("status")).toBe(false);
    expect(params.has("from")).toBe(false);
    expect(params.has("to")).toBe(false);
    expect(params.has("cursor")).toBe(false);
    expect(params.has("edge")).toBe(false);
    expect(params.get("sortDir")).toBe("asc");
  });
});
