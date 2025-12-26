import { IsNotEmpty, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { IsArrayOfObjectIds } from 'src/common/decorators';
import mongoose from 'mongoose';

export class CreateCategoryDto {
  @IsString({ message: 'Category name must be a string' })
  @IsNotEmpty({ message: 'Category name is required' })
  @MinLength(3, { message: 'Category name must be at least 3 characters long' })
  @MaxLength(50, { message: 'Category name cannot exceed 50 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Slogan must be a string' })
  @MaxLength(200, { message: 'Slogan cannot exceed 200 characters' })
  slogan?: string;

  @IsOptional()
  @IsArrayOfObjectIds({ message: 'Brands must be an array of valid MongoDB IDs' })
  brands?: mongoose.Types.ObjectId[];
}

