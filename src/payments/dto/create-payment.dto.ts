import { ApiProperty } from '@nestjs/swagger';

import {
  IsDefined,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from 'class-validator';

import { PaymentMethod } from '../../@typings/enums/transaction.enum';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Buyer ID' })
  @IsMongoId()
  @IsNotEmpty()
  @IsDefined()
  buyerId: string;

  @ApiProperty({ description: 'Seller ID' })
  @IsMongoId()
  @IsNotEmpty()
  @IsDefined()
  sellerId: string;

  @ApiProperty({ description: 'Asset ID' })
  @IsMongoId()
  @IsNotEmpty()
  @IsDefined()
  assetId: string;

  @ApiProperty({ description: 'Amount in fiat' })
  @IsNumber()
  @IsNotEmpty()
  @IsDefined()
  amount: number;

  @ApiProperty({ description: 'Amount in ETH', required: false })
  @IsNumber()
  @IsOptional()
  amountInEth?: number;

  @ApiProperty({ description: 'Commission amount' })
  @IsNumber()
  @IsNotEmpty()
  @IsDefined()
  commission: number;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  @IsDefined()
  paymentMethod: PaymentMethod;
}
