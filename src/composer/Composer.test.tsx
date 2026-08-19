import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Composer } from "./Composer";
import {
  ChannelMessageComposer,
  EditMessageComposer,
  ForwardMessageComposer,
} from "./useCases";

// The stubs aren't worth testing. What is: that the shared context actually
// reaches parts at different depths, and that misuse fails loudly.

describe("Composer composition API", () => {
  it("wires submit through to differently-composed footers", async () => {
    for (const Composition of [
      ChannelMessageComposer,
      ForwardMessageComposer,
    ]) {
      const onSubmit = vi.fn();
      const { unmount } = render(
        <Composition value="hello" onChange={vi.fn()} onSubmit={onSubmit} />,
      );

      screen.getByRole("button", { name: /send|forward/i }).click();

      expect(onSubmit).toHaveBeenCalledWith("hello");
      unmount();
    }
  });

  it("lets a composition opt out of parts by not rendering them", () => {
    const channel = render(
      <ChannelMessageComposer value="" onChange={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /attach/i })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    channel.unmount();

    // Editing omits Header and Attachments — no `isEditing` flag involved,
    // they're simply absent from the composition.
    render(
      <EditMessageComposer
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /attach/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("banner")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("throws when a part is rendered outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Composer.Input />)).toThrow(
      /must be rendered inside/i,
    );
  });
});
