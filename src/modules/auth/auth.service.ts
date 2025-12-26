import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from 'src/database/repositories';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserDocument } from 'src/database/models';
import { TokenService } from './token.service';
import { TokenType } from 'src/common/enums';
import { VerifyEmailDto } from './dto/verify-email.dto';
import mongoose from 'mongoose'; 

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<UserDocument> {
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const user = await this.userRepository.create(registerDto);

    return user;
  }

  async login(loginDto: LoginDto): Promise<{ user: UserDocument; accessToken: string }> {
    const user = await this.userRepository.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.comparePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.tokenService.generateToken(
      user._id,
      user.role,
      TokenType.ACCESS_TOKEN,
    );

    return { user, accessToken };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(verifyEmailDto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email already verified');
    }

    await this.userRepository.findByIdAndUpdate(user._id.toString(), { isEmailVerified: true });
    return { message: 'Email verified successfully' };
  }
}

