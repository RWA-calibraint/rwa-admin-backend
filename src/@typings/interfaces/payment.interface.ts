import {
  DisputeStatus,
  RefundStatus,
} from 'src/shared-kernel/typings/status.enum';

import { PaymentMethod, PaymentStatus } from '../enums/transaction.enum';

export interface Payment {
  id: string;
  transactionId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  assetId: string;
  assetName: string;
  amount: number;
  amountInEth?: number;
  commission: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionDate: Date;
  assetStatus?: string;
  disputeStatus?: DisputeStatus;
  disputeReason?: string;
  disputeResolvedAt?: Date;
  refundStatus?: RefundStatus;
  refundAmount?: number;
  refundProcessedAt?: Date;
}

export interface PaymentReceipt {
  paymentId: string;
  receiptNumber: string;
  issueDate: Date;
  details: Payment;
}

export interface RefundRequest {
  paymentId: string;
  reason: string;
  amount: number;
  requestDate: Date;
  status: RefundStatus;
}
