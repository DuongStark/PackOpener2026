import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/constants/global.dto.js';
import { Type } from '../../../generated/prisma/enums.js';

export class GetTransactionDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(Type)
  type?: Type;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class GetALlTransaction extends GetTransactionDto {
  @IsUUID()
  @IsOptional()
  userId?: string;
}
