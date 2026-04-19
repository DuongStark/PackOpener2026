import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Role } from '../../../generated/prisma/enums.js';

export class UpdateUserDto extends PartialType(CreateUserDto) {}

export class UpdateUserByAdminDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    username?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean

    @IsOptional()
    @IsInt()
    @Min(0)
    balance?: number;

    @IsOptional()
    @IsString()
    @MaxLength(255)
    description?: string;
}
