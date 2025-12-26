import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema, Product, ProductSchema } from 'src/database/models';
import { CartRepository, ProductRepository } from 'src/database/repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema }, 
    ]),
  ],
  controllers: [CartController],
  providers: [CartService, CartRepository, ProductRepository],
  exports: [CartService, CartRepository], 
})
export class CartModule {}

