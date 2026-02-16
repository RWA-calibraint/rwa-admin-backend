import { ApiProperty } from '@nestjs/swagger';

import { IsMongoId } from 'class-validator';

export class AssetIdParamDto {
  @ApiProperty({
    description: 'Asset ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  assetId: string;
}
