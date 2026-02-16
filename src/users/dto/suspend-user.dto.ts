import { ApiProperty } from '@nestjs/swagger';

import { IsDate, IsOptional, IsString } from 'class-validator';

import { ERROR_MESSAGES } from 'src/shared-kernel/utils/constants/exceptions/error-message';

export class SuspendUserDto {
  @ApiProperty({
    description: 'Expiry date of user of suspension',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDate({ message: ERROR_MESSAGES.DTOS.SUSPEND_EXPIRY_AT.INVALID_DATE })
  suspendExpiryAt: Date;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description: string;
}
