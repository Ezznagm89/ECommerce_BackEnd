import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from 'src/database/models';
import { CouponRepository } from 'src/database/repositories';

@Module({
  imports: [MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }])],
  controllers: [CouponController],
  providers: [CouponService, CouponRepository],
  exports: [CouponService, CouponRepository], 
})
export class CouponModule {}

