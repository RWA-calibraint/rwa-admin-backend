export const PAYMENT_ERROR_MESSAGES = {
  DISPUTE_NOT_FOUND: (disputeId: string, userId: string) =>
    `Dispute #${disputeId} not found for user #${userId}`,
  PAYMENT_NOT_FOUND: (paymentId: string) => `Payment #${paymentId} not found`,
};
