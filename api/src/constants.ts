export const STATUSES = ['pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled'] as const;

export type Status = (typeof STATUSES)[number];
