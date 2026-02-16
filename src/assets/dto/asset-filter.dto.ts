import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

import { AssetStatus } from '../types';

export class AssetFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page must be a valid number' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit must be a valid number' })
  limit?: number;

  @IsOptional()
  @IsString()
  category?: string | string[];

  @IsOptional()
  status?: AssetStatus | AssetStatus[];

  @IsOptional()
  @IsString()
  startDate?: string | null;

  @IsOptional()
  @IsString()
  endDate?: string | null;
}
