import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PackStatus } from '../../../generated/prisma/enums.js';
import { PaginationQueryDto } from '../../../common/constants/global.dto.js';
import { Transform } from 'class-transformer';

export class getUserPacksDto extends PaginationQueryDto {
  @IsEnum(PackStatus)
  @IsOptional()
  status?: PackStatus;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeCards?: boolean;
}
