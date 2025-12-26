import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema, Cart, CartSchema, Product, ProductSchema, Coupon, CouponSchema } from 'src/database/models';
import { OrderRepository, CartRepository, ProductRepository, CouponRepository } from 'src/database/repositories';
import { StripeModule } from '../stripe/stripe.module'; 
import { CouponService } from '../coupon/coupon.service'; 

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
    StripeModule, 
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    CartRepository,
    ProductRepository,
    CouponRepository,
    CouponService, 
  ],
  exports: [OrderService, OrderRepository], 
})
export class OrderModule {}

