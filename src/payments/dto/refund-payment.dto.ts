import { ApiProperty } from '@nestjs/swagger';

import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { RefundStatus } from 'src/shared-kernel/typings/status.enum';

export class RefundPaymentDto {
  @ApiProperty({ description: 'Refund amount' })
  @IsNumber()
  @IsNotEmpty()
  @IsDefined()
  refundAmount: number;

  @ApiProperty({ enum: RefundStatus, description: 'Refund status' })
  @IsEnum(RefundStatus)
  @IsNotEmpty()
  @IsDefined()
  refundStatus: RefundStatus;

  @ApiProperty({ description: 'Refund reason', required: false })
  @IsString()
  @IsOptional()
  reason?: string;
}
