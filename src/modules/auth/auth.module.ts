import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/models';
import { UserRepository } from 'src/database/repositories';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/common/guards';
import { RolesGuard } from 'src/common/guards';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    TokenService,
    {
      provide: APP_GUARD, 
      useClass: AuthGuard,
    },
    RolesGuard, 
  ],
  exports: [TokenService, JwtModule], 
})
export class AuthModule {}

