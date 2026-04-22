import { IsDateString, IsIn, IsOptional } from 'class-validator';

export const REVENUE_GRANULARITIES = ['day', 'week', 'month'] as const;

export type RevenueGranularity = (typeof REVENUE_GRANULARITIES)[number];

export class AdminRevenueQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsIn(REVENUE_GRANULARITIES)
  granularity?: RevenueGranularity;
}
