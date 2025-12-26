import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/database/repositories';
import { UserDocument } from 'src/database/models';

interface TokenPayload {
  userId: string;
  role: string;

}

@Injectable()
export class WebsocketTokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {}

  async verifyAccessToken(token: string): Promise<UserDocument> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload: TokenPayload = this.jwtService.verify(token, { secret });
      if (!payload || !payload.userId) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return user;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}

