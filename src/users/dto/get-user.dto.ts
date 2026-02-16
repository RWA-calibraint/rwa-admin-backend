import { ApiPropertyOptional } from '@nestjs/swagger';

import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

import { USER_STATUS } from 'src/shared-kernel/utils/constants/user-enums';
import { PaginationDto } from 'src/shared-kernel/utils/dto/pagination.dto';

export class GetUserDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'vishnu',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => value.trim())
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter user by user status',
    example: 'active',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',');
    }
    return value;
  })
  @IsEnum(USER_STATUS, { each: true })
  status?: USER_STATUS[];
}
