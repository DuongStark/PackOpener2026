import { Injectable } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserService } from '../user/user.service.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtServices: JwtService,
  ) {}

  register(createAuthDto: CreateAuthDto): Promise<Omit<any, 'passwordHash'>> {
    return this.userService.createUser(createAuthDto);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      return null;
    }
    const checked = await bcrypt.compare(password, user.passwordHash);
    if (!checked) {
      return null;
    }

    const { passwordHash: _, ...result } = user;
    return result;
  }

  login(user: any): {
    access_token: string;
    tokenType: string;
    expiresIn: string;
  } {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      username: user.username,
    };
    return {
      access_token: this.jwtServices.sign(payload),
      tokenType: 'Bearer',
      expiresIn: '86400',
    };
  }
}
