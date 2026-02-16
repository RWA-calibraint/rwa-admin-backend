import { ApiProperty } from '@nestjs/swagger';

import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class PhysicalVerifyDto {
  @ApiProperty()
  @IsBoolean()
  status: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
