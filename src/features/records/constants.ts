// Mirrors api/src/constants.ts. No shared package between the two
// independent projects in this pass — see ARCHITECTURE.md.
export const STATUSES = ["pending", "processing", "paid", "failed", "refunded", "cancelled"] as const;

export type Status = (typeof STATUSES)[number];
