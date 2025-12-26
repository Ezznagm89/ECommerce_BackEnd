import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema, Category, CategorySchema, Brand, BrandSchema } from 'src/database/models';
import { ProductRepository, CategoryRepository, BrandRepository } from 'src/database/repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema }, 
      { name: Brand.name, schema: BrandSchema }, 
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, CategoryRepository, BrandRepository],
  exports: [ProductService, ProductRepository],
})
export class ProductModule {}

