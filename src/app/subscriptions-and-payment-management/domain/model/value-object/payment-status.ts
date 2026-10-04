/**
 * Enumeration representing the transaction status of a payment.
 */
export enum PaymentStatus {
  REQUESTED = 'REQUESTED',
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  PAID = 'PAID',
  REJECTED = 'REJECTED',
}
