import { ApiProperty } from '@nestjs/swagger';

import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { KycStatus } from 'src/shared-kernel/typings/status.enum';

export class UpdateKycDto {
  @ApiProperty({ enum: KycStatus, description: 'KYC status' })
  @IsEnum(KycStatus)
  @IsNotEmpty()
  @IsDefined()
  status: KycStatus;

  @ApiProperty({ description: 'KYC remarks', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
