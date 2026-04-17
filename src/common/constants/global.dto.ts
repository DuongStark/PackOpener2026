import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";
import { Position, Rarity} from "../../generated/prisma/enums.js";
import { SortOrder } from "../../generated/prisma/internal/prismaNamespace.js";

export interface PaginatedOutput {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

enum SortBy {
    Overall = "overall",
    Name = "name",
    Rarity = 'rarity'
}

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

export class BaseCardQueryDto extends PaginationQueryDto {
  @IsOptional()
    @IsEnum(Rarity)
    rarity?: Rarity

    @IsOptional()
    @IsEnum(Position)
    position?: Position

    @IsOptional()
    search?: string

    @IsOptional()
    @IsEnum(SortBy)
    sortBy?: SortBy = SortBy.Overall

    @IsOptional()
    @IsEnum(SortOrder)
    sortOrder?: SortOrder = SortOrder.desc
}