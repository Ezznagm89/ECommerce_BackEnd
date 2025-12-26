import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema, Brand, BrandSchema } from 'src/database/models';
import { CategoryRepository, BrandRepository } from 'src/database/repositories';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Brand.name, schema: BrandSchema }, 
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository, BrandRepository], 
  exports: [CategoryService, CategoryRepository],
})
export class CategoryModule {}

