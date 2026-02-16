import { ApiProperty } from '@nestjs/swagger';

import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { AssetStatus } from '../types';

export class VerifyAssetDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ enum: AssetStatus })
  @IsEnum(AssetStatus)
  status: AssetStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiProperty()
  @IsDateString()
  @IsOptional()
  listedDate?: string;

  @ApiProperty()
  @IsOptional()
  tokens?: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  isfeaturedAsset?: boolean;
}
