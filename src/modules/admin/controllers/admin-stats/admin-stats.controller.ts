import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Role } from '../../../../generated/prisma/enums.js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { AdminService } from '../../admin.service.js';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';
import { AdminRevenueQueryDto } from '../../dto/admin-revenue-query.dto.js';

@Controller('admin/stats')
@Roles(Role.ADMIN)
export class AdminStatsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getRevenueStats(@Query() query: AdminRevenueQueryDto) {
    return this.adminService.getRevenueStats(query);
  }
}
