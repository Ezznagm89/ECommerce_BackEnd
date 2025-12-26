import {
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Transform } from 'class-transformer';
import mongoose from 'mongoose';

export class CreateProductDto {
  @IsString({ message: 'Product name must be a string' })
  @IsNotEmpty({ message: 'Product name is required' })
  @MinLength(3, { message: 'Product name must be at least 3 characters long' })
  @MaxLength(500, { message: 'Product name cannot exceed 500 characters' })
  name: string;

  @IsString({ message: 'Description must be a string' })
  @IsNotEmpty({ message: 'Description is required' })
  @MinLength(10, { message: 'Description must be at least 10 characters long' })
  @MaxLength(10000, { message: 'Description cannot exceed 10000 characters' })
  description: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0, { message: 'Price cannot be negative' })
  @IsNotEmpty({ message: 'Price is required' })
  price: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Discount must be a number' })
  @Min(0, { message: 'Discount cannot be negative' })
  @Max(100, { message: 'Discount cannot exceed 100%' })
  discount?: number = 0;

  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Quantity must be a number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  @IsNotEmpty({ message: 'Quantity is required' })
  quantity: number;

  @IsString({ message: 'Category ID must be a string' })
  @IsNotEmpty({ message: 'Category ID is required' })
  category: mongoose.Types.ObjectId;

  @IsString({ message: 'Brand ID must be a string' })
  @IsNotEmpty({ message: 'Brand ID is required' })
  brand: mongoose.Types.ObjectId;
}

