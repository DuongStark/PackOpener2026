import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers?: Record<string, string>; user?: unknown }>();

    // This is a lightweight placeholder guard until JWT strategy is wired in.
    if (request.user) {
      return true;
    }

    const authHeader =
      request.headers?.authorization ?? request.headers?.Authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return true;
    }

    throw new UnauthorizedException('Unauthorized');
  }
}
