import { IsEnum, IsOptional, IsString } from "class-validator";
import { PaginationQueryDto } from "../../../common/constants/global.dto.js";

enum UserSortField {
    USERNAME = 'username',
    EMAIL = 'email',
    CREATED_AT = 'createdAt',
    BALANCE = 'balance',
}

export class getAllUserDto extends PaginationQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsEnum(UserSortField)
    sortBy?: UserSortField;

    @IsOptional()
    @IsEnum(['asc', 'desc'])
    order?: 'asc' | 'desc';
}