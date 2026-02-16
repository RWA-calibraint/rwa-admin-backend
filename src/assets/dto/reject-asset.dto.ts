import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsString } from 'class-validator';

import { AssetStatus } from '../types';

export class RejectAssetDto {
  @ApiProperty({ enum: AssetStatus })
  @IsEnum(AssetStatus)
  status: AssetStatus;

  @ApiProperty()
  @IsString()
  remarks: string;
}
