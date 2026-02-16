export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  TRANSFER = 'transfer',
  REFUND = 'refund',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CRYPTO = 'crypto',
  FIAT = 'fiat',
  STRIPE = 'stripe',
  WALLET = 'wallet',
}

export enum PaymentStatus {
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  PENDING = 'pending',
  PROCESSING = 'processing',
}
