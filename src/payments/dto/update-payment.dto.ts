import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

import {
  DisputeStatus,
  RefundStatus,
} from 'src/shared-kernel/typings/status.enum';

import { PaymentStatus } from '../../@typings/enums/transaction.enum';

export class UpdatePaymentDto {
  @ApiProperty({ enum: PaymentStatus, description: 'Payment status' })
  @IsEnum(PaymentStatus)
  @IsOptional()
  paymentStatus?: PaymentStatus;

  @ApiProperty({ enum: DisputeStatus, description: 'Dispute status' })
  @IsEnum(DisputeStatus)
  @IsOptional()
  disputeStatus?: DisputeStatus;

  @ApiProperty({ description: 'Dispute reason' })
  @IsString()
  @IsOptional()
  disputeReason?: string;

  @ApiProperty({ enum: RefundStatus, description: 'Refund status' })
  @IsEnum(RefundStatus)
  @IsOptional()
  refundStatus?: RefundStatus;

  @ApiProperty({ description: 'Asset status' })
  @IsString()
  @IsOptional()
  assetStatus?: string;
}
