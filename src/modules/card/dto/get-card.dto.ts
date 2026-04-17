import { IsEnum, IsInt, IsOptional, Max } from "class-validator";
import { Position, Rarity } from "../../../generated/prisma/enums.js";
import { Type } from "class-transformer";


enum SortBy {
    Overall = "overall",
    Name = "name",
    Rarity = 'rarity'
}

enum SortOrder {
    Asc = "asc",
    Desc = "desc"
}


export class getCardDto {
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
    sortOrder?: SortOrder = SortOrder.Desc

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number = 1

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Max(100)
    limit?: number = 20

}