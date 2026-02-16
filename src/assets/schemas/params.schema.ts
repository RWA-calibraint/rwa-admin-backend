import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

import { AssetStatus } from 'src/@typings/enums';
import { TransferStatus } from 'src/shared-kernel/typings/status.enum';

export class AssetIdParamDto {
  @ApiProperty({ description: 'Asset ID', example: '12345' })
  @IsString()
  assetId: string;
}

export class VerificationDto {
  @IsEnum(AssetStatus, { message: 'Invalid status' })
  status: AssetStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}

export class PhysicalVerificationDto {
  @IsBoolean()
  status: boolean;
}

export class TransferDto {
  @IsEnum(TransferStatus, { message: 'Invalid status' })
  status: TransferStatus;
}
