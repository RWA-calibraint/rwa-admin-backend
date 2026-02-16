export enum PAYMENT_METHOD {
  STRIPE = 'stripe',
  WALLET = 'wallet',
}

export enum PAYMENT_STATUS {
  COMPLETED = 'completed',
  PENDING = 'pending',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}
