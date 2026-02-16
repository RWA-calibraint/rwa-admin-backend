import { ApiProperty } from '@nestjs/swagger';

import {
  IsDefined,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { DisputeStatus } from 'src/shared-kernel/typings/status.enum';

export class UpdateDisputeDto {
  @ApiProperty({ enum: DisputeStatus, description: 'Dispute status' })
  @IsEnum(DisputeStatus)
  @IsNotEmpty()
  @IsDefined()
  status: DisputeStatus;

  @ApiProperty({ description: 'Dispute remarks', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
