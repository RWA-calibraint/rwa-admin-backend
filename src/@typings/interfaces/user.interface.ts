import { AccountStatus, KycStatus } from '../enums/user.enum';
import { BaseMetrics } from '../interfaces/base.interface';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  walletAddress?: string;
  accountStatus: AccountStatus;
  kycStatus: KycStatus;
  transactionCount: number;
  registeredDate: Date;
}

export interface KycDetails {
  status: KycStatus;
  submittedAt?: Date;
  updatedAt?: Date;
  remarks?: string;
}

export interface AccountStatusHistory {
  status: AccountStatus;
  timestamp: Date;
  reason?: string;
}

export interface UserMetrics extends BaseMetrics {
  newRegistrations: number;
  activityStats: ActivityStats[];
}

export interface ActivityStats {
  userId: string;
  username: string;
  actions: number;
  lastActive: Date;
  type: string;
}
