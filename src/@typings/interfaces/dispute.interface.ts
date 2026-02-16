import { DisputeStatus } from 'src/shared-kernel/typings/status.enum';

export interface Dispute {
  id: string;
  paymentId: string;
  reason: string;
  status: DisputeStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface DisputeResolution {
  disputeId: string;
  resolution: string;
  status: DisputeStatus;
  resolvedBy: string;
  resolvedAt: Date;
}
