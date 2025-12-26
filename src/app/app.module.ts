import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { LoggerMiddleware } from "src/common/middleware/logger.middleware";
import { UserModule } from "src/modules/user/user.module";
import { AuthModule } from "src/modules/auth/auth.module";
import { BrandModule } from "src/modules/brand/brand.module";
import { CategoryModule } from "src/modules/category/category.module";
import { ProductModule } from "src/modules/product/product.module";
import { CartModule } from "src/modules/cart/cart.module";
import { CouponModule } from "src/modules/coupon/coupon.module";
import { OrderModule } from "src/modules/order/order.module";
import { WebsocketsModule } from "src/modules/websockets/socket.module";
import { StripeModule } from "src/modules/stripe/stripe.module";
import { CacheModule } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-redis-store";
import { CacheInterceptor } from "@nestjs/cache-manager";
import { APP_INTERCEPTOR, APP_FILTER } from "@nestjs/core"; 
import { AllExceptionsFilter } from "src/common/filters/all-exceptions.filter"; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "./config/.env",
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>("MONGO_URI"),

      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get<string>("REDIS_HOST"),
        port: configService.get<number>("REDIS_PORT"),
        ttl: 300, 
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),
    UserModule,
    AuthModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    CartModule,
    CouponModule,
    OrderModule,
    WebsocketsModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR, 
      useClass: CacheInterceptor,
    },
    {
      provide: APP_FILTER, 
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}

