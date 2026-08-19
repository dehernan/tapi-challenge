# Composer — composition refactor

The challenge's second exercise. Original component in
[`docs/CHALLENGE.md`](../../docs/CHALLENGE.md).

- [`Composer.tsx`](./Composer.tsx) — the root, its context, and the parts
- [`useCases.tsx`](./useCases.tsx) — **every use case, composed**

## What was actually wrong

Not "too many props" — the specific failure is that **the prop type could
express far more states than the component supported**.

Four mode booleans (`isThread`, `isDM`, `isEditing`, `isForwarding`) = 16
combinations, of which exactly 5 are real (none, thread, DM, editing,
forwarding). The other 11 — `isEditing && isForwarding`,
`isDM && isThread` — are representable, type-check fine, and render
something arbitrary decided by the order the ternaries happen to be
nested in. Add the three `show*` toggles and it's 128 representable
states behind 5 real ones.

Two consequences that get worse over time:

- **Every new use case doubles the space** and forces the existing
  branches to be re-checked against it. That's the "cada caso de uso nuevo
  agrega un booleano" trap from the brief, stated precisely.
- **A flag's meaning spreads.** `isEditing` isn't one branch — it
  suppresses the header _and_ the attachments _and_ swaps the buttons.
  Three unrelated places have to agree on what "editing" means, and
  nothing enforces that they do.

Plus the prop drilling: `channelId` and `dmId` exist on `ComposerProps`
only to be handed to one leaf each. Every caller pays for them in the
type; `Composer` itself never uses them.

## The refactor

**Absence replaces flags.** Editing doesn't render a `Header`, so there's
no `isEditing` for `Header` to check. `showAttachments` becomes "don't put
`<Composer.Attachments />` in the footer." Each use case is a flat list of
what it renders — see [`useCases.tsx`](./useCases.tsx) — with no branch to
trace.

**The 11 invalid states stop being representable.** You can't compose a
composer that is both editing and forwarding, because there is no flag to
set: you either render `<Composer.SaveEdit />` or `<Composer.Forward />`.
The constraint moved out of convention and into the shape of the code.

**Context carries only what's genuinely shared.** `value`, `onChange`, and
`submit` are needed by parts at different depths (`Composer.Input` in the
body, the buttons inside `Composer.Footer`), so threading them as props
would just move the drilling around. They go in context, scoped to one
`<Composer>` — not global state.

**Everything case-specific goes straight to the part that needs it.**
`channelId` is a prop of `Composer.AlsoSendToChannel`, not of `Composer`.
This is the actual fix for the prop drilling: the data no longer passes
through a component that has no use for it, and use cases that don't have
a channel never mention one.

## Trade-offs

**Call sites are more verbose, and nothing enforces a valid composition.**
You can compose a `Composer` with no `Composer.Input`. That's the honest
cost of this pattern.

The mitigation is that [`useCases.tsx`](./useCases.tsx) exports the known
compositions as named components — `ChannelMessageComposer`,
`EditMessageComposer`, … So app code calls a preset (as constrained as the
original, without the boolean soup) and only reaches for raw parts when
building a genuinely new case. Presets for the common path, primitives for
the new path; the original API only offered the former, and made growing
it expensive.

Two smaller ones:

- **Misuse is a runtime error, not a compile error** — rendering a part
  outside `<Composer>` throws from `useComposer()`. It's a loud,
  immediate, first-render failure, which is an acceptable trade for
  keeping the parts independently composable.
- **Dot-notation (`Composer.Input`) over loose named exports.** Two
  reasons beyond taste. The part names are generic — a file that imports a
  bare `Footer` or `Header` collides with its own; `Composer.Footer` never
  does. And `Composer.` + autocomplete is how you find what's available to
  compose, which matters most for an API whose whole premise is assembling
  specific pieces. The cost: parts attached to the root can't be
  tree-shaken individually. Accepted, since a call site that imports
  `Composer` at all will render several of its parts anyway.
- **One file, parts declared as `Composer.X = ...`.** Everything lives in
  `Composer.tsx` — root, context, parts. Splitting the parts out would
  force the context into a third file purely to break the resulting import
  cycle, which is a file existing for a mechanical reason rather than a
  design one. The parts are stubs here; if they grew real bodies, the
  split (and the extra file) would start paying for itself.
