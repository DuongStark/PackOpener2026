import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Auth } from './entities/auth.entity.js';
import { loginDto } from './dto/login.dto.js';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  create(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  
  @Post('/login')
  @UseGuards(LocalAuthGuard)
  login(@Body() loginDto: loginDto, @Req() req) {
    return this.authService.login(req.user);
  }

}
