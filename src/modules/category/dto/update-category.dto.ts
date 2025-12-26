import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { AtLeastOneProperty } from 'src/common/decorators';
import { IsOptional, IsString } from 'class-validator';
import mongoose from 'mongoose';
import { IsArrayOfObjectIds } from 'src/common/decorators';

@AtLeastOneProperty(['name', 'slogan', 'brands'], {
  message: 'At least one of name, slogan, or brands must be provided for update',
})
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  image?: string;

  @IsOptional()
  @IsArrayOfObjectIds({ message: 'Brands must be an array of valid MongoDB IDs' })
  brands?: mongoose.Types.ObjectId[];
}

