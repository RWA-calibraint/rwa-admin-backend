import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';

import { PeriodType } from 'src/@typings/enums';

export class DashboardQueryDto {
  @IsDateString()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error('Invalid start date');
    return date;
  })
  startDate: Date;

  @IsDateString()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) throw new Error('Invalid end date');
    return date;
  })
  endDate: Date;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  year?: number;

  @IsOptional()
  @IsEnum(PeriodType)
  periodType?: PeriodType;
}

export class TokenMetricsQueryDto {
  @IsOptional()
  @IsNumber()
  year?: number;

  @IsOptional()
  @IsNumber()
  month?: number;

  @IsOptional()
  @IsNumber()
  week?: number;
}
