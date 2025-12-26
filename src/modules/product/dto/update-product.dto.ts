import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { AtLeastOneProperty } from 'src/common/decorators';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import mongoose from 'mongoose';

@AtLeastOneProperty(
  ['name', 'description', 'price', 'discount', 'quantity', 'category', 'brand'],
  { message: 'At least one field must be provided for update' },
)
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsString({ message: 'Main image URL must be a string' })
  mainImage?: string;

  @IsOptional()
  @IsString({ each: true, message: 'Sub-images must be an array of strings' })
  subImages?: string[];

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Ratings average must be a number' })
  @Min(0, { message: 'Ratings average cannot be negative' })
  @Max(5, { message: 'Ratings average cannot exceed 5' })
  ratingsAverage?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Ratings quantity must be a number' })
  @Min(0, { message: 'Ratings quantity cannot be negative' })
  ratingsQuantity?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Sold quantity must be a number' })
  @Min(0, { message: 'Sold quantity cannot be negative' })
  sold?: number;
}

