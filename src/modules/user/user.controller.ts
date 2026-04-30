import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UsernameDto } from './dto/username.dto.js';

@Controller('')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('/me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req) {
    return this.userService.getPublicProfile(req.user.id);
  }

  @Patch('/me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Req() req, @Body() username: UsernameDto) {
    const updatedUser = await this.userService.updateUser(
      req.user.id,
      username.username,
    );
    return updatedUser;
  }
}
