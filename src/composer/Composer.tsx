"use client";

import { createContext, useContext, type ReactNode } from "react";

type ComposerContextValue = {
  value: string;
  onChange: (text: string) => void;
  submit: () => void;
};

const ComposerContext = createContext<ComposerContextValue | null>(null);

/**
 * Only the three things every composition genuinely shares live in context.
 * Case-specific data (channelId, dmId) is passed straight to the part that
 * needs it instead — see README.md.
 */
function useComposer(): ComposerContextValue {
  const context = useContext(ComposerContext);
  if (!context)
    throw new Error("Composer parts must be rendered inside <Composer>");
  return context;
}

type ComposerProps = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
  children: ReactNode;
};

export function Composer({
  value,
  onChange,
  onSubmit,
  children,
}: ComposerProps) {
  const submit = () => onSubmit(value);

  return (
    <ComposerContext.Provider value={{ value, onChange, submit }}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        {children}
      </form>
    </ComposerContext.Provider>
  );
}

// The parts hang off the root, so they're always read as `Composer.Input`.
// They're namespaced rather than exported loose because their names
// (`Header`, `Footer`, `Attachments`) are generic enough to collide with a
// consuming file's own components — and because `Composer.` + autocomplete
// is how you discover what's available to compose.
//
// Bodies are stubs, per the brief: the exercise is the composition API, not
// the UI. The only thing worth reading here is which parts pull shared state
// out of context and which take their own props.

Composer.Header = function Header() {
  return <header>Header</header>;
};

Composer.Footer = function Footer({ children }: { children: ReactNode }) {
  return <footer>{children}</footer>;
};

Composer.Input = function Input() {
  const { value, onChange } = useComposer();
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
};

Composer.Attachments = function Attachments() {
  return <button type="button">Attach</button>;
};

Composer.Formatting = function Formatting() {
  return <button type="button">Format</button>;
};

Composer.Emojis = function Emojis() {
  return <button type="button">Emoji</button>;
};

Composer.AlsoSendToChannel = function AlsoSendToChannel({
  channelId,
}: {
  channelId: string;
}) {
  return (
    <label>
      <input type="checkbox" /> Also send to channel {channelId}
    </label>
  );
};

Composer.AlsoSendToDM = function AlsoSendToDM({ dmId }: { dmId: string }) {
  return (
    <label>
      <input type="checkbox" /> Also send to DM {dmId}
    </label>
  );
};

Composer.Submit = function Submit() {
  const { submit } = useComposer();
  return (
    <button type="button" onClick={submit}>
      Send
    </button>
  );
};

Composer.Forward = function Forward() {
  const { submit } = useComposer();
  return (
    <button type="button" onClick={submit}>
      Forward
    </button>
  );
};

Composer.SaveEdit = function SaveEdit() {
  const { submit } = useComposer();
  return (
    <button type="button" onClick={submit}>
      Save
    </button>
  );
};

Composer.CancelEdit = function CancelEdit({
  onCancel,
}: {
  onCancel: () => void;
}) {
  return (
    <button type="button" onClick={onCancel}>
      Cancel
    </button>
  );
};
