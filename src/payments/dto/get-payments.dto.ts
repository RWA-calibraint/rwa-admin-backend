import { ApiPropertyOptional } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

import {
  PAYMENT_METHOD,
  PAYMENT_STATUS,
} from 'src/shared-kernel/utils/constants/transactions';
import { PaginationDto } from 'src/shared-kernel/utils/dto/pagination.dto';

export class GetPaymentsDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by seller or buyer name',
    example: 'vishnu',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter user by payment status',
    example: PAYMENT_STATUS.FAILED,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  @IsEnum(PAYMENT_STATUS, { each: true })
  paymentStatus?: PAYMENT_STATUS[];

  @ApiPropertyOptional({
    description: 'Filter user by payment method',
    example: PAYMENT_METHOD.STRIPE,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  @IsEnum(PAYMENT_METHOD, { each: true })
  paymentMethod?: PAYMENT_METHOD[];

  @ApiPropertyOptional({
    description: 'Filter transaction date from',
    example: '2025-03-23',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return String(value).trim();
  })
  from?: Date;

  @ApiPropertyOptional({
    description: 'Filter transaction date to',
    example: '2025-03-23',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    return String(value).trim();
  })
  to?: Date;
}
