import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsOptional, IsString } from 'class-validator';

import { AssetStatus } from '../types/asset.types';

export class TransferAssetDto {
  @ApiProperty()
  @IsString()
  newOwner: string;

  @ApiProperty({ enum: AssetStatus })
  @IsEnum(AssetStatus)
  status: AssetStatus;

  @ApiProperty()
  @IsString()
  toOwnerId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
