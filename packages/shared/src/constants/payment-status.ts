export const PAYMENT_STATUS = {
  CREATED: 'CREATED',
  PENDING: 'PENDING',
  CONFIRMING: 'CONFIRMING',
  CONFIRMED: 'CONFIRMED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  UNDERPAID: 'UNDERPAID',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/**
 * Valid transitions for the payment state machine.
 * Key = current state, Value = allowed next states.
 */
export const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  CREATED: ['PENDING', 'EXPIRED'],
  PENDING: ['CONFIRMING', 'FAILED', 'EXPIRED', 'UNDERPAID'],
  CONFIRMING: ['CONFIRMED', 'FAILED'],
  CONFIRMED: [],
  FAILED: [],
  EXPIRED: [],
  UNDERPAID: ['PENDING', 'EXPIRED'],
};
