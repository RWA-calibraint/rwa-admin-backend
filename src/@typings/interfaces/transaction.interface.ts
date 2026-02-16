import {
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  TransactionType,
} from '../enums/transaction.enum';

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  buyerId: string;
  sellerId: string;
  assetId: string;
  amount: number;
  amountInEth?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionDate: Date;
  metadata?: Record<string, any>;
}
