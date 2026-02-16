import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty } from 'class-validator';

export class UpdateTokenDto {
  @ApiProperty({ required: true })
  @IsNotEmpty()
  assetId: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  tokens: number;
}
