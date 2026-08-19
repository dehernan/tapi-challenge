"use client";

import { Composer } from "./Composer";

type ComposerState = {
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
};

// Every use case from the original component, composed. Each one reads as
// what it actually renders — no booleans, no branches to trace.

export function ChannelMessageComposer(props: ComposerState) {
  return (
    <Composer {...props}>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer>
  );
}

export function ThreadReplyComposer({
  channelId,
  ...props
}: ComposerState & { channelId: string }) {
  return (
    <Composer {...props}>
      <Composer.Header />
      <Composer.Input />
      <Composer.AlsoSendToChannel channelId={channelId} />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer>
  );
}

export function DirectMessageComposer({
  dmId,
  ...props
}: ComposerState & { dmId: string }) {
  return (
    <Composer {...props}>
      <Composer.Header />
      <Composer.Input />
      <Composer.AlsoSendToDM dmId={dmId} />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Submit />
      </Composer.Footer>
    </Composer>
  );
}

export function EditMessageComposer({
  onCancel,
  ...props
}: ComposerState & { onCancel: () => void }) {
  return (
    <Composer {...props}>
      {/* No Header and no Attachments — expressed by not rendering them,
          rather than by an `isEditing` flag two other parts have to know about. */}
      <Composer.Input />
      <Composer.Footer>
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.CancelEdit onCancel={onCancel} />
        <Composer.SaveEdit />
      </Composer.Footer>
    </Composer>
  );
}

export function ForwardMessageComposer(props: ComposerState) {
  return (
    <Composer {...props}>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <Composer.Forward />
      </Composer.Footer>
    </Composer>
  );
}

// The payoff: a use case the original didn't have. Under the old API this
// needed a new `isScheduling` boolean inside Composer (doubling its state
// space, and forcing every existing branch to account for it). Here it's
// additive — a new composition, and nothing above changes.
export function ScheduledMessageComposer({
  onPickTime,
  ...props
}: ComposerState & { onPickTime: () => void }) {
  return (
    <Composer {...props}>
      <Composer.Header />
      <Composer.Input />
      <Composer.Footer>
        <Composer.Attachments />
        <Composer.Formatting />
        <Composer.Emojis />
        <button type="button" onClick={onPickTime}>
          Schedule
        </button>
      </Composer.Footer>
    </Composer>
  );
}
