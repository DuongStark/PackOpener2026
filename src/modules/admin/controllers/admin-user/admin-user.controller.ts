import { Body, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
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

    
    @Get(':id')
    @UseGuards(JwtAuthGuard ,RolesGuard)
    getUserById(@Param('id') id: string) {
        return this.userService.getUserById(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard ,RolesGuard)
    updateUserRole(@Param('id') id: string, @Body() body, @Req() req) {
        return this.userService.updateUserByAdmin(id, body, req.user.id);
    }
}
