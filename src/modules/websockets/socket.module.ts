import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { WebsocketTokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/database/models';
import { UserRepository } from 'src/database/repositories';
import { AuthModule } from '../auth/auth.module'; 

@Module({
  imports: [

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
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ConfigModule,
    AuthModule, 
  ],
  providers: [SocketGateway, WebsocketTokenService, UserRepository],
  exports: [SocketGateway, WebsocketTokenService], 
})
export class WebsocketsModule {}

