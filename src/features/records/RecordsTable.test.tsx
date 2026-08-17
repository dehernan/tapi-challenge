import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { withNuqsTestingAdapter } from "nuqs/adapters/testing";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import type { RecordsResponse } from "./api";

vi.mock("./api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./api")>();
  return { ...actual, fetchRecords: vi.fn() };
});

const { fetchRecords } = await import("./api");
const { RecordsTable } = await import("./RecordsTable");

function renderWithProviders(ui: ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = withNuqsTestingAdapter();
  return render(
    <QueryClientProvider client={queryClient}>
      <Wrapper>{ui}</Wrapper>
    </QueryClientProvider>,
  );
}

const emptyPageInfo = { pageSize: 25, startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false };

describe("RecordsTable", () => {
  it("shows a loading state, then renders a row once data arrives", async () => {
    const response: RecordsResponse = {
      data: [
        {
          id: "rec_1",
          name: "Factura Test",
          amount: 1000,
          currency: "ARS",
          status: "paid",
          dueDate: "2026-01-01",
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      pageInfo: emptyPageInfo,
    };
    vi.mocked(fetchRecords).mockResolvedValue(response);

    renderWithProviders(<RecordsTable />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Factura Test")).toBeInTheDocument());
  });

  it("shows an empty state when there are no matching rows", async () => {
    vi.mocked(fetchRecords).mockResolvedValue({ data: [], pageInfo: emptyPageInfo });

    renderWithProviders(<RecordsTable />);

    await waitFor(() => expect(screen.getByText(/no records match this filter/i)).toBeInTheDocument());
  });

  it("shows an error state with a retry action", async () => {
    vi.mocked(fetchRecords).mockRejectedValue(new Error("boom"));

    renderWithProviders(<RecordsTable />);

    await waitFor(() => expect(screen.getByText(/couldn.?t load records: boom/i)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });
});
