import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service.js';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.isActive) {
      throw new ForbiddenException('User account is inactive');
    }
    return user;
  }
}
