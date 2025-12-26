import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import mongoose from 'mongoose';

export class QueryProductDto {
  @IsOptional()
  @IsString({ message: 'Search term must be a string' })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Category ID must be a string' })
  category?: mongoose.Types.ObjectId;

  @IsOptional()
  @IsString({ message: 'Brand ID must be a string' })
  brand?: mongoose.Types.ObjectId;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Min price must be a number' })
  @Min(0, { message: 'Min price cannot be negative' })
  minPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Max price must be a number' })
  @Min(0, { message: 'Max price cannot be negative' })
  maxPrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({}, { message: 'Min rating must be a number' })
  @Min(0, { message: 'Min rating cannot be negative' })
  @Max(5, { message: 'Min rating cannot exceed 5' })
  minRating?: number;
}

