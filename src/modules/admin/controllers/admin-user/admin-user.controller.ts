import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserService } from '../../../user/user.service.js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';

@Controller('admin/users')
@Roles(Role.ADMIN)
export class AdminUserController {

    constructor(private readonly userService: UserService) {}

    @Get()
    @UseGuards(JwtAuthGuard ,RolesGuard)
    getAllUsers(@Query() query) {
        return this.userService.getAllUsers(query);
    }
    
}
