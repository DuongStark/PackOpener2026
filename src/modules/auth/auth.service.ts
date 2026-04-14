import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserService } from '../user/user.service.js';
import { access } from 'fs';

@Injectable()
export class AuthService {
  
  constructor(private readonly userService: UserService) {}

  register(createAuthDto: CreateAuthDto) {
    const user = this.userService.createUser(createAuthDto);
    return this.signToken(createAuthDto.email, createAuthDto.password);
}

  signToken(email: string, password: string) {
    return {
      accessToken: ''
    }
  }
}
