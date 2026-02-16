import { ApiProperty } from '@nestjs/swagger';

import { IsEnum, IsString } from 'class-validator';

import { USER_STATUS } from 'src/shared-kernel/utils/constants/user-enums';

export class UpdateUserStatus {
  @ApiProperty({ description: 'User status' })
  @IsEnum(USER_STATUS)
  status: USER_STATUS;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description: string;
}
