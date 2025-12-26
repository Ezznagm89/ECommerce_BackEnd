import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TokenService } from 'src/modules/auth/token.service';
import { Socket } from 'socket.io'; 

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tokenService: TokenService, 
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    if (isPublic) {
      return true;
    }

    const type = context.getType();
    let token: string | undefined;

    if (type === 'http') {
      const request = context.switchToHttp().getRequest();
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('No authorization token provided');
      }
      token = authHeader.split(' ')[1];
    } else if (type === 'ws') {
      const client: Socket = context.switchToWs().getClient();

      token =
        client.handshake.headers.authorization?.split(' ')[1] ||
        (client.handshake.query.token as string);
      if (!token) {
        throw new UnauthorizedException('No authorization token provided for WebSocket');
      }
    } else {

      throw new UnauthorizedException('Unsupported context type for authentication');
    }

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const user = await this.tokenService.verifyToken(token);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      if (type === 'http') {
        context.switchToHttp().getRequest().user = user;
      } else if (type === 'ws') {
        context.switchToWs().getClient().user = user;
      }
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}

