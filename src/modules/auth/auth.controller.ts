import { Controller, Post, Body, UsePipes, ValidationPipe, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { Public } from 'src/common/decorators/public.decorator'; 

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public() 
  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(registerDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'User registered successfully. Please verify your email.',
      data: user,
    };
  }

  @Public()
  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto) {
    const { user, accessToken } = await this.authService.login(loginDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Login successful',
      data: { user, accessToken },
    };
  }

  @Public()
  @Post('verify-email')
  @UsePipes(new ValidationPipe({ transform: true }))
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(verifyEmailDto);
    return {
      statusCode: HttpStatus.OK,
      message: result.message,
    };
  }
}

