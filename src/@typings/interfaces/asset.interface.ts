import { AssetStatus } from '../enums/asset.enum';

import { BaseMetrics } from './base.interface';
export interface AssetDetails {
  assetId: string;
  name: string;
  category: string;
  sellerName: string;
  submissionDate: Date;
  status: AssetStatus;
  price?: number;
  priceInEth?: number;
  totalViews?: number;
}

export interface VerificationDetails {
  status: AssetStatus;
  remarks?: string;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface PhysicalVerificationDetails {
  status: boolean;
  verificationDate: Date;
  verifiedBy: string;
  location?: string;
}

export interface AssetTransfer {
  fromUserId: string;
  toUserId: string;
  transferDate: Date;
  status: string;
  transactionHash?: string;
}

export interface AssetMetrics extends BaseMetrics {
  pending: number;
  approved: number;
  partiallyApproved: number;
  rejected: number;
  byType: Record<string, number>;
}

export interface AssetVerification {
  verifierId: string;
  status: string;
  notes?: string;
  verifiedAt?: Date;
}
