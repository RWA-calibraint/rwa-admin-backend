import { ApiPropertyOptional } from '@nestjs/swagger';

import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'No of data per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Max(100)
  size?: number;
}
