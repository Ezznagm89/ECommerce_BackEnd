import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenType } from 'src/common/enums';
import { UserRepository } from 'src/database/repositories';
import mongoose from 'mongoose';
import { UserDocument } from 'src/database/models';

interface TokenPayload {
  userId: string;
  role: string;

}

@Injectable()
export class TokenService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository,
  ) {}

  async generateToken(
    userId: string | mongoose.Types.ObjectId,
    role: string,
    tokenType: TokenType,
  ): Promise<string> {
    const payload: TokenPayload = { userId: userId.toString(), role };
    const secret = this.configService.get<string>('JWT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_EXPIRATION_TIME');

    let options = {};
    if (tokenType === TokenType.ACCESS_TOKEN) {
      options = { expiresIn };
    }

    return this.jwtService.sign(payload, { secret, ...options });
  }

  async verifyToken(token: string): Promise<UserDocument> {
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

